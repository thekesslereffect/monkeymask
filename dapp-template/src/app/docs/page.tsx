'use client';

import React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Separator, Badge, Alert } from '@/components/ui';
import { Header } from '@/components/pages/Header';

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container py-10">
        {/* Hero */}
        <section className="max-w-4xl mx-auto text-center">
          <Badge>Documentation</Badge>
          <h2 className="text-[40px] md:text-[52px] leading-[1.05] font-black mt-3">Build Banano dApps with MonkeyMask</h2>
          <p className="muted text-lg mt-2">Install the extension, add the provider, and use our simple API to connect, sign, and send.</p>
        </section>

        <Separator className="my-10" />

        {/* Install */}
        <section id="install" className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Install the MonkeyMask extension</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="muted">Download and install the browser extension to enable wallet features.</p>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-medium">Get the extension</div>
                  <p className="text-sm muted">Chromium-based browsers are supported.</p>
                </div>
                <a href="/docs#install">
                  <Button variant="primary">Download for Chrome</Button>
                </a>
              </div>
              <Alert className="mt-4">You can stay connected even when the wallet is locked. The extension will open automatically when signing or sending.</Alert>
            </CardContent>
          </Card>
        </section>

        {/* Quickstart */}
        <section id="quickstart" className="max-w-4xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Quickstart (Next.js)</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="mt-1 space-y-6 list-decimal pl-6">
                <li>
                  <div className="font-medium">Wrap your app</div>
                  <pre className="mt-2 p-4 rounded-md border border-[var(--border)] bg-[var(--panel)] overflow-x-auto text-sm"><code>{`// app/layout.tsx
import { Providers } from '@/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}`}</code></pre>
                </li>
                <li>
                  <div className="font-medium">Add a connect button</div>
                  <pre className="mt-2 p-4 rounded-md border border-[var(--border)] bg-[var(--panel)] overflow-x-auto text-sm"><code>{`import { WalletConnectButton } from '@/components/WalletConnectButton';

export default function Page() {
  return <WalletConnectButton />;
}`}</code></pre>
                </li>
                <li>
                  <div className="font-medium">Use wallet methods</div>
                  <pre className="mt-2 p-4 rounded-md border border-[var(--border)] bg-[var(--panel)] overflow-x-auto text-sm"><code>{`import { useMonkeyMask } from '@/providers';

export default function Component() {
  const { isConnected, publicKey, sendTransaction } = useMonkeyMask();
  // ...
}`}</code></pre>
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* API */}
        <section id="api" className="max-w-5xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Connection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm muted space-y-1">
                      <li><code>isConnected</code></li>
                      <li><code>publicKey</code></li>
                      <li><code>accounts</code></li>
                      <li><code>connect()</code></li>
                      <li><code>disconnect()</code></li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm muted space-y-1">
                      <li><code>getAccounts()</code></li>
                      <li><code>getBalance()</code></li>
                      <li><code>getAccountInfo()</code></li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm muted space-y-1">
                      <li><code>sendTransaction()</code></li>
                      <li><code>signMessage()</code></li>
                      <li><code>signBlock()</code></li>
                      <li><code>sendBlock()</code></li>
                      <li><code>resolveBNS()</code></li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}


