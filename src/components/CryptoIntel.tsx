import React, { useState } from 'react';
import { Coins, AlertTriangle, ShieldCheck, RefreshCw, ExternalLink, Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { CryptoWalletResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface CryptoIntelProps {
  onAddToGraph?: (address: string, result: CryptoWalletResult) => void;
  defaultAddress?: string;
}

export const CryptoIntel: React.FC<CryptoIntelProps> = ({ onAddToGraph, defaultAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [addressInput, setAddressInput] = useState<string>(defaultAddress);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [result, setResult] = useState<CryptoWalletResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addressInput.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/crypto/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressInput.trim() }),
      });

      if (!res.ok) throw new Error('Crypto forensic lookup failed');
      const data: CryptoWalletResult = await res.json();
      setResult(data);

      if (onAddToGraph) {
        onAddToGraph(data.address, data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error tracing crypto address');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-5 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <Coins className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Crypto & Blockchain Ledger Forensic Tracker (BTC / ETH / USDT / XMR)</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Trace cryptocurrency wallet balances, transaction histories, first/last seen timestamps, and OFAC sanctions blacklists.
        </p>

        <form onSubmit={handleLookup} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Enter BTC / ETH / USDT Wallet Address..."
            className={`flex-1 border rounded-md px-3 py-2 text-xs font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
            }`}
          />

          <button
            type="submit"
            disabled={isSearching || !addressInput.trim()}
            className={`px-5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-cyan-800 hover:bg-cyan-900 text-white'
            }`}
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Tracing Ledger...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Trace Wallet</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>

      {result && (
        <div className="space-y-4 font-mono text-xs">
          <div className={`border rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <div>
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Target Wallet Address</span>
              <h3 className={`text-base font-bold truncate max-w-md ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{result.address}</h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                First Seen: {result.firstSeen} · Last Seen: {result.lastSeen}
              </p>
            </div>

            <div className="text-right">
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Final Balance</span>
              <div className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>
                {result.balance} {result.currency}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`border p-3.5 rounded space-y-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Received</span>
              <span className="text-emerald-600 font-bold text-sm block">+{result.totalReceived} {result.currency}</span>
            </div>
            <div className={`border p-3.5 rounded space-y-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Sent</span>
              <span className="text-amber-600 font-bold text-sm block">-{result.totalSent} {result.currency}</span>
            </div>
            <div className={`border p-3.5 rounded space-y-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sanctions / Blacklist Status</span>
              <span className={`font-bold text-xs block ${result.sanctionsFlag ? 'text-red-600' : 'text-emerald-600'}`}>
                {result.sanctionsFlag ? 'FLAGGED SANCTIONED WALLET' : 'CLEAN WALLET'}
              </span>
            </div>
          </div>

          {/* Recent Ledger Transactions */}
          <div className={`border rounded-lg p-4 space-y-3 ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Recent Blockchain Ledger Transactions
            </h4>

            <div className="space-y-2">
              {result.recentTx?.map((tx, idx) => (
                <div key={idx} className={`border p-3 rounded flex items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-0.5 truncate pr-2">
                    <span className={`text-slate-500 text-[10px] block`}>Tx Hash: {tx.txHash}</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{tx.timestamp}</span>
                  </div>

                  <span className={`px-2.5 py-1 rounded font-bold text-xs shrink-0 flex items-center gap-1 ${
                    tx.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {tx.type === 'IN' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {tx.amount} {result.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
