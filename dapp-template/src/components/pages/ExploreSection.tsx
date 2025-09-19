export default function ExploreSection() {
  return (
    <div className="my-30 gap-20 flex flex-col w-full">

        <div className="text-4xl w-full text-center">Explore</div>

        <div className=" grid grid-cols-2 sm:grid-cols-3 space-y-20 text-center justify-center ">
        <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <div className="text-4xl font-bold">Sign In With Banano</div>
            <div className="mt-2 font-semibold">Your wallet is your passport</div>
        </div>
        <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <div className="text-4xl font-bold">Built for Developers</div>
            <div className="mt-2 font-semibold">A familiar provider API to connect your site or app</div>
        </div>
        <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <div className="text-4xl font-bold">Banano Made Simple</div>
            <div className="mt-2 font-semibold">A clean, friendly wallet built for speed and fun</div>
        </div>
        <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <div className="text-4xl font-bold">NFT Ready</div>
            <div className="mt-2 font-semibold">View, send, and collect Banano NFTs in one place</div>
        </div>
        <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <div className="text-4xl font-bold">Privacy Features</div>
            <div className="mt-2 font-semibold">Support for camo addresses and stealth payments</div>
        </div>
        <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <div className="text-4xl font-bold">Fast & Feeless</div>
            <div className="mt-2 font-semibold">{`Banano’s core strengths, delivered with style`}</div>
        </div>
        </div>
    </div>
  );
}