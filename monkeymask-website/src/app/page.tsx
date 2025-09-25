'use client';

import React from 'react';
import { Header } from '@/components/pages/Header';
import { Hero } from '@/components/pages/Hero';
import { Footer } from '@/components/pages/Footer';
import { DonateButton } from '@/components/DonateButton';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <Hero />
      <Footer />
      <DonateButton />
    </div>
  );
}