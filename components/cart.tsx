/* eslint-disable @next/next/no-img-element */
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  formatPrintName,
  formatPrice,
  getCollection,
  getPhoto,
  getPrintOptionForPhoto,
  getPrintOptionsForPhoto,
  type Photo,
} from "@/lib/catalog";

type CartLine = {
  id: string;
  collectionSlug: string;
  photoId: string;
  sizeId: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, "id" | "quantity">) => void;
  remove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "kurtis-photo-cart";
// Checkout (app/api/checkout/route.ts) rejects quantities above 10.
const maxQuantity = 10;

function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("Cart components must be used inside CartProvider.");
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const returnedFromCheckout = new URLSearchParams(window.location.search).get("order") === "received";

      if (returnedFromCheckout) {
        window.localStorage.removeItem(storageKey);
        setLines([]);
        setOpen(false);
      } else {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          try {
            const savedLines = JSON.parse(saved) as CartLine[];
            setLines(savedLines.filter((line) => {
              const photo = getPhoto(line.collectionSlug, line.photoId);
              return Boolean(photo && getPrintOptionForPhoto(line.collectionSlug, photo, line.sizeId));
            }));
          } catch {
            window.localStorage.removeItem(storageKey);
          }
        }
      }
      setHasLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(lines));
  }, [hasLoaded, lines]);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    open,
    setOpen,
    add: (line) => {
      setLines((current) => {
        const matching = current.find(
          (item) =>
            item.collectionSlug === line.collectionSlug &&
            item.photoId === line.photoId &&
            item.sizeId === line.sizeId,
        );
        if (matching) {
          return current.map((item) =>
            item.id === matching.id ? { ...item, quantity: Math.min(item.quantity + 1, maxQuantity) } : item,
          );
        }
        return [...current, { ...line, id: crypto.randomUUID(), quantity: 1 }];
      });
      setOpen(true);
    },
    remove: (id) => setLines((current) => current.filter((line) => line.id !== id)),
    updateQuantity: (id, quantity) =>
      setLines((current) =>
        quantity < 1
          ? current.filter((line) => line.id !== id)
          : current.map((line) => (line.id === id ? { ...line, quantity: Math.min(quantity, maxQuantity) } : line)),
      ),
  }), [lines, open]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartPanel />
    </CartContext.Provider>
  );
}

export function CartToggle() {
  const { lines, setOpen } = useCart();
  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);
  if (totalItems === 0) return null;
  return (
    <button className="cart-toggle" type="button" onClick={() => setOpen(true)}>
      Cart <span aria-label={`${totalItems} items`}>· {totalItems}</span>
    </button>
  );
}

export function PrintConfigurator({ collectionSlug, photo }: { collectionSlug: string; photo: Photo }) {
  const { add } = useCart();
  const options = getPrintOptionsForPhoto(collectionSlug, photo);
  const [sizeId, setSizeId] = useState(options[0]?.id ?? "");

  if (options.length === 0) return null;

  return (
    <div className="print-configurator">
      <label htmlFor={`size-${photo.id}`}>Print size</label>
      <div className="print-configurator-row">
        <select id={`size-${photo.id}`} value={sizeId} onChange={(event) => setSizeId(event.target.value)}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} — {formatPrice(option.price)}
            </option>
          ))}
        </select>
        <button
          className="button button-ink"
          type="button"
          onClick={() => add({ collectionSlug, photoId: photo.id, sizeId })}
        >
          Add print
        </button>
      </div>
      <p className="config-note">Signed, unframed lustre print. Full composition preserved; borders may be added for panoramic ratios.</p>
    </div>
  );
}

function CartPanel() {
  const { lines, open, setOpen, remove, updateQuantity } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const resolvedLines = lines.flatMap((line) => {
    const collection = getCollection(line.collectionSlug);
    const photo = getPhoto(line.collectionSlug, line.photoId);
    const option = photo && getPrintOptionForPhoto(line.collectionSlug, photo, line.sizeId);
    return collection && photo && option ? [{ line, collection, photo, option }] : [];
  });
  const subtotal = resolvedLines.reduce((sum, item) => sum + item.option.price * item.line.quantity, 0);

  async function checkout() {
    setError(null);
    setCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const payload = await response.json() as { error?: string; url?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Checkout could not start.");
      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not start.");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <aside className={`cart-panel ${open ? "is-open" : ""}`} inert={!open} aria-label="Shopping cart">
      <div className="cart-panel-header">
        <div>
          <p className="eyebrow">Your selections</p>
          <h2>Cart</h2>
        </div>
        <button className="text-button" type="button" onClick={() => setOpen(false)}>Close</button>
      </div>
      {resolvedLines.length === 0 ? (
        <p className="empty-cart">Nothing in your cart yet. Prints are available from each photograph.</p>
      ) : (
        <>
          <ul className="cart-lines">
            {resolvedLines.map(({ line, collection, photo, option }) => (
              <li key={line.id}>
                <img src={photo.variants["768"]} alt="" />
                <div>
                  <strong>{formatPrintName(collection, photo)}</strong>
                  <span>{option.label} · {formatPrice(option.price)}</span>
                  <div className="quantity-control">
                    <button type="button" onClick={() => updateQuantity(line.id, line.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(line.id, line.quantity + 1)} aria-label="Increase quantity">+</button>
                    <button className="remove-line" type="button" onClick={() => remove(line.id)}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="cart-summary"><span>Print subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <p className="cart-footnote">U.S. shipping and applicable tax are calculated at checkout. Fulfillment typically takes 7–14 business days.</p>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-ink cart-checkout" type="button" onClick={checkout} disabled={checkingOut}>
            {checkingOut ? "Opening checkout…" : "Checkout"}
          </button>
        </>
      )}
    </aside>
  );
}
