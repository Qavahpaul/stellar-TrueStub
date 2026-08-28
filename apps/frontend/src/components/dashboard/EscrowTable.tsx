"use client";

import { MoreHorizontal, Eye, FileText, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
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
import { format } from 'date-fns';
import { EscrowData } from './RoleEscrowDashboard';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface EscrowTableProps {
  escrows: EscrowData[];
  userRole: 'guest' | 'event' | 'admin';
}

const statusBadgeVariant = {
  pending: 'outline',
  funded: 'default',
  transfer_confirmed: 'secondary',
  transfer_finalized: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
} as const;

export function EscrowTable({ escrows, userRole }: EscrowTableProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  const totalItems = escrows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = escrows.slice(startIndex, startIndex + pageSize);

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
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return '-';
    }
  };

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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
            <TableHead className="w-[50px] text-gray-600 dark:text-gray-300 font-semibold">
              <Checkbox aria-label="Select all" />
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">{t('dashboard.tablePurchaseId')}</TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">{t('dashboard.tableEventName')}</TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">{t('dashboard.transferDate')}</TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">{t('dashboard.tableDates')}</TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">{t('dashboard.tableAmount')}</TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">{t('dashboard.tableStatus')}</TableHead>
            <TableHead className="text-right text-gray-600 dark:text-gray-300 font-semibold">{t('dashboard.tableActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.length === 0 ? (
            <TableRow className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <TableCell colSpan={8} className="h-24 text-center text-gray-500 dark:text-slate-400">
                {t('interestedPeople.table.notFound')}
              </TableCell>
            </TableRow>
          ) : (
            pageItems.map((escrow) => (
              <TableRow key={escrow.id} className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <TableCell>
                  <Checkbox aria-label={`Select escrow ${escrow.id}`} />
                </TableCell>
                <TableCell className="font-mono text-sm text-gray-500 dark:text-gray-400">
                  {escrow.metadata?.purchaseId || '-'}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-white">
                  <div className="font-medium">
                    {escrow.metadata?.eventName || '-'}
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
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as PageSize);
              setPage(1);
            }}
            className="rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-gray-300"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {totalItems === 0
              ? '0 results'
              : `${startIndex + 1}–${Math.min(startIndex + pageSize, totalItems)} of ${totalItems}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
