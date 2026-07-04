import React from 'react';
import { Icon } from '@iconify/react';
import { truncateMiddle, openCreeperHash } from '../../utils/format';

export interface TransactionLike {
  hash: string;
  type: string;
  amount: string;
  account: string;
  timestamp: string;
}

const TYPE_ICON: Record<string, string> = {
  send: 'lucide:arrow-up-right',
  receive: 'lucide:arrow-down-left',
  open: 'lucide:arrow-down-left',
  change: 'lucide:settings',
};

const TYPE_COLOR: Record<string, string> = {
  send: 'text-primary',
  receive: 'text-success',
  open: 'text-success',
  change: 'text-tertiary',
};

const TYPE_LABEL: Record<string, string> = {
  send: 'Sent',
  receive: 'Received',
  open: 'Opened',
  change: 'Changed Rep',
};

export const getTransactionIcon = (type: string): string => TYPE_ICON[type] || 'lucide:circle';
export const getTransactionColor = (type: string): string => TYPE_COLOR[type] || 'text-tertiary';
export const getTransactionLabel = (type: string): string =>
  TYPE_LABEL[type] || type.charAt(0).toUpperCase() + type.slice(1);

interface TransactionRowProps {
  transaction: TransactionLike;
  /** Show a time (History detail) or a date (Dashboard preview). */
  timestampFormat?: 'time' | 'date';
}

/** Single tap-to-explore transaction row shared by Dashboard and History. */
export const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, timestampFormat = 'date' }) => {
  const date = new Date(parseInt(transaction.timestamp) * 1000);
  const timestampLabel =
    timestampFormat === 'time'
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString();

  const isIncoming = transaction.type === 'receive' || transaction.type === 'open';
  const amountPrefix = isIncoming ? '+' : transaction.type === 'send' ? '-' : '';

  return (
    <button
      className="flex justify-between items-center w-full hover:bg-tertiary/10 cursor-pointer transition-colors rounded-lg p-2"
      onClick={() => openCreeperHash(transaction.hash)}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-popover ${getTransactionColor(transaction.type)}`}
        >
          <Icon icon={getTransactionIcon(transaction.type)} width={18} />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-foreground">
            {getTransactionLabel(transaction.type)}
          </span>
          <span className="text-[11px] text-tertiary">{truncateMiddle(transaction.account, 10, 6)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-sm font-bold ${isIncoming ? 'text-success' : 'text-foreground'}`}>
          {amountPrefix}
          {parseFloat(transaction.amount).toFixed(2)}
        </span>
        <span className="text-[11px] text-tertiary">{timestampLabel}</span>
      </div>
    </button>
  );
};
