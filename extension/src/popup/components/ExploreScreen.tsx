import React, { useMemo, useState } from 'react';
import { Header, Card, ContentContainer, Footer, PageName, Button, Carousel } from './ui';
import { Icon } from '@iconify/react';

// Mock site data - replace with real data when implemented
interface FeaturedSite {

  name: string;
  description: string;
  url: string;
  category: string;
  featured: boolean;
}

interface Site {

  name: string;
  description: string;
  url: string;
  category: string;
}

const featuredSites: FeaturedSite[] = [
  {
    
    name: 'Banano.cc',
    description: 'The memecoin that started it all. Here you find the yellow paper, help, and more!',
    url: 'https://banano.cc',
    category: 'Resources',
  
    featured: true
  },
  {
    
    name: 'Banano Hub',
    description: 'Explore the Banano ecosystem and find the best projects.',
    url: 'https://hub.banano.network/',
    category: 'Resources',
  
    featured: true
  },
  {
    
    name: 'MonkeyTalks',
    description: 'The official Banano on-chain messaging platform. Connect with fellow monkeys worldwide.',
    url: 'https://monkeytalks.cc',
    category: 'Faucets',
  
    featured: true
  }
];

interface Site {

  name: string;
  description: string;
  url: string;
  category: string;
}

const sites: Site[] = [
  {
    
    name: "Kalium",
    description: "Mobile wallet for BANANO on iOS & Android",
    url: "https://kalium.banano.cc",
    category: "Wallets",
    },
  {
    
    name: "The Banano Stand",
    description: "Browser-based lightwallet, supports Ledger Nano S",
    url: "https://thebananostand.com",
    category: "Wallets",
    },
  {
    
    name: "Paper Wallet Generator",
    description: "Generate & print a paper wallet for BANANO",
    url: "https://banano.cc",
    category: "Wallets",
    },
  {
    
    name: "Camo-Banano",
    description: "Privacy-focused light wallet for BANANO (camo transactions)",
    url: "https://github.com",  // link goes to GitHub repo
    category: "Wallets",
    },
  {
    
    name: "Ledger",
    description: "Hardware wallet for secure private key storage",
    url: "https://www.ledger.com",
    category: "Wallets",
    },
  {
    
    name: "Discord Tipbot",
    description: "Tip BANANO on Discord",
    url: "https://chat.banano.cc",
    category: "Wallets",
    },
  {
    
    name: "Reddit Tipbot",
    description: "Tip BANANO on Reddit",
    url: "https://www.reddit.com",
    category: "Wallets",
    },
  {
    
    name: "Tip.cc",
    description: "Multi-chain tipping service (Discord) supporting BANANO",
    url: "https://tip.cc",
    category: "Wallets",
    },
  {
    
    name: "Wrkzcoin TipBot",
    description: "Multi-chain Discord tipbot for BANANO",
    url: "https://github.com",  // repo
    category: "Wallets",
    },
  {
    
    name: "cctip_bot",
    description: "Telegram tipping bot for BANANO",
    url: "https://t.me",
    category: "Wallets",
    },
  {
    
    name: "NanChat",
    description: "Wallet + end-to-end encrypted messaging using BANANO",
    url: "https://nanchat.com",
    category: "Wallets",
    },
  {
    
    name: "Potassius",
    description: "Fork of Kalium with extra messaging & watch-only features",
    url: "https://apps.apple.com",
    category: "Wallets",
    },
  {
    
    name: "Potassius (Android)",
    description: "Fork of Kalium with extra messaging & watch-only features",
    url: "https://play.google.com",
    category: "Wallets",
    },

  // Faucets
  {
    
    name: "Banano Miner",
    description: "Earn BANANO by contributing compute (protein folding) via Folding@Home",
    url: "https://bananominer.com",
    category: "Faucets",
    },
  {
    
    name: "JungleTV",
    description: "Watch videos to earn BANANO in a community-driven video platform",
    url: "https://jungletv.live",
    category: "Faucets",
    },
  {
    
    name: "Monkey Talks",
    description: "On-chain messaging with built-in faucet",
    url: "https://monkeytalks.cc",
    category: "Faucets",
    },
  {
    
    name: "NanSwap Faucet",
    description: "Swap service with a basic faucet included",
    url: "https://nanswap.com",
    category: "Faucets",
    },
  {
    
    name: "MonkeySlots",
    description: "Slot-machine game to win BANANO",
    url: "https://monkeyslots.banano.ch",
    category: "Faucets",
    },
  {
    
    name: "Get-Ban",
    description: "Tasks & anonymous ways to earn BANANO",
    url: "https://get-ban.com",
    category: "Faucets",
    },
  {
    
    name: "Free Banano Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://thefreebananofaucet.com",
    category: "Faucets",
    },
  {
    
    name: "Banano-Faucet",
    description: "Claim BANANO every 24 hours",
    url: "https://banano-faucet.com",
    category: "Faucets",
    },
  {
    
    name: "I Can Haz Nano",
    description: "Claim BANANO 3 times daily",
    url: "https://icanhaznano.monke42.link",
    category: "Faucets",
    },
  {
    
    name: "Moonano",
    description: "Claim BANANO once every 24 hours",
    url: "https://moonano.net",
    category: "Faucets",
    },
  {
    
    name: "Gorilla Nation Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://gorillanation.cc",
    category: "Faucets",
    },
  {
    
    name: "BANXNO Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://faucet.banxno.com",
    category: "Faucets",
    },
  {
    
    name: "Prussia's Banano Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://faucet.prussia.dev",
    category: "Faucets",
    },
  {
    
    name: "iamgabriel.dev Faucet",
    description: "Claim BANANO once every 24 hours",
    url: "https://faucet.iamgabriel.dev",
    category: "Faucets",
    },
  {
    
    name: "Monkle",
    description: "Word-game to earn BANANO daily",
    url: "https://monkle.vercel.app",
    category: "Faucets",
    },
  {
    
    name: "BanFaucet",
    description: "Complete tasks to earn BANANO and other cryptos",
    url: "https://banfaucet.com",
    category: "Faucets",
    },

  // Exchanges
  {
    
    name: "Coinex",
    description: "Centralized exchange listing BANANO",
    url: "https://www.coinex.com",
    category: "Exchanges",
    },
  {
    
    name: "NanSwap",
    description: "Swap service for BANANO & Nano tokens",
    url: "https://nanswap.com",
    category: "Exchanges",
    },
  {
    
    name: "Banano.Trade",
    description: "Platform to trade BANANO with Nano, USDC, USDT, etc.",
    url: "https://banano.trade",
    category: "Exchanges",
    },
  {
    
    name: "Cyphergoat",
    description: "Exchange aggregator for best swap rates",
    url: "https://cyphergoat.com",
    category: "Exchanges",
    },
  {
    
    name: "FluffySwap",
    description: "Exchange aggregator for BANANO swaps",
    url: "https://fluffyswap.com",
    category: "Exchanges",
    },
  {
    
    name: "PancakeSwap",
    description: "DEX supporting wBAN on multiple chains",
    url: "https://pancakeswap.finance",
    category: "Exchanges",
    },
  {
    
    name: "UniSwap",
    description: "DEX supporting wBAN on Ethereum",
    url: "https://app.uniswap.org",
    category: "Exchanges",
    },
  {
    
    name: "SushiSwap",
    description: "DEX supporting wBAN on Polygon & Arbitrum",
    url: "https://www.sushi.com",
    category: "Exchanges",
    },
  {
    
    name: "SpookySwap",
    description: "DEX on Fantom chain for wBAN swaps",
    url: "https://spooky.fi",
    category: "Exchanges",
    },
  {
    
    name: "Zapper",
    description: "Multichain swap & tracking tool supporting wBAN",
    url: "https://zapper.xyz",
    category: "Exchanges",
    },

  // Wrapped Banano (wBAN)
  {
    
    name: "Wrap.Banano",
    description: "Bridge from BANANO → Wrapped BANANO on BSC, Polygon, Fantom, Ethereum & Arbitrum",
    url: "https://wrap.banano.cc",
    category: "Wrapped Banano",
    },
  {
    
    name: "wBAN GitBook",
    description: "Documentation for Wrapped BANANO",
    url: "https://wrap-that-potassium.gitbook.io",
    category: "Wrapped Banano",
    },

  // Gaming
  {
    
    name: "CryptoMonKeys",
    description: "Community-driven digital trading cards (NFTs)",
    url: "https://cryptocurrencycheckout.com",
    category: "Gaming",
    },
  {
    
    name: "Banano Bet",
    description: "Provably fair dice game using BANANO",
    url: "https://bananobet.com",
    category: "Gaming",
    },
  {
    
    name: "BC.Game",
    description: "Online casino supporting BANANO and other cryptos",
    url: "https://bc.game",
    category: "Gaming",
    },
  {
    
    name: "NanoGames.io",
    description: "Huge game selection accepting BANANO",
    url: "https://nanogames.io",
    category: "Gaming",
    },
  {
    
    name: "Banano Sports Pools",
    description: "Bet on sports with BANANO",
    url: "https://www.banano-sports-pools.xyz",
    category: "Gaming",
    },
  {
    
    name: "Banano.Place",
    description: "Shared canvas project spending BANANO to paint pixels",
    url: "https://banano.place",
    category: "Gaming",
    },
  {
    
    name: "BananoCraft",
    description: "Minecraft server plugin to earn/spend BANANO in game",
    url: "https://bananocraft.cc",
    category: "Gaming",
    },
  {
    
    name: "Banano Swiper",
    description: "Endless runner Android game; collected coins convert to BANANO",
    url: "https://0xshay.itch.io",
    category: "Gaming",
    },

  // Shopping
  {
    
    name: "r/BananoMarket",
    description: "Reddit community trading BANANO for goods & services",
    url: "https://www.reddit.com",
    category: "Shopping",
    },
  {
    
    name: ".BAN Domains",
    description: "Buy a .ban domain name for use with BANANO wallets/services",
    url: "https://registrar.prussia.dev",
    category: "Shopping",
    },
  {
    
    name: "NanShop",
    description: "Gift cards & more using BANANO via Bitrefill",
    url: "https://nanswap.com",
    category: "Shopping",
    },
  {
    
    name: "NanoGPT",
    description: "AI companion; pay BANANO for various tasks",
    url: "https://nano-gpt.com",
    category: "Shopping",
    },
  {
    
    name: "Banano.Network",
    description: "Get subdomain & pay in BANANO for hosting",
    url: "https://banano.network",
    category: "Shopping",
    },
  {
    
    name: "Sticky Banano",
    description: "Marketplace & merch that accepts BANANO",
    url: "https://stickybanano.company.site",
    category: "Shopping",
    },
  {
    
    name: "Frostee",
    description: "Store accepting BANANO for Banano-related goods",
    url: "https://banano.frostee.org",
    category: "Shopping",
    },
  {
    
    name: "Banano-Merch",
    description: "Official or fan merch store for BANANO themed products",
    url: "https://my-store-c6a8e6.creator-spring.com",
    category: "Shopping",
    },

  // Merchant Solutions
  {
    
    name: "CryptocurrencyCheckout",
    description: "Payment gateway to accept BANANO & other cryptos",
    url: "https://cryptocurrencycheckout.com",
    category: "Merchant",
    },
  {
    
    name: "Accept-Banano",
    description: "Server program to accept BANANO payments in apps/websites",
    url: "https://github.com",  // source repo
    category: "Merchant",
    },
  {
    
    name: "WowPay (Hosted)",
    description: "Hosted service to manage BANANO payments (no fees)",
    url: "https://pay.pilou.cc",
    category: "Merchant",
    },
  {
    
    name: "WowPay (Source)",
    description: "Open source code for WowPay",
    url: "https://github.com",
    category: "Merchant",
    },

  // Developer Tools & Resources
  {
    
    name: "BananoCoin GitHub",
    description: "Official repo of the BANANO cryptocurrency project",
    url: "https://github.com",
    category: "Developer",
    },
  {
    
    name: "Spyglass API",
    description: "REST API for Banano blockchain data",
    url: "https://spyglass-api.web.app",
    category: "Developer",
    },
  {
    
    name: "Bananode Wiki",
    description: "Documentation to bootstrap a Banano node",
    url: "https://banano.fandom.com",
    category: "Developer",
    },
  {
    
    name: "Learn.Banano.Trade",
    description: "Tutorials, guides & tools to understand Banano",
    url: "https://learn.banano.trade",
    category: "Developer",
    },
  {
    
    name: "Banano-Awesome",
    description: "Community-curated list of BANANO resources & projects",
    url: "https://zh.thedev.id",
    category: "Developer",
    },
  {
    
    name: "BananoPie",
    description: "Python library for interacting with BANANO blockchain",
    url: "https://github.com",
    category: "Developer",
    },
  {
    
    name: "Banano Go",
    description: "Go library for interacting with BANANO blockchain",
    url: "https://github.com",
    category: "Developer",
    },
  {
    
    name: "Banano-Node-Docker",
    description: "Scripts to setup Banano node using Docker",
    url: "https://github.com",
    category: "Developer",
    },
  {
    
    name: "NFT Meta-protocol",
    description: "Protocol for implementing NFTs on Banano",
    url: "https://github.com",
    category: "Developer",
    },
  {
    
    name: "Banano Name Service (BNS)",
    description: "Protocol for top level domains on Banano",
    url: "https://github.com",
    category: "Developer",
    },
  {
    
    name: "BNS Domain Resolver",
    description: "Tool for resolving Banano Name Service domains",
    url: "https://github.com",
    category: "Developer",
    },
  {
    
    name: "Banano Wallet Charts",
    description: "Visualize transaction network of your wallet",
    url: "https://banano-viz.vercel.app",
    category: "Resources",
    },
  {
    
    name: "Banfts",
    description: "Mint, buy, & explore NFTs on the Banano network",
    url: "https://banfts.prussia.dev",
    category: "Resources",
    },
  {
    
    name: "Rewards Calculator",
    description: "Estimate your BANANO earning with Folding@Home",
    url: "https://malkaroy-vrrp.github.io",
    category: "Resources",
    },
  {
    
    name: "Banano@Home",
    description: "Visual client for Folding@Home in browser",
    url: "https://chromewebstore.google.com",
    category: "Resources",
    },
  {
    
    name: "Vanity Address Generator",
    description: "Generate BANANO address with custom prefix",
    url: "https://github.com",
    category: "Resources",
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
              {featuredSites.map((site,i) => (
                <Card key={i} className="w-full">
                  <div className="flex flex-col w-full items-start space-x-3 p-2">
                    {/* Site Info */}
                    <div className="flex min-w-0 w-full items-start justify-between">
                      {/* Site Icon */}
                      <div className="flex items-start gap-2">
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
                  variant={active ? 'secondary' : "ghost"}
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
              {filteredSites.map((site,i) => (
                <Card key={i} hover={true} onClick={() => handleVisitSite(site.url)}>
                  <div className="flex items-center space-x-3 p-2">                    
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
