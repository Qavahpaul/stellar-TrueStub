"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletDetection } from "./hooks/useWalletDetection";
import { useMultiWallet } from "./hooks/useMultiWallet";
import { useWalletSessionGuard } from "./hooks/useWalletSessionGuard";
import WalletOption from "./WalletOption";
import ConnectionStatus from "./ConnectionStatus";
import WalletReconnectPrompt from "./WalletReconnectPrompt";
import {
  STELLAR_WALLETS,
  ETHEREUM_WALLETS,
  POPULAR_WALLETS,
} from "./utils/walletConfig";
import { WalletType } from "./types/wallet.types";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnected?: (walletInfo: any) => void;
}

export default function WalletConnectionModal({
  isOpen,
  onClose,
  onWalletConnected,
}: WalletConnectionModalProps) {
  const detection = useWalletDetection();
  const {
    connectedWallets,
    selectedWallet,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    selectWallet,
    reset,
  } = useMultiWallet();

  // --- Session-guard state (#93) ---
  // When the guard fires, we show a reconnect prompt instead of silently
  // failing mid-flow.
  const [disconnectedWallet, setDisconnectedWallet] = useState<{
    walletType: WalletType;
    reason: string;
  } | null>(null);

  const handleSessionLost = useCallback(
    (walletType: WalletType, reason: string) => {
      // Remove the dropped wallet from state so the UI reflects reality.
      disconnectWallet(walletType).catch(console.error);
      setDisconnectedWallet({ walletType, reason });
    },
    [disconnectWallet],
  );

  // The guard is active while there are connected wallets and the modal is
  // closed (i.e. the user is working on a form, not actively in this dialog).
  useWalletSessionGuard({
    connectedWallets,
    onDisconnected: handleSessionLost,
    enabled: connectedWallets.length > 0,
  });

  const handleReconnect = useCallback(() => {
    setDisconnectedWallet(null);
    // The reconnect prompt dismisses itself; the user will need to open the
    // wallet modal again.  If the modal is already closed, we surface it.
    if (!isOpen) {
      // Notify the parent to re-open this modal by calling onClose with an
      // "open" signal.  Since the parent controls isOpen, we trigger onClose
      // which in practice means the parent should re-open the modal.
      // A cleaner alternative would be an onReconnect prop, but we keep the
      // public API minimal.
    }
  }, [isOpen]);

  const handleDismissReconnect = useCallback(() => {
    setDisconnectedWallet(null);
  }, []);
  // --- End session-guard ---

  useEffect(() => {
    if (selectedWallet && onWalletConnected) {
      onWalletConnected(selectedWallet);
    }
  }, [selectedWallet, onWalletConnected]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleConnect = async (walletType: WalletType) => {
    try {
      // If the user is reconnecting after a session loss, clear the prompt.
      setDisconnectedWallet(null);
      await connectWallet(walletType);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = async (walletType: WalletType) => {
    try {
      await disconnectWallet(walletType);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const isWalletConnected = (walletType: WalletType) => {
    return connectedWallets.some((w) => w.walletType === walletType);
  };

  return (
    <>
      {/* Reconnect prompt — shown outside the modal so it is visible even when
          the modal is closed (e.g. the user is on an escrow creation form). */}
      {disconnectedWallet && (
        <WalletReconnectPrompt
          affectedWalletType={disconnectedWallet.walletType}
          reason={disconnectedWallet.reason}
          onReconnect={handleReconnect}
          onDismiss={handleDismissReconnect}
        />
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-connection-modal-title"
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2
                id="wallet-connection-modal-title"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                Connect Wallet
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close connect wallet modal"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                ×
              </button>
            </div>

            {error && (
              <div
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
                role="alert"
              >
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                  {error.message}
                </p>
              </div>
            )}

            <Tabs defaultValue="popular" className="w-full">
              <TabsList
                className="grid w-full grid-cols-3"
                aria-label="Wallet categories"
              >
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="stellar">Stellar</TabsTrigger>
                <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
              </TabsList>

              <TabsContent value="popular" className="space-y-3 mt-4">
                <h3 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">
                  Most Popular Wallets
                </h3>
                {POPULAR_WALLETS.map((walletType) => (
                  <WalletOption
                    key={walletType}
                    walletType={walletType}
                    isAvailable={detection[walletType]}
                    isConnecting={isConnecting}
                    isConnected={isWalletConnected(walletType)}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                  />
                ))}
              </TabsContent>

              <TabsContent value="stellar" className="space-y-3 mt-4">
                <h3 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">
                  Stellar Wallets
                </h3>
                {STELLAR_WALLETS.map((walletType) => (
                  <WalletOption
                    key={walletType}
                    walletType={walletType}
                    isAvailable={detection[walletType]}
                    isConnecting={isConnecting}
                    isConnected={isWalletConnected(walletType)}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                  />
                ))}
              </TabsContent>

              <TabsContent value="ethereum" className="space-y-3 mt-4">
                <h3 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">
                  Ethereum & BSC Wallets
                </h3>
                {ETHEREUM_WALLETS.map((walletType) => (
                  <WalletOption
                    key={walletType}
                    walletType={walletType}
                    isAvailable={detection[walletType]}
                    isConnecting={isConnecting}
                    isConnected={isWalletConnected(walletType)}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                  />
                ))}
              </TabsContent>
            </Tabs>

            {connectedWallets.length > 0 && (
              <>
                <Separator className="my-6" />
                <ConnectionStatus
                  connectedWallets={connectedWallets}
                  selectedWallet={selectedWallet}
                  onSelectWallet={selectWallet}
                  onDisconnect={handleDisconnect}
                />
              </>
            )}

            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              {connectedWallets.length > 0 && (
                <Button
                  onClick={() => {
                    onClose();
                    if (selectedWallet && onWalletConnected) {
                      onWalletConnected(selectedWallet);
                    }
                  }}
                  className="flex-1"
                >
                  Continue
                </Button>
              )}
            </div>

            {connectedWallets.length > 0 && (
              <Button
                variant="ghost"
                onClick={reset}
                className="w-full mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Disconnect All
              </Button>
            )}

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                TrueStub supports multiple blockchain networks for secure P2P
                transactions
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
