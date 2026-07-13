import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>© {new Date().getFullYear()} Kurtis Schlepp</p>
      <div>
        <a href="mailto:ks@kurtis.photo">ks@kurtis.photo</a>
        <Link href="/print-info">Print info</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </div>
    </footer>
  );
}
