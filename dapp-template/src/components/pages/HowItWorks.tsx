'use client';

import React from 'react';

export function HowItWorks() {
  return (
    <section>
      <div className="container py-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[1fr]">
          <div className="rounded-xl overflow-hidden bg-black text-white p-6 flex flex-col justify-end shadow-soft lg:col-span-2">
            <div>
              <div className="text-3xl font-semibold">Recognize</div>
              <p className="mt-2 text-sm text-gray-300">Detect installed wallets and connected accounts securely.</p>
            </div>
          </div>
          <div className="card p-6 rounded-xl">
            <div className="text-3xl font-semibold">Learn</div>
            <p className="mt-2 text-sm muted">Fetch balances and account info to personalize UX.</p>
          </div>
          <div className="card p-6 rounded-xl">
            <div className="text-3xl font-semibold">Reach out</div>
            <p className="mt-2 text-sm muted">Open the extension for approvals with clear CTAs.</p>
          </div>
          <div className="card p-6 rounded-xl lg:col-span-2 bg-gradient-surface">
            <div className="text-3xl font-semibold">Interact</div>
            <p className="mt-2 text-sm muted">Send transactions and sign messages with built-in flows.</p>
          </div>
        </div>
      </div>
    </section>
  );
}


