'use client';

import { useState } from 'react';
import { useMonkeyMask } from '@/hooks/useMonkeyMask';

interface ApiResult {
  method: string;
  success: boolean;
  result?: unknown;
  error?: string;
  timestamp: Date;
}

export function ApiTester() {
  const {
    isConnected,
    publicKey,
    getBalance,
    getAccountInfo,
    signMessage,
    signBlock,
    sendTransaction,
    resolveBNS
  } = useMonkeyMask();

  const [results, setResults] = useState<ApiResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  
  // Form states
  const [messageToSign, setMessageToSign] = useState('Hello from MonkeyMask dApp!');
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('0.01');
  const [bnsName, setBnsName] = useState('');

  const addResult = (method: string, success: boolean, result?: unknown, error?: string) => {
    const newResult: ApiResult = {
      method,
      success,
      result,
      error,
      timestamp: new Date()
    };
    setResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const executeMethod = async (methodName: string, fn: () => Promise<unknown>) => {
    if (!isConnected) {
      addResult(methodName, false, null, 'Wallet not connected');
      return;
    }

    setLoading(methodName);
    try {
      const result = await fn();
      addResult(methodName, true, result);
        } catch (error: unknown) {
          addResult(methodName, false, null, (error as Error)?.message || 'Unknown error');
    } finally {
      setLoading(null);
    }
  };

  const testMethods = [
    {
      name: 'getAccounts',
      description: 'Get connected wallet accounts',
      action: () => executeMethod('getAccounts', async () => {
        // Since getAccounts isn't directly exposed in our hook, we'll return the current account
        return publicKey ? [publicKey] : [];
      })
    },
    {
      name: 'getBalance',
      description: 'Get wallet balance',
      action: () => executeMethod('getBalance', () => getBalance())
    },
    {
      name: 'getAccountInfo',
      description: 'Get detailed account information',
      action: () => executeMethod('getAccountInfo', () => getAccountInfo())
    }
  ];

  if (!isConnected) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🔌</div>
        <h3 className="text-lg font-semibold text-neutral-100 mb-2">Connect Your Wallet</h3>
        <p className="text-neutral-400">Connect MonkeyMask to test the API methods</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic API Methods */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-100">
          <span className="text-2xl mr-2">🛠️</span>
          Basic API Methods
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testMethods.map((method) => (
            <button
              key={method.name}
              onClick={method.action}
              disabled={loading === method.name}
              className="p-4 border border-neutral-800 rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
            >
              <div className="font-semibold text-neutral-200">{method.name}()</div>
              <div className="text-sm text-neutral-400 mt-1">{method.description}</div>
              {loading === method.name && (
                <div className="flex items-center mt-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-neutral-400 border-t-transparent mr-2"></div>
                  <span className="text-xs text-neutral-400">Loading...</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Message Signing */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-100">
          <span className="text-2xl mr-2">✍️</span>
          Message Signing
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Message to Sign
            </label>
            <input
              type="text"
              value={messageToSign}
              onChange={(e) => setMessageToSign(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-800 rounded-lg bg-neutral-950 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              placeholder="Enter message to sign"
            />
          </div>
          <button
            onClick={() => executeMethod('signMessage', () => signMessage(messageToSign))}
            disabled={loading === 'signMessage' || !messageToSign.trim()}
            className="px-4 py-2 bg-neutral-800 text-neutral-100 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === 'signMessage' ? 'Signing...' : 'Sign Message'}
          </button>
        </div>
      </div>

      {/* Block Signing */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-100">
          <span className="text-2xl mr-2">📦</span>
          Block Signing
        </h3>
        <p className="text-sm text-neutral-400 mb-4">
          Test block signing with a sample block structure
        </p>
        <button
          onClick={() => executeMethod('signBlock', () => {
            const testBlock = {
              type: 'send' as const,
              account: publicKey || '',
              previous: '0000000000000000000000000000000000000000000000000000000000000000',
              representative: 'ban_1ka1ium4pfue3uxtntqkkksy3c3s5xy3q3xr8usayqp2yz3h2msc8jqm7yxs',
              balance: '1000000000000000000000000000000',
              link: 'ban_1ka1ium4pfue3uxtntqkkksy3c3s5xy3q3xr8usayqp2yz3h2msc8jqm7yxs',
              amount: '1000000000000000000000000000'
            };
            return signBlock(testBlock);
          })}
          disabled={loading === 'signBlock'}
          className="px-4 py-2 bg-neutral-800 text-neutral-100 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'signBlock' ? 'Signing...' : 'Sign Test Block'}
        </button>
      </div>

      {/* Send Transaction */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-100">
          <span className="text-2xl mr-2">💸</span>
          Send Transaction
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              To Address
            </label>
            <input
              type="text"
              value={sendToAddress}
              onChange={(e) => setSendToAddress(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-800 rounded-lg bg-neutral-950 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700 font-mono text-sm"
              placeholder="ban_1... or username.ban"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Amount (BAN)
            </label>
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-neutral-800 rounded-lg bg-neutral-950 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              placeholder="0.01"
            />
          </div>
          <button
            onClick={() => executeMethod('sendTransaction', () => sendTransaction(sendToAddress, sendAmount))}
            disabled={loading === 'sendTransaction' || !sendToAddress.trim() || !sendAmount}
            className="px-4 py-2 bg-neutral-800 text-neutral-100 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === 'sendTransaction' ? 'Sending...' : 'Send Transaction'}
          </button>
        </div>
      </div>

      {/* BNS Resolution */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-neutral-100">
          <span className="text-2xl mr-2">🌐</span>
          BNS Resolution
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              BNS Name
            </label>
            <input
              type="text"
              value={bnsName}
              onChange={(e) => setBnsName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-800 rounded-lg bg-neutral-950 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              placeholder="username.ban"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Supports: .ban, .jtv, .mictest domains
            </p>
          </div>
          <button
            onClick={() => executeMethod('resolveBNS', () => resolveBNS(bnsName))}
            disabled={loading === 'resolveBNS' || !bnsName.trim()}
            className="px-4 py-2 bg-neutral-800 text-neutral-100 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === 'resolveBNS' ? 'Resolving...' : 'Resolve BNS'}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center text-neutral-100">
              <span className="text-2xl mr-2">📋</span>
              API Results
            </h3>
            <button
              onClick={() => setResults([])}
              className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Clear Results
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-neutral-900 border-green-700/30' 
                    : 'bg-neutral-900 border-red-700/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-neutral-200">
                    {result.success ? '✅' : '❌'} {result.method}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {result.success ? (
                  <pre className="text-sm bg-neutral-950 p-2 rounded overflow-x-auto text-neutral-200">
                    {typeof result.result === 'object' 
                      ? JSON.stringify(result.result, null, 2)
                      : String(result.result)}
                  </pre>
                ) : (
                  <div className="text-red-400 text-sm">{result.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
