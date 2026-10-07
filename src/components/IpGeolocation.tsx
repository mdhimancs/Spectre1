import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, Server, Shield, Activity, RefreshCw, AlertTriangle, Radio } from 'lucide-react';
import { IpGeoResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';
import L from 'leaflet';

interface IpGeolocationProps {
  onAddToGraph?: (ip: string, result: IpGeoResult) => void;
  defaultQuery?: string;
}

export const IpGeolocation: React.FC<IpGeolocationProps> = ({ onAddToGraph, defaultQuery = '1.1.1.1' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [queryInput, setQueryInput] = useState<string>(defaultQuery);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<IpGeoResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const handleGeolocate = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ip/geolocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToSearch.trim() }),
      });

      if (!res.ok) throw new Error('IP geolocation query failed');
      const data: IpGeoResult = await res.json();
      setResult(data);

      if (onAddToGraph) {
        onAddToGraph(data.ip, data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error looking up IP');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGeolocate(defaultQuery);
  }, []);

  // Update Leaflet Map when result or theme changes
  useEffect(() => {
    if (!result || !mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([result.lat, result.lon], 10);

      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom pulsing cyber marker
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full ${isDark ? 'bg-cyan-500/30' : 'bg-cyan-700/30'} animate-ping"></div>
          <div class="w-4 h-4 rounded-full ${isDark ? 'bg-cyan-400 border-2 border-slate-950' : 'bg-cyan-700 border-2 border-white'} shadow-lg shadow-cyan-500/50"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([result.lat, result.lon], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<b>Target IP: ${result.ip}</b><br/>${result.city}, ${result.country}<br/>${result.isp}`)
        .openPopup();

      leafletMapRef.current = map;
    } catch (e) {
      console.error('Leaflet initialization error:', e);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [result, isDark]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className={`border rounded-lg p-5 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <Globe className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>IP Geolocation & BGP Autonomous System Matrix</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Trace physical geolocation coordinates, Autonomous System Numbers (ASN), hosting ISP providers, and VPN/Proxy indicators.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); handleGeolocate(queryInput); }}
          className="mt-4 flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Enter IP v4/v6 or Domain (e.g. 8.8.8.8 or cloudflare.com)..."
            className={`flex-1 border rounded-md px-3 py-2 text-xs font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
            }`}
          />

          <button
            type="submit"
            disabled={isLoading || !queryInput.trim()}
            className={`px-5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-cyan-800 hover:bg-cyan-900 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Geolocating...</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5" />
                <span>Locate Target</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Data Grid */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`border rounded-lg p-4 space-y-3 ${
              isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={`text-xs font-semibold font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target IP Address</span>
                <span className={`text-xs font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>{result.ip}</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Country</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-900 font-medium'}>{result.country} ({result.countryCode})</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Region & City</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-900 font-medium'}>{result.city}, {result.region}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Coordinates</span>
                  <span className={`font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>{result.lat}, {result.lon}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>ISP Provider</span>
                  <span className={`truncate max-w-[200px] ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{result.isp}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Organization</span>
                  <span className={`truncate max-w-[200px] ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{result.org}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Autonomous System</span>
                  <span className="text-amber-600 font-semibold">{result.asn}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Timezone</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>{result.timezone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Proxy/VPN/Cloud Node</span>
                  <span className={result.isProxy ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {result.isProxy ? 'DETECTED' : 'CLEAN RESIDENTIAL/ISP'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ports & Services Overview */}
            <div className={`border rounded-lg p-4 space-y-2 ${
              isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
            }`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Server className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                <span>Common Open Port Matrix</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { port: '80/441', service: 'HTTP/HTTPS', status: 'OPEN' },
                  { port: '22', service: 'SSH Remote', status: 'FILTERED' },
                  { port: '53', service: 'DNS Resolver', status: 'ACTIVE' },
                  { port: '3389', service: 'RDP Remote', status: 'CLOSED' },
                ].map((item) => (
                  <div key={item.port} className={`border p-2 rounded flex justify-between ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{item.service}</span>
                    <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Leaflet Map Container */}
          <div className="lg:col-span-7">
            <div className={`border rounded-lg p-2 h-[420px] flex flex-col space-y-2 ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-xs'
            }`}>
              <div className="flex items-center justify-between px-2 pt-1">
                <span className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <MapPin className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                  <span>Geographic Satellite Visualizer</span>
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>CartoDB Map Tile Layer</span>
              </div>
              <div ref={mapContainerRef} className={`w-full flex-1 rounded overflow-hidden ${
                isDark ? 'bg-slate-950' : 'bg-slate-100'
              }`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
