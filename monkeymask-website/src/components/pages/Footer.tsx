import Link from 'next/link';
export function Footer() {
  return (
    <footer className="mt-auto w-full mx-auto pb-20 pt-40 font-nunito">
        <div className="flex flex-col items-center text-center text-muted-foreground">
          <div className="text-xl font-extrabold">Made by <Link href="https://x.com/PootCoinSol" target="_blank" className="font-sniglet text-2xl">POOT</Link> for Banano</div>
          <div className="text-md text-muted">Developed in Uranus 2025</div>
        </div>
    </footer>
  );
}


