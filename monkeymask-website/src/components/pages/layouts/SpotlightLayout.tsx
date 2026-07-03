'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { DemoCard } from '@/components/demos/DemoCard';
import { DEMOS } from '@/components/demos/registry';

/**
 * Home-page interactive demos: a scannable rail of every feature on the left,
 * with the selected demo shown large on the right.
 */
export function SpotlightLayout() {
  const [activeId, setActiveId] = useState(DEMOS[0].id);
  const active = DEMOS.find((d) => d.id === activeId) ?? DEMOS[0];

  return (
    <div className="flex w-full max-w-7xl flex-col mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Experience MonkeyMask</h2>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
          Try the most advanced Banano wallet extension with enterprise-grade security and
          developer-friendly APIs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rail */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="rounded-xl border border-border p-2">
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {DEMOS.map((demo) => {
                const isActive = demo.id === active.id;
                return (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => setActiveId(demo.id)}
                    className={`flex min-w-[160px] items-center gap-3 rounded-lg px-3 py-3 text-left transition-all lg:min-w-0 ${
                      isActive
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--panel)]'
                    }`}
                  >
                    <Icon icon={demo.icon} className="size-5 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{demo.title}</div>
                      <div className="hidden truncate text-xs opacity-70 lg:block">{demo.blurb}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stage */}
        <div className="lg:col-span-8 xl:col-span-9">
          <DemoCard
            key={active.id}
            title={active.title}
            icon={active.icon}
            className="min-h-[480px] border rounded-xl"
            bodyClassName={active.id === 'rep-explorer' ? 'flex min-h-0 flex-1 flex-col' : ''}
          >
            {active.id !== 'rep-explorer' && (
              <p className="mb-4 text-sm text-[var(--text-secondary)]">{active.blurb}</p>
            )}
            {active.render()}
          </DemoCard>
        </div>
      </div>
    </div>
  );
}

export default SpotlightLayout;
