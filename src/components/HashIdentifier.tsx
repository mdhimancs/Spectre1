import React, { useState } from 'react';
import { Key, Search, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { HashIdentifyResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

export const HashIdentifier: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [hashInput, setHashInput] = useState<string>('5f4dcc3b5aa765d61d8327deb882cf99');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [result, setResult] = useState<HashIdentifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hashInput.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/hash/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: hashInput.trim() }),
      });

      if (!res.ok) throw new Error('Hash identification failed');
      const data: HashIdentifyResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error identifying hash');
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
          <Key className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Password Hash Algorithm Identifier & Rainbow Table Lookup</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Identify cryptographic hash types (MD5, SHA1, SHA256, NTLM, Bcrypt, Argon2) and lookup cracked plaintext candidates in leak databases.
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="Enter Hash String (e.g. 5f4dcc3b5aa765d61d8327deb882cf99)..."
            className={`flex-1 border rounded-md px-3 py-2 text-xs font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
            }`}
          />

          <button
            type="submit"
            disabled={isSearching || !hashInput.trim()}
            className={`px-5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-cyan-800 hover:bg-cyan-900 text-white'
            }`}
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Identifying Hash...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Identify Hash</span>
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
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Identified Hash String</span>
              <h3 className={`text-base font-bold truncate max-w-md ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{result.hash}</h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Possible Types: {result.possibleAlgorithms.join(', ')}
              </p>
            </div>

            {result.plaintextCandidate && (
              <div className="text-right">
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Cracked Plaintext Candidate</span>
                <div className="text-2xl font-bold text-emerald-600">
                  {result.plaintextCandidate}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
