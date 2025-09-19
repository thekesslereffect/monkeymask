import React from 'react';
import { Header, Card, ContentContainer, Footer, PageName } from './ui';
import { Icon } from '@iconify/react';

// Mock NFT data - replace with real data when implemented
interface MockNFT {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

const mockNFTs: MockNFT[] = [
  {
    id: '1',
    name: 'Banano Monkey #001',
    description: 'A rare golden monkey from the Banano jungle',
    image: '🐵',
    collection: 'Banano Monkeys',
    rarity: 'Legendary'
  },
  {
    id: '2',
    name: 'Potassium Crystal',
    description: 'A shimmering crystal filled with pure potassium energy',
    image: '💎',
    collection: 'Banano Elements',
    rarity: 'Epic'
  },
  {
    id: '3',
    name: 'Jungle Leaf #42',
    description: 'A vibrant leaf from the sacred Banano tree',
    image: '🍃',
    collection: 'Jungle Collection',
    rarity: 'Rare'
  },
  {
    id: '4',
    name: 'Yellow Banana',
    description: 'The classic yellow banana, perfectly ripe',
    image: '🍌',
    collection: 'Fruit Collection',
    rarity: 'Common'
  },
  {
    id: '5',
    name: 'Cosmic Monkey',
    description: 'A monkey that has traveled through the cosmos',
    image: '🚀',
    collection: 'Space Monkeys',
    rarity: 'Legendary'
  },
  {
    id: '6',
    name: 'Banano Crown',
    description: 'A golden crown worn by the Banano royalty',
    image: '👑',
    collection: 'Royal Collection',
    rarity: 'Epic'
  }
];

const getRarityColor = (rarity?: string) => {
  switch (rarity) {
    case 'Legendary':
      return 'text-yellow-400';
    case 'Epic':
      return 'text-purple-400';
    case 'Rare':
      return 'text-blue-400';
    case 'Common':
      return 'text-gray-400';
    default:
      return 'text-tertiary';
  }
};

export const NFTsScreen: React.FC = () => {
  const handleNFTClick = (nft: MockNFT) => {
    console.log('Clicked NFT:', nft.name);
    // TODO: Navigate to NFT details screen when implemented
  };

  return (
    <div className="h-full flex flex-col font-semibold">
      {/* Header */}
      <Header active={true} />

      <ContentContainer>
        <PageName name="NFTs" back={true} />
        
        {mockNFTs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <Icon icon="lucide:image" className="text-6xl text-tertiary/50" />
            <div className="text-tertiary">No NFTs found</div>
            <div className="text-sm text-tertiary/70 max-w-xs">
              Your Banano NFTs will appear here when you collect them
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* NFT Count */}
            <div className="text-center text-tertiary">
              {mockNFTs.length} NFT{mockNFTs.length !== 1 ? 's' : ''}
            </div>

            {/* NFT Grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {mockNFTs.map((nft) => (
                <Card
                  key={nft.id}
                  hover={true}
                  onClick={() => handleNFTClick(nft)}
                  className="aspect-square"
                >
                  <div className="flex flex-col items-center justify-center h-full space-y-2 bg-tertiary/10 rounded-lg overflow-hidden">
                    {/* NFT Image/Emoji */}
                    <div className="text-4xl">{nft.image}</div>
                    
                    {/* NFT Name */}
                    <div className="text-sm font-semibold text-primary text-center leading-tight">
                      {nft.name}
                    </div>
                    
                    {/* Collection */}
                    <div className="text-xs text-tertiary/70 text-center">
                      {nft.collection}
                    </div>
                    
                    {/* Rarity */}
                    {nft.rarity && (
                      <div className={`text-xs font-semibold ${getRarityColor(nft.rarity)}`}>
                        {nft.rarity}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Coming Soon Message */}
            <Card className="mt-6">
              <div className="flex items-center space-x-3 p-2">
                <Icon icon="lucide:info" className="text-primary text-lg" />
                <div className="flex-1">
                  <div className="text-sm text-primary font-semibold">
                    Coming Soon
                  </div>
                  <div className="text-xs text-tertiary/70">
                    Full Banano NFT integration is under development. Stay tuned for real NFT support!
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </ContentContainer>

      <Footer />
    </div>
  );
};
