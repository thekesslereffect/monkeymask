'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { Hero } from '@/components/pages/Hero';
import { Footer } from '@/components/ui/Footer';
import { Demos } from '@/components/Demos';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Hero />
      <Demos />
      <Footer />
    </div>
  );
}