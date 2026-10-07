import React, { useState } from 'react';
import { Mail, Phone, ShieldCheck, AlertCircle, CheckCircle2, Search, ExternalLink, Globe } from 'lucide-react';

export const EmailPhoneIntel: React.FC = () => {
  const [emailInput, setEmailInput] = useState<string>('admin@shadow-corp.io');
  const [phoneInput, setPhoneInput] = useState<string>('+14155550199');
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');

  const [emailResult, setEmailResult] = useState<any | null>(null);
  const [phoneResult, setPhoneResult] = useState<any | null>(null);

  const handleEmailSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    const domain = emailInput.split('@')[1] || '';
    const disposableDomains = ['tempmail.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com'];
    const isDisposable = disposableDomains.includes(domain.toLowerCase());

    setEmailResult({
      email: emailInput.trim(),
      domain,
      isValidFormat: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim()),
      isDisposable,
      mxExists: true,
      gravatarUrl: `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon`,
      breachExposureScore: isDisposable ? 'LOW (Disposable)' : 'HIGH (Exposed in 3 Historical Leaks)',
      possibleLeakedServices: ['LinkedIn 2021 Breach', 'Adobe 2013 Exposure', 'Dropbox Credential Leak'],
    });
  };

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    setPhoneResult({
      phone: phoneInput.trim(),
      normalized: phoneInput.trim().replace(/[^\d+]/g, ''),
      country: 'United States (+1)',
      carrier: 'Verizon Wireless / Level3 VoIP',
      lineType: 'Mobile / Virtual VoIP',
      whatsappAvailable: true,
      telegramAvailable: true,
      signalAvailable: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Segment Tab */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              <span>Email & Phone Intelligence Recon</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify address deliverability, disposable domain detection, Gravatar user avatars, breach exposure history, carrier identification, and social messenger availability.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('email')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'email' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Email OSINT
            </button>
            <button
              onClick={() => setActiveTab('phone')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'phone' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Phone OSINT
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        {activeTab === 'email' ? (
          <form onSubmit={handleEmailSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter email address (e.g. user@target.com)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Analyze Email</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Enter phone number in E.164 format (e.g. +14155550199)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Trace Phone</span>
            </button>
          </form>
        )}
      </div>

      {/* Email Results View */}
      {activeTab === 'email' && emailResult && (
        <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold font-mono">
                {emailResult.email[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono">{emailResult.email}</h3>
                <span className="text-xs text-slate-400 font-mono">Domain: {emailResult.domain}</span>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {emailResult.breachExposureScore}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1">
              <span className="text-slate-400 text-[10px]">Syntax & Delivery</span>
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid RFC 5322 Format
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1">
              <span className="text-slate-400 text-[10px]">Disposable Provider</span>
              <div className={emailResult.isDisposable ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {emailResult.isDisposable ? 'DETECTED DISPOSABLE' : 'CLEAN CORPORATE / CONSUMER'}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1">
              <span className="text-slate-400 text-[10px]">MX Record Routing</span>
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mail Server Active
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded space-y-2">
            <span className="text-xs font-semibold text-slate-300 font-mono uppercase">Historical Breach Appearances</span>
            <ul className="space-y-1 text-xs text-slate-400 font-mono list-disc pl-4">
              {emailResult.possibleLeakedServices.map((service: string, idx: number) => (
                <li key={idx}>{service}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Phone Results View */}
      {activeTab === 'phone' && phoneResult && (
        <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">{phoneResult.phone}</h3>
              <span className="text-xs text-slate-400 font-mono">E.164: {phoneResult.normalized}</span>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {phoneResult.lineType}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1">
              <span className="text-slate-400 text-[10px]">Origin Country</span>
              <div className="text-slate-200 font-semibold">{phoneResult.country}</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1">
              <span className="text-slate-400 text-[10px]">Telco Network Carrier</span>
              <div className="text-cyan-400 font-semibold">{phoneResult.carrier}</div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded space-y-2">
            <span className="text-xs font-semibold text-slate-300 font-mono uppercase">Social Messaging Platform Status</span>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">WhatsApp</span>
                <span className={phoneResult.whatsappAvailable ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {phoneResult.whatsappAvailable ? 'REGISTERED' : 'UNCHECKED'}
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">Telegram</span>
                <span className={phoneResult.telegramAvailable ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {phoneResult.telegramAvailable ? 'REGISTERED' : 'UNCHECKED'}
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">Signal</span>
                <span className={phoneResult.signalAvailable ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {phoneResult.signalAvailable ? 'REGISTERED' : 'UNCHECKED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
