'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui';

// Feature card component
const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  highlight = false,
  comingSoon = false 
}: { 
  icon: string; 
  title: string; 
  description: string; 
  highlight?: boolean;
  comingSoon?: boolean;
}) => (
  <div className={`group relative p-8 rounded-xl border transition-all duration-300 bg-white border-border`}>
    {comingSoon && (
      <Badge 
        variant="outline" 
        className="absolute top-4 right-4 bg-secondary text-secondary-foreground border-secondary text-xs"
      >
        Coming Soon
      </Badge>
    )}
    <div className={`inline-flex p-4 rounded-xl mb-6 transition-all duration-300 ${
      highlight 
        ? 'bg-secondary' 
        : 'bg-secondary'
    }`}>
      <Icon 
        icon={icon} 
        className={`size-8 transition-colors duration-300 ${
          highlight 
            ? 'text-secondary-foreground' 
            : 'text-secondary-foreground'
        }`} 
      />
    </div>
    <h3 className="text-2xl font-bold mb-3 transition-colors duration-300">
      {title}
    </h3>
    <p className={`leading-relaxed ${highlight ? 'text-secondary-foreground/80' : 'text-secondary-foreground'}`}>
      {description}
    </p>
  </div>
);

export default function ExploreSection() {
  const [activeTab, setActiveTab] = useState('features');

  const features = [
    {
      icon: 'mdi:shield-account',
      title: 'Sign In With Banano',
      description: 'Your wallet is your passport. Authenticate securely across the web using cryptographic signatures without passwords.',
      highlight: true
    },
    {
      icon: 'mdi:code-braces',
      title: 'Built for Developers',
      description: 'Phantom-style provider API with TypeScript support, event-driven architecture, and comprehensive documentation.',
      highlight: true
    },
    {
      icon: 'mdi:lightning-bolt',
      title: 'Fast & Feeless',
      description: 'Experience Banano\'s instant transactions with zero fees. Perfect for micropayments and everyday use.',
      highlight: true
    },
    {
      icon: 'mdi:palette',
      title: 'Banano Made Simple',
      description: 'Clean, intuitive interface designed for both beginners and power users. Banano has never been this accessible.'
    },
    {
      icon: 'mdi:image-multiple',
      title: 'NFT Ready',
      description: 'View, send, and collect Banano NFTs with built-in gallery and marketplace integration.',
      comingSoon: true
    },
    {
      icon: 'mdi:incognito',
      title: 'Privacy Features',
      description: 'Advanced privacy options including stealth addresses and transaction mixing for enhanced anonymity.',
      comingSoon: true
    }
  ];

  const dappIdeas = [
    {
      icon: 'mdi:gamepad-variant',
      title: 'Gaming & Entertainment',
      description: 'Build engaging games with instant, feeless microtransactions',
      examples: ['Skill-based tournaments', 'NFT collectible games', 'Streaming reward platforms', 'Interactive quiz shows'],
      features: ['Instant payouts', 'Micropayments', 'Tournament brackets', 'Leaderboards']
    },
    {
      icon: 'mdi:chart-line',
      title: 'DeFi & Trading',
      description: 'Create financial applications with seamless wallet integration',
      examples: ['Decentralized exchanges', 'Yield farming platforms', 'Prediction markets', 'Portfolio trackers'],
      features: ['Swap interfaces', 'Liquidity pools', 'Price oracles', 'Trading bots']
    },
    {
      icon: 'mdi:message-text',
      title: 'Social & Communication',
      description: 'Build social platforms with crypto-native features',
      examples: ['Decentralized forums', 'Tip-enabled chat apps', 'Content creator platforms', 'Community DAOs'],
      features: ['Message signing', 'Tip integration', 'Reputation systems', 'Governance voting']
    },
    {
      icon: 'mdi:store',
      title: 'E-commerce & Marketplaces',
      description: 'Enable seamless crypto payments for online commerce',
      examples: ['NFT marketplaces', 'Digital goods stores', 'Service platforms', 'Subscription services'],
      features: ['Payment processing', 'Escrow systems', 'Digital receipts', 'Refund handling']
    },
    {
      icon: 'mdi:school',
      title: 'Education & Learning',
      description: 'Gamify learning with blockchain-based rewards and certificates',
      examples: ['Course completion rewards', 'Skill verification', 'Study groups with tips', 'Educational DAOs'],
      features: ['Achievement NFTs', 'Progress tracking', 'Peer rewards', 'Certificate validation']
    },
    {
      icon: 'mdi:charity',
      title: 'Charity & Crowdfunding',
      description: 'Create transparent donation and fundraising platforms',
      examples: ['Charity platforms', 'Crowdfunding campaigns', 'Mutual aid networks', 'Impact tracking'],
      features: ['Transparent donations', 'Goal tracking', 'Impact reports', 'Donor recognition']
    }
  ];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex p-2 bg-[var(--panel)] rounded-xl border border-[var(--border)]">
          <button
            onClick={() => setActiveTab('features')}
            className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'features'
                ? 'text-[var(--text)] border border-border'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            Core Features
          </button>
          <button
            onClick={() => setActiveTab('ecosystem')}
            className={`px-6 py-3  rounded-md font-medium transition-all duration-200 ${
              activeTab === 'ecosystem'
                ? 'text-[var(--text)] border border-border'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            Ecosystem
          </button>
        </div>
      </div>

      {/* Content Sections */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      )}

      {activeTab === 'ecosystem' && (
        <div className="space-y-8 mb-16">          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dappIdeas.map((idea, index) => (
              <div key={index} className="p-6 bg-white rounded-xl border border-border transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  {/* <div className="p-3 rounded-xl bg-secondary">
                    <Icon icon={idea.icon} className="size-6 text-secondary-foreground" />
                  </div> */}
                  <h4 className="text-xl font-bold">{idea.title}</h4>
                </div>
                
                <p className="text-sm text-secondary-foreground mb-4 leading-relaxed">
                  {idea.description}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-semibold mb-2 text-foreground">Example dApps:</h5>
                    <div className="flex flex-wrap gap-1">
                      {idea.examples.map((example, exampleIndex) => (
                        <Badge key={exampleIndex} variant="outline" className="text-xs bg-secondary/50">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold mb-2 text-foreground">Key Features:</h5>
                    <div className="flex flex-wrap gap-1">
                      {idea.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}