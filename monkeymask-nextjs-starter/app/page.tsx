import Image from "next/image";
import { ConnectButton } from "@/components/ConnectButton";
import { FunctionalitySection } from "@/components/FunctionalitySection";
import Link from "next/link";
import { DonateButton } from "@/components/DonateButton";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <ConnectButton />
        <FunctionalitySection />
        <DonateButton />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <Link href="https://monkeymask.cc/docs" target="_blank">
          <Button variant="ghost" size="sm">  MonkeyMask Docs</Button>
        </Link>
      </footer>
    </div>
  );
}
