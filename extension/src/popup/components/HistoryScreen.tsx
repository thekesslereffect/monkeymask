import React, { useEffect, useState } from 'react';
import { Header, ContentContainer, Footer, Separator, PageName, Card, TransactionSkeleton, EmptyState } from './ui';
import { useAccounts } from '../hooks/useAccounts';
import { TransactionRow } from './TransactionRow';

interface Transaction {
  hash: string;
  type: string;
  amount: string;
  account: string;
  timestamp: string;
  local_timestamp: string;
}

interface GroupedTransactions {
  [key: string]: Transaction[];
}

export const HistoryScreen: React.FC = () => {
  const { accounts, currentAccount } = useAccounts();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPageHead, setNextPageHead] = useState<string | null>(null);

  const fetchTransactions = async (head?: string | null, append: boolean = false) => {
    if (!accounts || accounts.length === 0) return;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await chrome.runtime.sendMessage({
        type: 'GET_ACCOUNT_HISTORY',
        address: currentAccount?.address || '',
        count: 20, // Fetch 20 transactions per page
        head: head || undefined
      });

      if (response.success) {
        const newTransactions = response.data.transactions;
        
        if (append) {
          // Append new transactions to existing ones
          setAllTransactions(prev => [...prev, ...newTransactions]);
        } else {
          // Replace all transactions (initial load)
          setAllTransactions(newTransactions);
        }

        // Update pagination state
        setHasMore(response.data.hasMore && newTransactions.length > 0);
        setNextPageHead(response.data.previousHash);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (!hasMore || loadingMore) return;
    await fetchTransactions(nextPageHead, true);
  };

  useEffect(() => {
    // Reset state when accounts change
    setAllTransactions([]);
    setHasMore(true);
    setNextPageHead(null);
    fetchTransactions();
  }, [accounts]);

  const groupTransactionsByTime = (transactions: Transaction[]): GroupedTransactions => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups: GroupedTransactions = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Older': []
    };

    transactions.forEach(transaction => {
      const transactionDate = new Date(parseInt(transaction.timestamp) * 1000);
      
      if (transactionDate >= today) {
        groups['Today'].push(transaction);
      } else if (transactionDate >= yesterday) {
        groups['Yesterday'].push(transaction);
      } else if (transactionDate >= thisWeek) {
        groups['This Week'].push(transaction);
      } else if (transactionDate >= thisMonth) {
        groups['This Month'].push(transaction);
      } else {
        groups['Older'].push(transaction);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  };

  const groupedTransactions = groupTransactionsByTime(allTransactions);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Header active/>
        <ContentContainer>
          <PageName name="History" back={true} />
          <div className="w-full space-y-4">
            {/* Skeleton for grouped transactions */}
            {Array.from({ length: 3 }).map((_, groupIndex) => (
              <Card key={groupIndex} label="" className="w-full">
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, transactionIndex) => (
                    <TransactionSkeleton key={transactionIndex} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </ContentContainer>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-semibold">
      <Header active/>

      <ContentContainer>
        <PageName name="History" back={true} />
        {Object.keys(groupedTransactions).length === 0 ? (
          <EmptyState
            icon="lucide:clock"
            title="No transaction history"
            description="Your transactions will appear here"
          />
        ) : (
          <div className="w-full space-y-4">
            {Object.entries(groupedTransactions).map(([timeGroup, transactions]) => (
              <Card key={timeGroup} label={timeGroup} className="w-full">
                {transactions.map((transaction, i) => (
                  <div key={transaction.hash}>
                    <TransactionRow transaction={transaction} timestampFormat="time" />
                    {i !== transactions.length - 1 && (
                      <Separator className="w-full my-2" />
                    )}
                  </div>
                ))}
              </Card>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="w-full flex justify-center pt-4">
                <button
                  onClick={loadMoreTransactions}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-tertiary hover:text-primary rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </ContentContainer>

      <Footer />
    </div>
  );
};
