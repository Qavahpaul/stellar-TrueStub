"use client";

import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal, Eye, FileText, CheckCircle2, XCircle, Inbox, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { EscrowData } from './RoleEscrowDashboard';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface EscrowTableProps {
  escrows: EscrowData[];
  userRole: 'guest' | 'event' | 'admin';
  error?: string | null;
  onRetry?: () => void;
}

const statusBadgeVariant = {
  pending: 'outline',
  funded: 'default',
  transfer_confirmed: 'secondary',
  transfer_finalized: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
} as const;

type SortKey = 'purchaseId' | 'eventName' | 'transferDate' | 'eventDate' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

export function EscrowTable({ escrows, userRole, error = null, onRetry }: EscrowTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('dashboard.statusPending');
      case 'funded': return t('dashboard.statusFunded');
      case 'transfer_confirmed': return t('dashboard.statusTransferConfirmed');
      case 'transfer_finalized': return t('dashboard.statusTransferFinalized');
      case 'completed': return t('dashboard.statusCompleted');
      case 'cancelled': return t('dashboard.statusCancelled');
      default: return status;
    }
  };

  const handleViewDetails = (escrowId: string) => {
    router.push(`/dashboard/escrow/${escrowId}`);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'XLM' ? 'USD' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return '—';
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedEscrows = useMemo(() => {
    if (!sortKey) return escrows;

    const dateValue = (value?: string) => (value ? new Date(value).getTime() : 0);

    const sorted = [...escrows].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'purchaseId':
          comparison = (a.metadata?.purchaseId || '').localeCompare(b.metadata?.purchaseId || '');
          break;
        case 'eventName':
          comparison = (a.metadata?.eventName || '').localeCompare(b.metadata?.eventName || '');
          break;
        case 'transferDate':
          comparison = dateValue(a.metadata?.transferDate) - dateValue(b.metadata?.transferDate);
          break;
        case 'eventDate':
          comparison = dateValue(a.metadata?.eventDate) - dateValue(b.metadata?.eventDate);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [escrows, sortKey, sortDirection]);

  const getActionButton = (escrow: EscrowData) => {
    if (userRole === 'event' && escrow.status === 'funded' && escrow.nextMilestone === 'transfer_initiated') {
      return (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleViewDetails(escrow.id)}
        >
          {t('dashboard.approveTransfer')}
        </Button>
      );
    }

    if (userRole === 'admin' && escrow.status === 'transfer_confirmed') {
      return (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleViewDetails(escrow.id)}
        >
          {t('dashboard.completeTransfer')}
        </Button>
      );
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => handleViewDetails(escrow.id)}
      >
        <Eye className="h-4 w-4 mr-2" />
        {t('dashboard.viewDetails')}
      </Button>
    );
  };

  const SortableHeader = ({ sortKey: key, label, className }: { sortKey: SortKey; label: string; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => handleSort(key)}
        className="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {label}
        {sortKey === key ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">
        <EmptyState
          icon={AlertTriangle}
          variant="error"
          title={t('dashboard.errorLoadingEscrows')}
          description={error}
          actionLabel={onRetry ? t('dashboard.retry') : undefined}
          onAction={onRetry}
        />
      </div>
    );
  }

  const renderMobileCard = (escrow: EscrowData) => (
    <div
      key={escrow.id}
      className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 last:border-b-0"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {escrow.metadata?.eventName || '—'}
          </p>
          <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
            {escrow.metadata?.purchaseId || '—'}
          </p>
        </div>
        <Badge variant={statusBadgeVariant[escrow.status] || 'outline'} className="whitespace-nowrap shrink-0">
          {getStatusText(escrow.status)}
        </Badge>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 text-sm">
        <dt className="text-gray-500 dark:text-gray-400">{t('dashboard.tableAmount')}</dt>
        <dd className="text-right text-gray-900 dark:text-white font-medium">
          {formatCurrency(escrow.amount, escrow.asset.code)}
        </dd>
        <dt className="text-gray-500 dark:text-gray-400">{t('dashboard.transferDate')}</dt>
        <dd className="text-right text-gray-900 dark:text-white">{formatDate(escrow.metadata?.transferDate)}</dd>
        <dt className="text-gray-500 dark:text-gray-400">{t('dashboard.tableDates')}</dt>
        <dd className="text-right text-gray-900 dark:text-white">{formatDate(escrow.metadata?.eventDate)}</dd>
      </dl>

      <div className="mt-3">{getActionButton(escrow)}</div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">
      {escrows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t('dashboard.noEscrowsTitle')}
          description={t('dashboard.noEscrowsDescription')}
        />
      ) : (
        <>
          {/* Mobile: stacked cards, no horizontal scroll */}
          <div className="md:hidden">
            {sortedEscrows.map(renderMobileCard)}
          </div>

          {/* Desktop / tablet: full table */}
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
                <TableHead className="w-[50px] text-gray-600 dark:text-gray-300 font-semibold">
                  <Checkbox aria-label="Select all" />
                </TableHead>
                <SortableHeader sortKey="purchaseId" label={t('dashboard.tablePurchaseId')} />
                <SortableHeader sortKey="eventName" label={t('dashboard.tableEventName')} />
                <SortableHeader sortKey="transferDate" label={t('dashboard.transferDate')} />
                <SortableHeader sortKey="eventDate" label={t('dashboard.tableDates')} />
                <SortableHeader sortKey="amount" label={t('dashboard.tableAmount')} />
                <SortableHeader sortKey="status" label={t('dashboard.tableStatus')} />
                <TableHead className="text-right text-gray-600 dark:text-gray-300 font-semibold">{t('dashboard.tableActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEscrows.map((escrow) => (
                <TableRow key={escrow.id} className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <TableCell>
                    <Checkbox aria-label={`Select escrow ${escrow.id}`} />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-500 dark:text-gray-400">
                    {escrow.metadata?.purchaseId || '—'}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-white">
                    <div className="font-medium">
                      {escrow.metadata?.eventName || '—'}
                    </div>
                    <div className="text-xs text-muted-foreground dark:text-slate-400">
                      {escrow.marker ? `${escrow.marker.slice(0, 6)}...${escrow.marker.slice(-4)}` : ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-white">{formatDate(escrow.metadata?.transferDate)}</TableCell>
                  <TableCell className="text-gray-900 dark:text-white">{formatDate(escrow.metadata?.eventDate)}</TableCell>
                  <TableCell className="text-gray-900 dark:text-white">
                    {formatCurrency(escrow.amount, escrow.asset.code)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusBadgeVariant[escrow.status] || 'outline'}
                      className="whitespace-nowrap"
                    >
                      {getStatusText(escrow.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open menu">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('dashboard.tableActions')}</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(escrow.id)}
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('dashboard.viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <FileText className="h-4 w-4 mr-2" />
                            {t('common.view')}
                          </DropdownMenuItem>
                          {escrow.status === 'completed' && (
                            <DropdownMenuItem className="cursor-pointer">
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              {t('dashboard.statusCompleted')}
                            </DropdownMenuItem>
                          )}
                          {escrow.status !== 'cancelled' && escrow.status !== 'completed' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 cursor-pointer">
                                <XCircle className="h-4 w-4 mr-2" />
                                {t('common.cancel')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </>
      )}
    </div>
  );
}
