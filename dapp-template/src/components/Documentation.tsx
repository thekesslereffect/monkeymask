/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';

interface CodeExample {
  title: string;
  description: string;
  code: string;
  language: string;
}

const codeExamples: CodeExample[] = [
  {
    title: 'Basic Connection',
    description: 'Connect to MonkeyMask and handle the connection state',
    language: 'typescript',
    code: `// Check if MonkeyMask is installed
if (typeof window.banano !== 'undefined') {
  try {
    // Connect to the wallet
    const result = await window.banano.connect();
    console.log('Connected:', result.publicKey);
    
    // Listen for connection events
    window.banano.on('connect', (data) => {
      console.log('Wallet connected:', data.publicKey);
    });
    
    window.banano.on('disconnect', () => {
      console.log('Wallet disconnected');
    });
    
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
} else {
  console.error('MonkeyMask not installed');
}`
  },
  {
    title: 'Get Account Information',
    description: 'Retrieve balance and account details',
    language: 'typescript',
    code: `// Get account balance
const balance = await window.banano.getBalance();
console.log('Balance:', balance, 'BAN');

// Get detailed account information
const accountInfo = await window.banano.getAccountInfo();
console.log('Account Info:', {
  address: accountInfo.address,
  balance: accountInfo.balance,
  pending: accountInfo.pending,
  representative: accountInfo.representative
});`
  },
  {
    title: 'Sign Messages',
    description: 'Sign messages for authentication or verification',
    language: 'typescript',
    code: `// Sign a text message
const message = 'Hello from my dApp!';
try {
  const result = await window.banano.signMessage(message, 'utf8');
  console.log('Signature:', result.signature);
  console.log('Public Key:', result.publicKey);
  
  // The signature can be used for authentication
  // or to verify the user owns the wallet
} catch (error) {
  if (error.code === 4001) {
    console.log('User rejected the signing request');
  } else {
    console.error('Signing failed:', error.message);
  }
}`
  },
  {
    title: 'Send Transactions',
    description: 'Send BAN tokens to another address',
    language: 'typescript',
    code: `// Send BAN tokens
const toAddress = 'ban_1recipient...';
const amount = '1.0'; // Amount in BAN

try {
  const result = await window.banano.sendTransaction(
    window.banano.publicKey, // from address
    toAddress,               // to address  
    amount                   // amount in BAN
  );
  
  console.log('Transaction sent!');
  console.log('Hash:', result.hash);
  console.log('Block:', result.block);
  
} catch (error) {
  if (error.code === 4001) {
    console.log('User rejected the transaction');
  } else {
    console.error('Transaction failed:', error.message);
  }
}`
  },
  {
    title: 'BNS Resolution',
    description: 'Resolve Banano Name System (BNS) names to addresses',
    language: 'typescript',
    code: `// Resolve a BNS name to an address
try {
  const address = await window.banano.resolveBNS('username.ban');
  console.log('Resolved address:', address);
  
  // You can now use this address for transactions
  await window.banano.sendTransaction(
    window.banano.publicKey,
    address,
    '0.1'
  );
  
} catch (error) {
  console.error('BNS resolution failed:', error.message);
}

// Supported TLDs: .ban, .jtv, .mictest`
  },
  {
    title: 'Error Handling',
    description: 'Handle different types of errors properly',
    language: 'typescript',
    code: `// MonkeyMask uses standardized error codes (EIP-1193)
try {
  await window.banano.connect();
} catch (error) {
  switch (error.code) {
    case 4001:
      console.log('User rejected the request');
      break;
    case 4100:
      console.log('Account access unauthorized');
      break;
    case 4900:
      console.log('Provider disconnected');
      break;
    case -32602:
      console.log('Invalid parameters');
      break;
    case -32603:
      console.log('Internal error');
      break;
    default:
      console.error('Unknown error:', error.message);
  }
}`
  },
  {
    title: 'React Hook Usage',
    description: 'Use the provided React hook for easy integration',
    language: 'typescript',
    code: `import { useMonkeyMask } from '@/hooks/useMonkeyMask';

function MyComponent() {
  const {
    isConnected,
    isConnecting,
    publicKey,
    balance,
    error,
    connect,
    disconnect,
    sendTransaction
  } = useMonkeyMask();

  if (!isConnected) {
    return (
      <button onClick={() => connect()}>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div>
      <p>Connected: {publicKey}</p>
      <p>Balance: {balance} BAN</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}`
  }
];

export function Documentation() {
  const [selectedExample, setSelectedExample] = useState(0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">📚</span>
          <h2 className="text-2xl font-bold text-neutral-100">MonkeyMask Integration Guide</h2>
        </div>
        <p className="text-neutral-300 leading-relaxed">
          MonkeyMask provides a simple, secure way to integrate Banano wallet functionality into your dApp. 
          This guide shows you how to connect to wallets, handle transactions, and implement best practices 
          for a professional user experience.
        </p>
      </div>

      {/* Quick Start */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-100">
          <span className="text-2xl mr-2">🚀</span>
          Quick Start
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-neutral-200 mb-2">1. Detection</h4>
            <p className="text-sm text-neutral-400 mb-3">
              Check if MonkeyMask is installed and available
            </p>
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded font-mono text-sm text-neutral-200">
              if (window.banano) &#123;<br />
              &nbsp;&nbsp;// MonkeyMask is available<br />
              &#125;
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-200 mb-2">2. Connection</h4>
            <p className="text-sm text-neutral-400 mb-3">
              Request connection to the user's wallet
            </p>
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded font-mono text-sm text-neutral-200">
              const result = await<br />
              &nbsp;&nbsp;window.banano.connect();
            </div>
          </div>
        </div>
      </div>

      {/* API Reference */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-100">
          <span className="text-2xl mr-2">⚡</span>
          API Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { method: 'connect(options?)', description: 'Connect to wallet' },
            { method: 'disconnect()', description: 'Disconnect from wallet' },
            { method: 'getAccounts()', description: 'Get connected accounts' },
            { method: 'getBalance(account?)', description: 'Get account balance' },
            { method: 'getAccountInfo(account?)', description: 'Get account details' },
            { method: 'signMessage(message, encoding?)', description: 'Sign a message' },
            { method: 'signBlock(block)', description: 'Sign a block' },
            { method: 'sendTransaction(from, to, amount)', description: 'Send BAN tokens' },
            { method: 'resolveBNS(bnsName)', description: 'Resolve BNS name' },
            { method: 'on(event, handler)', description: 'Listen to events' },
            { method: 'off(event, handler)', description: 'Remove event listener' },
            { method: 'removeAllListeners(event?)', description: 'Remove all listeners' }
          ].map((api, index) => (
            <div key={index} className="p-3 border border-neutral-800 rounded-lg">
              <div className="font-mono text-sm text-neutral-200 font-semibold">
                {api.method}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {api.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-xl font-semibold flex items-center text-neutral-100">
            <span className="text-2xl mr-2">💻</span>
            Code Examples
          </h3>
        </div>
        
        <div className="flex flex-col lg:flex-row">
          {/* Example Navigation */}
          <div className="lg:w-1/3 border-r border-neutral-800">
            <div className="p-4">
              <h4 className="font-semibold text-neutral-200 mb-3">Examples</h4>
              <div className="space-y-1">
                {codeExamples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedExample(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedExample === index
                        ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                        : 'hover:bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">{example.title}</div>
                    <div className="text-xs opacity-75 mt-1">{example.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Code Display */}
          <div className="lg:w-2/3">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-neutral-200">
                    {codeExamples[selectedExample].title}
                  </h4>
                  <p className="text-sm text-neutral-400 mt-1">
                    {codeExamples[selectedExample].description}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(codeExamples[selectedExample].code)}
                  className="px-3 py-1 text-sm bg-neutral-800 text-neutral-100 rounded hover:bg-neutral-700 transition-colors"
                >
                  📋 Copy
                </button>
              </div>
              
              <div className="bg-neutral-950 text-neutral-100 p-4 rounded-lg overflow-x-auto border border-neutral-800">
                <pre className="text-sm">
                  <code>{codeExamples[selectedExample].code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-100">
          <span className="text-2xl mr-2">✨</span>
          Best Practices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-neutral-200 mb-2">✅ Do</h4>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li>• Always check if MonkeyMask is installed before calling methods</li>
                <li>• Handle user rejections gracefully (error code 4001)</li>
                <li>• Listen to connection events for real-time updates</li>
                <li>• Validate addresses before sending transactions</li>
                <li>• Show clear loading states during operations</li>
                <li>• Use the provided React hook for easier integration</li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-neutral-200 mb-2">❌ Don't</h4>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li>• Don't assume MonkeyMask is always available</li>
                <li>• Don't ignore error codes - handle them appropriately</li>
                <li>• Don't make calls without user interaction</li>
                <li>• Don't store private keys or sensitive data</li>
                <li>• Don't spam users with connection requests</li>
                <li>• Don't forget to remove event listeners when done</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Event System */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-100">
          <span className="text-2xl mr-2">📡</span>
          Event System
        </h3>
        <p className="text-neutral-300 mb-4">
          MonkeyMask emits events that your dApp can listen to for real-time updates:
        </p>
        <div className="space-y-3">
          {[
            { event: 'connect', description: 'Fired when wallet connects', data: '{ publicKey: string }' },
            { event: 'disconnect', description: 'Fired when wallet disconnects', data: 'void' },
            { event: 'accountChanged', description: 'Fired when user switches accounts', data: 'string (new publicKey)' }
          ].map((eventInfo, index) => (
            <div key={index} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-neutral-200 font-semibold">{eventInfo.event}</span>
                <span className="text-xs text-neutral-500">{eventInfo.data}</span>
              </div>
              <p className="text-sm text-neutral-300">{eventInfo.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
