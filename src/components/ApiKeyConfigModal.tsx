import React, { useState, useEffect } from 'react';
import { Key, Shield, Check, X, Save } from 'lucide-react';

interface ApiKeyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyConfigModal: React.FC<ApiKeyConfigModalProps> = ({ isOpen, onClose }) => {
  const [shodanKey, setShodanKey] = useState<string>('');
  const [vtKey, setVtKey] = useState<string>('');
  const [hunterKey, setHunterKey] = useState<string>('');
  const [hibpKey, setHibpKey] = useState<string>('');
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    setShodanKey(localStorage.getItem('spectre_shodan_key') || '');
    setVtKey(localStorage.getItem('spectre_vt_key') || '');
    setHunterKey(localStorage.getItem('spectre_hunter_key') || '');
    setHibpKey(localStorage.getItem('spectre_hibp_key') || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('spectre_shodan_key', shodanKey.trim());
    localStorage.setItem('spectre_vt_key', vtKey.trim());
    localStorage.setItem('spectre_hunter_key', hunterKey.trim());
    localStorage.setItem('spectre_hibp_key', hibpKey.trim());

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 font-mono">Production OSINT API Integrations</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          When exported to production or self-hosted servers, plug in optional threat intelligence API keys to enable direct real-time queries.
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-slate-300 block mb-1">Shodan.io API Key</label>
            <input
              type="password"
              value={shodanKey}
              onChange={(e) => setShodanKey(e.target.value)}
              placeholder="Paste Shodan API Key..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">VirusTotal API Key</label>
            <input
              type="password"
              value={vtKey}
              onChange={(e) => setVtKey(e.target.value)}
              placeholder="Paste VirusTotal v3 API Key..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Hunter.io Domain Search API Key</label>
            <input
              type="password"
              value={hunterKey}
              onChange={(e) => setHunterKey(e.target.value)}
              placeholder="Paste Hunter.io API Key..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">HaveIBeenPwned API Key</label>
            <input
              type="password"
              value={hibpKey}
              onChange={(e) => setHibpKey(e.target.value)}
              placeholder="Paste HIBP v3 API Key..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs font-mono flex items-center gap-1.5"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Saved!' : 'Save Credentials'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
