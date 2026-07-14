import Link from "next/link";
import { CartToggle } from "@/components/cart";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="kurtis.photo home">
        kurtis<span>.</span>photo
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/portraits">Portraits</Link>
        <Link href="/prints">Prints</Link>
        <Link href="/about">About</Link>
      </nav>
      <CartToggle />
    </header>
  );
}
