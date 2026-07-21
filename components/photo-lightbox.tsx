/* eslint-disable @next/next/no-img-element */
"use client";

import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { siteCopy } from "@/content/site-copy";

export function PhotoLightbox({
  alt,
  children,
  counter,
  description,
  detailsAside,
  eyebrow,
  metadata,
  onClose,
  onNext,
  onPrevious,
  src,
  title,
  transitionDirection,
}: {
  alt: string;
  children?: ReactNode;
  counter?: string;
  description?: ReactNode;
  detailsAside?: ReactNode;
  eyebrow?: string;
  metadata?: ReactNode;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  src: string;
  title: string;
  transitionDirection?: "next" | "previous" | null;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);
  const beginClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (closing) return;
      if (event.key === "Escape") beginClose();
      if (event.key === "ArrowLeft") onPrevious?.();
      if (event.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [beginClose, closing, onNext, onPrevious]);

  const directionClass = transitionDirection ? ` is-${transitionDirection}` : "";

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className={`photo-viewer${closing ? " is-closing" : ""}`}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget && event.animationName === "viewer-backdrop-out") onClose();
      }}
      onMouseDown={(event) => {
        if (!closing && event.target === event.currentTarget) beginClose();
      }}
      role="dialog"
    >
      <div className="viewer-topbar">
        <span>{counter}</span>
        <button className="text-button" onClick={beginClose} ref={closeRef} type="button">{siteCopy.gallery.close}</button>
      </div>
      <div className="viewer-main">
        <img alt={alt} className={`viewer-photo${directionClass}`} key={src} src={src} />
      </div>
      {children}
      <div className={`viewer-details${detailsAside ? " has-aside" : ""}`}>
        <div className={`viewer-details-content${directionClass}`} key={src}>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 id={titleId}>{title}</h2>
          {metadata ? <p className="metadata-line">{metadata}</p> : null}
          {description ? <p className="viewer-description">{description}</p> : null}
        </div>
        {detailsAside ? <aside className="viewer-details-aside">{detailsAside}</aside> : null}
      </div>
    </div>
  );
}
