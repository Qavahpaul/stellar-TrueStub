"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Copy, Download, Plus, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportWalletsToCSV } from "@/lib/exportToCSV";

interface WalletEntry {
  address: string;
  fullAddress?: string;
  isPrimary: boolean;
  network: string;
}

interface WalletAddressTableProps {
  wallets: WalletEntry[];
  onAddWallet?: () => void;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

type SortKey = "address" | "network" | "isPrimary";
type SortDirection = "asc" | "desc";

export function WalletAddressTable({ wallets, onAddWallet }: WalletAddressTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  async function handleCopy(wallet: WalletEntry) {
    try {
      await navigator.clipboard.writeText(wallet.fullAddress ?? wallet.address);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function handleExport() {
    exportWalletsToCSV(
      wallets.map((w) => ({
        address: w.fullAddress ?? w.address,
        network: w.network,
        isPrimary: w.isPrimary,
      })),
    );
  }

  const sortedWallets = useMemo(() => {
    if (!sortKey) return wallets;

    const sorted = [...wallets].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "address":
          comparison = (a.fullAddress ?? a.address).localeCompare(b.fullAddress ?? b.address);
          break;
        case "network":
          comparison = a.network.localeCompare(b.network);
          break;
        case "isPrimary":
          comparison = Number(a.isPrimary) - Number(b.isPrimary);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [wallets, sortKey, sortDirection]);

  const SortableHeader = ({ sortKey: key, label, className }: { sortKey: SortKey; label: string; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => handleSort(key)}
        className="flex items-center gap-1 font-medium text-foreground hover:text-foreground/80 transition-colors"
      >
        {label}
        {sortKey === key ? (
          sortDirection === "asc" ? (
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Wallet Addresses
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleExport}
            disabled={wallets.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={onAddWallet}>
            <Plus className="h-4 w-4" />
            Add Wallet
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {wallets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No wallets added yet"
            description="Add a wallet address to start receiving and sending funds."
            actionLabel={onAddWallet ? "Add Wallet" : undefined}
            onAction={onAddWallet}
          />
        ) : (
          <>
            {/* Mobile: stacked cards, no horizontal scroll */}
            <div className="space-y-3 md:hidden">
              {sortedWallets.map((wallet) => (
                <div key={wallet.address} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm">{truncateAddress(wallet.address)}</span>
                    {wallet.isPrimary && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{wallet.network}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(wallet)}
                    className="mt-2 gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              ))}
            </div>

            {/* Desktop / tablet: full table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader sortKey="address" label="Address" />
                    <SortableHeader sortKey="network" label="Network" />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedWallets.map((wallet) => (
                    <TableRow key={wallet.address}>
                      <TableCell className="font-mono text-sm">
                        {truncateAddress(wallet.address)}
                        {wallet.isPrimary && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Primary
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{wallet.network}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(wallet)}
                          className="gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
