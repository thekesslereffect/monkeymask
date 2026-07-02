'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui';
import { ExploreSitesDirectory } from '@/components/ExploreSitesDirectory';

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
      title: 'NFTs Built In',
      description: 'View, mint, transfer, and burn Banano NFTs, including editions, supply locking, and a full gallery, all from the wallet.',
      highlight: true
    },
    {
      icon: 'mdi:incognito',
      title: 'Privacy Features',
      description: 'Advanced privacy options including stealth addresses and transaction mixing for enhanced anonymity.',
      comingSoon: true
    }
  ];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex p-2 rounded-xl border border-[var(--border)]">
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
        <div className="mb-16">
          <ExploreSitesDirectory />
        </div>
      )}
    </div>
  );
}