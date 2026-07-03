import Link from 'next/link';
export function Footer() {
  return (
    <footer className="mt-auto w-full mx-auto pb-20 pt-40 font-nunito">
        <div className="flex flex-col items-center text-center text-muted-foreground">
          <div className="text-xl font-extrabold">Made by <Link href="https://x.com/PootCoinSol" target="_blank" className="font-sniglet text-2xl">POOT</Link> for <Link href="https://banano.cc" target="_blank" >Banano</Link></div>
          <div className="text-md text-muted">Made in Uranus, 2026</div>
          <Link href="/promo" className="mt-4 text-md text-muted hover:text-muted-foreground transition-colors">Press kit</Link>
        </div>
    </footer>
  );
}


