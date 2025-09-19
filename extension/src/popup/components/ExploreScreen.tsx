import React, { useMemo, useState } from 'react';
import { Header, Card, ContentContainer, Footer, PageName, Button, Carousel } from './ui';
import { Icon } from '@iconify/react';

// Mock site data - replace with real data when implemented
interface FeaturedSite {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  featured: boolean;
}

interface Site {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  icon: string;
}

const featuredSites: FeaturedSite[] = [
  {
    id: '1',
    name: 'Banano.cc',
    description: 'The memecoin that started it all. Here you find the yellow paper, help, and more!',
    url: 'https://banano.cc',
    category: 'Resources',
    icon: '🍌',
    featured: true
  },
  {
    id: '2',
    name: 'Banano Hub',
    description: 'Explore the Banano ecosystem and find the best projects.',
    url: 'https://hub.banano.network/',
    category: 'Resources',
    icon: '🔍',
    featured: true
  },
  {
    id: '3',
    name: 'MonkeyTalks',
    description: 'The official Banano on-chain messaging platform. Connect with fellow monkeys worldwide.',
    url: 'https://monkeytalks.cc',
    category: 'Faucets',
    icon: '💬',
    featured: true
  }
];

interface Site {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  icon: string;
}

const sites: Site[] = [
  {
    id: "wallets-1",
    name: "Kalium",
    description: "Mobile wallet for BANANO on iOS & Android",
    url: "https://kalium.banano.cc",
    category: "Wallets",
    icon: "📱"
  },
  {
    id: "wallets-2",
    name: "The Banano Stand",
    description: "Browser-based lightwallet, supports Ledger Nano S",
    url: "https://thebananostand.com",
    category: "Wallets",
    icon: "💻"
  },
  {
    id: "wallets-3",
    name: "Paper Wallet Generator",
    description: "Generate & print a paper wallet for BANANO",
    url: "https://banano.cc",
    category: "Wallets",
    icon: "📄"
  },
  {
    id: "wallets-4",
    name: "Camo-Banano",
    description: "Privacy-focused light wallet for BANANO (camo transactions)",
    url: "https://github.com",  // link goes to GitHub repo
    category: "Wallets",
    icon: "🔐"
  },
  {
    id: "wallets-5",
    name: "Ledger",
    description: "Hardware wallet for secure private key storage",
    url: "https://www.ledger.com",
    category: "Wallets",
    icon: "🔒"
  },
  {
    id: "wallets-6",
    name: "Discord Tipbot",
    description: "Tip BANANO on Discord",
    url: "https://chat.banano.cc",
    category: "Wallets",
    icon: "🚀"
  },
  {
    id: "wallets-7",
    name: "Reddit Tipbot",
    description: "Tip BANANO on Reddit",
    url: "https://www.reddit.com",
    category: "Wallets",
    icon: "🐦"
  },
  {
    id: "wallets-8",
    name: "Tip.cc",
    description: "Multi-chain tipping service (Discord) supporting BANANO",
    url: "https://tip.cc",
    category: "Wallets",
    icon: "💬"
  },
  {
    id: "wallets-9",
    name: "Wrkzcoin TipBot",
    description: "Multi-chain Discord tipbot for BANANO",
    url: "https://github.com",  // repo
    category: "Wallets",
    icon: "🤖"
  },
  {
    id: "wallets-10",
    name: "cctip_bot",
    description: "Telegram tipping bot for BANANO",
    url: "https://t.me",
    category: "Wallets",
    icon: "📢"
  },
  {
    id: "wallets-11",
    name: "NanChat",
    description: "Wallet + end-to-end encrypted messaging using BANANO",
    url: "https://nanchat.com",
    category: "Wallets",
    icon: "✉️"
  },
  {
    id: "wallets-12",
    name: "Potassius",
    description: "Fork of Kalium with extra messaging & watch-only features",
    url: "https://apps.apple.com",
    category: "Wallets",
    icon: "🍌"
  },
  {
    id: "wallets-13",
    name: "Potassius (Android)",
    description: "Fork of Kalium with extra messaging & watch-only features",
    url: "https://play.google.com",
    category: "Wallets",
    icon: "🍌"
  },

  // Faucets
  {
    id: "faucets-1",
    name: "Banano Miner",
    description: "Earn BANANO by contributing compute (protein folding) via Folding@Home",
    url: "https://bananominer.com",
    category: "Faucets",
    icon: "🧬"
  },
  {
    id: "faucets-2",
    name: "JungleTV",
    description: "Watch videos to earn BANANO in a community-driven video platform",
    url: "https://jungletv.live",
    category: "Faucets",
    icon: "📺"
  },
  {
    id: "faucets-3",
    name: "Monkey Talks",
    description: "On-chain messaging with built-in faucet",
    url: "https://monkeytalks.cc",
    category: "Faucets",
    icon: "💬"
  },
  {
    id: "faucets-4",
    name: "NanSwap Faucet",
    description: "Swap service with a basic faucet included",
    url: "https://nanswap.com",
    category: "Faucets",
    icon: "🔄"
  },
  {
    id: "faucets-5",
    name: "MonkeySlots",
    description: "Slot-machine game to win BANANO",
    url: "https://monkeyslots.banano.ch",
    category: "Faucets",
    icon: "🎰"
  },
  {
    id: "faucets-6",
    name: "Get-Ban",
    description: "Tasks & anonymous ways to earn BANANO",
    url: "https://get-ban.com",
    category: "Faucets",
    icon: "🎯"
  },
  {
    id: "faucets-7",
    name: "Free Banano Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://thefreebananofaucet.com",
    category: "Faucets",
    icon: "⏱️"
  },
  {
    id: "faucets-8",
    name: "Banano-Faucet",
    description: "Claim BANANO every 24 hours",
    url: "https://banano-faucet.com",
    category: "Faucets",
    icon: "⛲"
  },
  {
    id: "faucets-9",
    name: "I Can Haz Nano",
    description: "Claim BANANO 3 times daily",
    url: "https://icanhaznano.monke42.link",
    category: "Faucets",
    icon: "3️⃣"
  },
  {
    id: "faucets-10",
    name: "Moonano",
    description: "Claim BANANO once every 24 hours",
    url: "https://moonano.net",
    category: "Faucets",
    icon: "🌙"
  },
  {
    id: "faucets-11",
    name: "Gorilla Nation Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://gorillanation.cc",
    category: "Faucets",
    icon: "🦍"
  },
  {
    id: "faucets-12",
    name: "BANXNO Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://faucet.banxno.com",
    category: "Faucets",
    icon: "💧"
  },
  {
    id: "faucets-13",
    name: "Prussia's Banano Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://faucet.prussia.dev",
    category: "Faucets",
    icon: "🏰"
  },
  {
    id: "faucets-14",
    name: "iamgabriel.dev Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://faucet.iamgabriel.dev",
    category: "Faucets",
    icon: "🧑‍💻"
  },
  {
    id: "faucets-15",
    name: "Monkle",
    description: "Word-game to earn BANANO daily",
    url: "https://monkle.vercel.app",
    category: "Faucets",
    icon: "🔤"
  },
  {
    id: "faucets-16",
    name: "BanFaucet",
    description: "Complete tasks to earn BANANO and other cryptos",
    url: "https://banfaucet.com",
    category: "Faucets",
    icon: "🧮"
  },

  // Exchanges
  {
    id: "exchanges-1",
    name: "Coinex",
    description: "Centralized exchange listing BANANO",
    url: "https://www.coinex.com",
    category: "Exchanges",
    icon: "🏦"
  },
  {
    id: "exchanges-2",
    name: "NanSwap",
    description: "Swap service for BANANO & Nano tokens",
    url: "https://nanswap.com",
    category: "Exchanges",
    icon: "🔄"
  },
  {
    id: "exchanges-3",
    name: "Banano.Trade",
    description: "Platform to trade BANANO with Nano, USDC, USDT, etc.",
    url: "https://banano.trade",
    category: "Exchanges",
    icon: "💱"
  },
  {
    id: "exchanges-4",
    name: "Cyphergoat",
    description: "Exchange aggregator for best swap rates",
    url: "https://cyphergoat.com",
    category: "Exchanges",
    icon: "🐐"
  },
  {
    id: "exchanges-5",
    name: "FluffySwap",
    description: "Exchange aggregator for BANANO swaps",
    url: "https://fluffyswap.com",
    category: "Exchanges",
    icon: "💫"
  },
  {
    id: "exchanges-6",
    name: "PancakeSwap",
    description: "DEX supporting wBAN on multiple chains",
    url: "https://pancakeswap.finance",
    category: "Exchanges",
    icon: "🧁"
  },
  {
    id: "exchanges-7",
    name: "UniSwap",
    description: "DEX supporting wBAN on Ethereum",
    url: "https://app.uniswap.org",
    category: "Exchanges",
    icon: "🦄"
  },
  {
    id: "exchanges-8",
    name: "SushiSwap",
    description: "DEX supporting wBAN on Polygon & Arbitrum",
    url: "https://www.sushi.com",
    category: "Exchanges",
    icon: "🍣"
  },
  {
    id: "exchanges-9",
    name: "SpookySwap",
    description: "DEX on Fantom chain for wBAN swaps",
    url: "https://spooky.fi",
    category: "Exchanges",
    icon: "👻"
  },
  {
    id: "exchanges-10",
    name: "Zapper",
    description: "Multichain swap & tracking tool supporting wBAN",
    url: "https://zapper.xyz",
    category: "Exchanges",
    icon: "⚙️"
  },

  // Wrapped Banano (wBAN)
  {
    id: "wban-1",
    name: "Wrap.Banano",
    description: "Bridge from BANANO → Wrapped BANANO on BSC, Polygon, Fantom, Ethereum & Arbitrum",
    url: "https://wrap.banano.cc",
    category: "Wrapped Banano",
    icon: "🌉"
  },
  {
    id: "wban-2",
    name: "wBAN GitBook",
    description: "Documentation for Wrapped BANANO",
    url: "https://wrap-that-potassium.gitbook.io",
    category: "Wrapped Banano",
    icon: "📚"
  },

  // Gaming
  {
    id: "gaming-1",
    name: "CryptoMonKeys",
    description: "Community-driven digital trading cards (NFTs)",
    url: "https://cryptocurrencycheckout.com",
    category: "Gaming",
    icon: "🃏"
  },
  {
    id: "gaming-2",
    name: "Banano Bet",
    description: "Provably fair dice game using BANANO",
    url: "https://bananobet.com",
    category: "Gaming",
    icon: "🎲"
  },
  {
    id: "gaming-3",
    name: "BC.Game",
    description: "Online casino supporting BANANO and other cryptos",
    url: "https://bc.game",
    category: "Gaming",
    icon: "🎰"
  },
  {
    id: "gaming-4",
    name: "NanoGames.io",
    description: "Huge game selection accepting BANANO",
    url: "https://nanogames.io",
    category: "Gaming",
    icon: "🎮"
  },
  {
    id: "gaming-5",
    name: "Banano Sports Pools",
    description: "Bet on sports with BANANO",
    url: "https://www.banano-sports-pools.xyz",
    category: "Gaming",
    icon: "🏟️"
  },
  {
    id: "gaming-6",
    name: "Banano.Place",
    description: "Shared canvas project spending BANANO to paint pixels",
    url: "https://banano.place",
    category: "Gaming",
    icon: "🖌️"
  },
  {
    id: "gaming-7",
    name: "BananoCraft",
    description: "Minecraft server plugin to earn/spend BANANO in game",
    url: "https://bananocraft.cc",
    category: "Gaming",
    icon: "⛏️"
  },
  {
    id: "gaming-8",
    name: "Banano Swiper",
    description: "Endless runner Android game; collected coins convert to BANANO",
    url: "https://0xshay.itch.io",
    category: "Gaming",
    icon: "🏃"
  },

  // Shopping
  {
    id: "shopping-1",
    name: "r/BananoMarket",
    description: "Reddit community trading BANANO for goods & services",
    url: "https://www.reddit.com",
    category: "Shopping",
    icon: "🛒"
  },
  {
    id: "shopping-2",
    name: ".BAN Domains",
    description: "Buy a .ban domain name for use with BANANO wallets/services",
    url: "https://registrar.prussia.dev",
    category: "Shopping",
    icon: "🌐"
  },
  {
    id: "shopping-3",
    name: "NanShop",
    description: "Gift cards & more using BANANO via Bitrefill",
    url: "https://nanswap.com",
    category: "Shopping",
    icon: "🎁"
  },
  {
    id: "shopping-4",
    name: "NanoGPT",
    description: "AI companion; pay BANANO for various tasks",
    url: "https://nano-gpt.com",
    category: "Shopping",
    icon: "🤖"
  },
  {
    id: "shopping-5",
    name: "Banano.Network",
    description: "Get subdomain & pay in BANANO for hosting",
    url: "https://banano.network",
    category: "Shopping",
    icon: "🌍"
  },
  {
    id: "shopping-6",
    name: "Sticky Banano",
    description: "Marketplace & merch that accepts BANANO",
    url: "https://stickybanano.company.site",
    category: "Shopping",
    icon: "👕"
  },
  {
    id: "shopping-7",
    name: "Frostee",
    description: "Store accepting BANANO for Banano-related goods",
    url: "https://banano.frostee.org",
    category: "Shopping",
    icon: "🛍️"
  },
  {
    id: "shopping-8",
    name: "Banano-Merch",
    description: "Official or fan merch store for BANANO themed products",
    url: "https://my-store-c6a8e6.creator-spring.com",
    category: "Shopping",
    icon: "👕"
  },

  // Merchant Solutions
  {
    id: "merchant-1",
    name: "CryptocurrencyCheckout",
    description: "Payment gateway to accept BANANO & other cryptos",
    url: "https://cryptocurrencycheckout.com",
    category: "Merchant",
    icon: "💳"
  },
  {
    id: "merchant-2",
    name: "Accept-Banano",
    description: "Server program to accept BANANO payments in apps/websites",
    url: "https://github.com",  // source repo
    category: "Merchant",
    icon: "🛠️"
  },
  {
    id: "merchant-3",
    name: "WowPay (Hosted)",
    description: "Hosted service to manage BANANO payments (no fees)",
    url: "https://pay.pilou.cc",
    category: "Merchant",
    icon: "📦"
  },
  {
    id: "merchant-4",
    name: "WowPay (Source)",
    description: "Open source code for WowPay",
    url: "https://github.com",
    category: "Merchant",
    icon: "📂"
  },

  // Developer Tools & Resources
  {
    id: "dev-1",
    name: "BananoCoin GitHub",
    description: "Official repo of the BANANO cryptocurrency project",
    url: "https://github.com",
    category: "Developer",
    icon: "🐙"
  },
  {
    id: "dev-2",
    name: "Spyglass API",
    description: "REST API for Banano blockchain data",
    url: "https://spyglass-api.web.app",
    category: "Developer",
    icon: "🔍"
  },
  {
    id: "dev-3",
    name: "Bananode Wiki",
    description: "Documentation to bootstrap a Banano node",
    url: "https://banano.fandom.com",
    category: "Developer",
    icon: "📘"
  },
  {
    id: "dev-4",
    name: "Learn.Banano.Trade",
    description: "Tutorials, guides & tools to understand Banano",
    url: "https://learn.banano.trade",
    category: "Developer",
    icon: "🎓"
  },
  {
    id: "dev-5",
    name: "Banano-Awesome",
    description: "Community-curated list of BANANO resources & projects",
    url: "https://zh.thedev.id",
    category: "Developer",
    icon: "📚"
  },
  {
    id: "dev-6",
    name: "BananoPie",
    description: "Python library for interacting with BANANO blockchain",
    url: "https://github.com",
    category: "Developer",
    icon: "🐍"
  },
  {
    id: "dev-7",
    name: "Banano Go",
    description: "Go library for interacting with BANANO blockchain",
    url: "https://github.com",
    category: "Developer",
    icon: "🐹"
  },
  {
    id: "dev-8",
    name: "Banano-Node-Docker",
    description: "Scripts to setup Banano node using Docker",
    url: "https://github.com",
    category: "Developer",
    icon: "🐳"
  },
  {
    id: "dev-9",
    name: "NFT Meta-protocol",
    description: "Protocol for implementing NFTs on Banano",
    url: "https://github.com",
    category: "Developer",
    icon: "🖼️"
  },
  {
    id: "dev-10",
    name: "Banano Name Service (BNS)",
    description: "Protocol for top level domains on Banano",
    url: "https://github.com",
    category: "Developer",
    icon: "🌐"
  },
  {
    id: "dev-11",
    name: "BNS Domain Resolver",
    description: "Tool for resolving Banano Name Service domains",
    url: "https://github.com",
    category: "Developer",
    icon: "🔧"
  },
  {
    id: "dev-12",
    name: "Banano Wallet Charts",
    description: "Visualize transaction network of your wallet",
    url: "https://banano-viz.vercel.app",
    category: "Resources",
    icon: "📊"
  },
  {
    id: "dev-13",
    name: "Banfts",
    description: "Mint, buy, & explore NFTs on the Banano network",
    url: "https://banfts.prussia.dev",
    category: "Resources",
    icon: "🖼️"
  },
  {
    id: "dev-14",
    name: "Rewards Calculator",
    description: "Estimate your BANANO earning with Folding@Home",
    url: "https://malkaroy-vrrp.github.io",
    category: "Resources",
    icon: "🧮"
  },
  {
    id: "dev-15",
    name: "Banano@Home",
    description: "Visual client for Folding@Home in browser",
    url: "https://chromewebstore.google.com",
    category: "Resources",
    icon: "🏠"
  },
  {
    id: "dev-16",
    name: "Vanity Address Generator",
    description: "Generate BANANO address with custom prefix",
    url: "https://github.com",
    category: "Resources",
    icon: "🎯"
  }
];


const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'wallet':
    case 'wallets':
      return '!text-indigo-400';
    case 'faucet':
    case 'faucets':
      return '!text-cyan-400';
    case 'exchange':
    case 'exchanges':
      return '!text-orange-400';
    case 'wrapped banano':
    case 'wban':
      return '!text-amber-400';
    case 'gaming':
      return '!text-lime-400';
    case 'shopping':
      return '!text-emerald-400';
    case 'merchant':
    case 'merchant solutions':
      return '!text-rose-400';
    case 'developer':
    case 'dev':
      return '!text-sky-400';
    case 'resources':
      return '!text-teal-400';
    case 'earn':
      return '!text-yellow-400';
    case 'entertainment':
      return '!text-pink-400';
    default:
      return '!text-tertiary';
  }
};


export const ExploreScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    sites.forEach(s => set.add(s.category));
    featuredSites.forEach(s => set.add(s.category));
    return Array.from(set);
  }, []);

  const filteredSites = useMemo(() => {
    if (!selectedCategory) return sites;
    return sites.filter(s => s.category === selectedCategory);
  }, [selectedCategory]);

  const toggleCategory = (category: string) => {
    setSelectedCategory(prev => (prev === category ? null : category));
  };

  const handleVisitSite = (url: string) => {
    window.open(url, '_blank');
  };

  const handleFilterByCategory = (category: string) => toggleCategory(category);

  return (
    <div className="h-full flex flex-col font-semibold">
      {/* Header */}
      <Header active={true} />

      <ContentContainer>
        <PageName name="Explore" back={true} />
        
        <div className="w-full space-y-4">
          {/* Featured Section */}
          <div className="space-y-3">
            <div className="text-tertiary font-semibold">Featured</div>

            <Carousel autoPlay intervalMs={3000} holdIntervalMs={5000}>
              {featuredSites.map((site) => (
                <Card key={site.id} className="w-full">
                  <div className="flex flex-col w-full items-start space-x-3 p-2">
                    {/* Site Info */}
                    <div className="flex min-w-0 w-full items-start justify-between">
                      {/* Site Icon */}
                      <div className="flex items-start gap-2">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                          {site.icon}
                        </div>

                        <div className="flex flex-col items-start">
                          <div className="mb-1">
                            <div className="text-lg font-semibold text-primary">
                              {site.name}
                            </div>
                          </div>

                          <div className={`text-xs font-semibold mb-2 ${getCategoryColor(site.category)}`}>
                            {site.category}
                          </div>
                        </div>
                      </div>
                      {/* CTA */}
                      <div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleVisitSite(site.url)}
                          className="ml-auto"
                        >
                          Visit Site
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-tertiary/80 leading-relaxed">
                      {site.description}
                    </div>
                  </div>
                </Card>
              ))}
            </Carousel>
          </div>

          {/* Filter by category row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
            {allCategories.map((category) => {
              const active = selectedCategory === category;
              return (
                <Button
                  key={category}
                  variant={active ? 'primary' : 'secondary'}
                  size="sm"
                  className={`whitespace-nowrap min-w-max ${getCategoryColor(category)}`}
                  onClick={() => handleFilterByCategory(category)}
                  aria-pressed={active}
                >
                  {category}
                </Button>
              );
            })}
          </div>

          {/* Sites Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-tertiary font-semibold text-2xl">Sites</div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {filteredSites.map((site) => (
                <Card key={site.id} hover={true} onClick={() => handleVisitSite(site.url)}>
                  <div className="flex items-center space-x-3 p-2">
                    {/* Site Icon */}
                    <div className="w-8 h-8 flex items-center justify-center text-lg">
                      {site.icon}
                    </div>
                    
                    {/* Site Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-primary">
                          {site.name}
                        </div>
                        <div className={`text-xs font-semibold ${getCategoryColor(site.category)}`}>
                          {site.category}
                        </div>
                      </div>
                      
                      <div className="text-sm text-tertiary/70 truncate">
                        {site.description}
                      </div>
                    </div>
                    
                    {/* Arrow Icon */}
                    <Icon icon="lucide:external-link" className="text-tertiary/50 text-sm flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ContentContainer>

      <Footer />
    </div>
  );
};
