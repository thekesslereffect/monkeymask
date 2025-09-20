import React, { useEffect, useState } from 'react';
import { Header, ContentContainer, Footer, Separator, PageName, Card } from './ui';
import { Icon } from '@iconify/react';
import { useNavigation } from '../hooks/useRouter';
import { useAccounts } from '../hooks/useAccounts';

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
  const navigation = useNavigation();
  const { accounts } = useAccounts();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPageHead, setNextPageHead] = useState<string | null>(null);

  const handleViewOnCreeper = (hash: string) => {
    window.open(`https://creeper.banano.cc/hash/${hash}`, '_blank');
  };

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
        address: accounts[0].address,
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

  const formatTransactionTime = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupedTransactions = groupTransactionsByTime(allTransactions);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Header active/>
        <ContentContainer>
          <PageName name="History" back={true} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-tertiary">Loading history...</div>
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8">
              <Icon icon="lucide:clock" className="text-4xl text-tertiary mb-4 mx-auto" />
              <div className="text-tertiary">
                <div className="text-lg mb-2">No transaction history</div>
                <div className="text-sm">Your transactions will appear here</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {Object.entries(groupedTransactions).map(([timeGroup, transactions]) => (
              <Card key={timeGroup} label={timeGroup} className="w-full">
                {transactions.map((transaction, i) => (
                  <div key={transaction.hash}>
                    <button 
                      className="flex justify-between items-center w-full hover:bg-tertiary/10 cursor-pointer transition-colors rounded-lg p-2 text-tertiary"
                      onClick={() => handleViewOnCreeper(transaction.hash)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon 
                          icon={
                            transaction.type === 'send' ? "lucide:arrow-up-right" : 
                            transaction.type === 'receive' ? "lucide:arrow-down-left" :
                            transaction.type === 'open' ? "lucide:arrow-down-left" :
                            transaction.type === 'change' ? "lucide:settings" :
                            "lucide:circle"
                          } 
                          className={
                            transaction.type === 'send' ? "text-destructive" : 
                            transaction.type === 'receive' || transaction.type === 'open' ? "text-primary" :
                            transaction.type === 'change' ? "text-tertiary" :
                            "text-tertiary"
                          }
                        />
                        <div className="flex flex-col items-start">
                          <span className="text-sm">
                            {transaction.type === 'send' ? "Sent" : 
                             transaction.type === 'receive' ? "Received" : 
                             transaction.type === 'open' ? "Opened" :
                             transaction.type === 'change' ? "Changed Rep" :
                             transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                          <span className="text-xs">
                            {transaction.account.slice(0, 10)}...{transaction.account.slice(-6)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm">
                          {parseFloat(transaction.amount).toFixed(2)} BAN
                        </span>
                        <span className="text-xs">
                          {formatTransactionTime(transaction.timestamp)}
                        </span>
                      </div>
                    </button>
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
                  className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-tertiary hover:text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
