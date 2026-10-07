import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, MapPin, AlertTriangle, ShieldCheck, FileText, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { ExifParsedData } from '../types/osint';
import ExifReader from 'exifreader';
import L from 'leaflet';

interface ExifMetadataExtractorProps {
  onAddToGraph?: (fileData: ExifParsedData) => void;
}

export const ExifMetadataExtractor: React.FC<ExifMetadataExtractorProps> = ({ onAddToGraph }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ExifParsedData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setErrorMsg('');

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }

    processExif(selectedFile);
  };

  const processExif = async (targetFile: File) => {
    setIsProcessing(true);
    try {
      const buffer = await targetFile.arrayBuffer();
      const tags = ExifReader.load(buffer, { expanded: true });

      const rawTagsRecord: Record<string, string> = {};
      const exifObject = (tags.exif || {}) as Record<string, any>;

      Object.keys(exifObject).forEach((key) => {
        const val = exifObject[key];
        if (val) {
          rawTagsRecord[key] = val.description || String(val.value || '');
        }
      });

      // Extract GPS
      let lat: number | undefined;
      let lon: number | undefined;
      let alt: number | undefined;

      if (tags.gps && tags.gps.Latitude !== undefined && tags.gps.Longitude !== undefined) {
        lat = tags.gps.Latitude;
        lon = tags.gps.Longitude;
        if (tags.gps.Altitude !== undefined) alt = tags.gps.Altitude;
      }

      // Identify privacy risks
      const privacyRisks: string[] = [];
      if (lat && lon) {
        privacyRisks.push(`EXIF contains exact GPS geolocation coordinates (${lat.toFixed(5)}, ${lon.toFixed(5)})`);
      }
      if (exifObject.SerialNumber?.description || exifObject.BodySerialNumber?.description) {
        privacyRisks.push(`Device camera serial number leaked (${exifObject.SerialNumber?.description || exifObject.BodySerialNumber?.description})`);
      }
      if (exifObject.DateTimeOriginal?.description) {
        privacyRisks.push(`Exact capture timestamp exposed (${exifObject.DateTimeOriginal.description})`);
      }
      if (exifObject.Software?.description) {
        privacyRisks.push(`Editing software / OS path signature detected (${exifObject.Software.description})`);
      }

      const parsed: ExifParsedData = {
        fileName: targetFile.name,
        fileSize: targetFile.size,
        fileType: targetFile.type || 'Unknown Format',
        make: exifObject.Make?.description,
        model: exifObject.Model?.description,
        lensModel: exifObject.LensModel?.description,
        dateTimeOriginal: exifObject.DateTimeOriginal?.description,
        exposureTime: exifObject.ExposureTime?.description,
        fNumber: exifObject.FNumber?.description,
        isoSpeed: exifObject.ISOSpeedRatings?.description,
        focalLength: exifObject.FocalLength?.description,
        software: exifObject.Software?.description,
        gpsLatitude: lat,
        gpsLongitude: lon,
        gpsAltitude: alt,
        rawTags: rawTagsRecord,
        privacyRisks,
      };

      setParsedData(parsed);

      if (onAddToGraph) {
        onAddToGraph(parsed);
      }
    } catch (err: any) {
      console.warn('EXIF processing notice:', err);
      // Fallback object for files without EXIF header
      const fallback: ExifParsedData = {
        fileName: targetFile.name,
        fileSize: targetFile.size,
        fileType: targetFile.type || 'Unknown Format',
        rawTags: {},
        privacyRisks: ['No EXIF metadata or GPS header found in this file (cleaned or stripped).'],
      };
      setParsedData(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render Leaflet Map for EXIF GPS
  useEffect(() => {
    if (!parsedData || parsedData.gpsLatitude === undefined || parsedData.gpsLongitude === undefined || !mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([parsedData.gpsLatitude, parsedData.gpsLongitude], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-amber-500/40 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 shadow-lg shadow-amber-500/50"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([parsedData.gpsLatitude, parsedData.gpsLongitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<b>EXIF Photo Location</b><br/>Lat: ${parsedData.gpsLatitude}<br/>Lon: ${parsedData.gpsLongitude}`)
        .openPopup();

      leafletMapRef.current = map;
    } catch (e) {
      console.error('EXIF map render error:', e);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [parsedData]);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          <span>Image EXIF & Document Metadata Inspector</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Extract hidden camera specs, GPS geolocation tags, camera serial numbers, and creation timestamps from JPG, PNG, TIFF, and PDF files.
        </p>

        <div className="mt-4 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-lg p-6 text-center transition-colors bg-slate-950/50 cursor-pointer">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="hidden"
            id="exif-file-input"
          />
          <label htmlFor="exif-file-input" className="cursor-pointer space-y-2 block">
            <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
            <div className="text-xs font-semibold text-slate-200">
              Drag & Drop or Click to Select Media File
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Supports JPEG, PNG, WEBP, TIFF, HEIC, PDF
            </p>
          </label>
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center p-8 text-cyan-400 text-xs font-mono gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Parsing EXIF Headers & Extracting GPS Metadata...</span>
        </div>
      )}

      {parsedData && !isProcessing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Preview & Privacy Risk Card */}
          <div className="lg:col-span-5 space-y-4">
            {imagePreview && (
              <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-3 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Media Preview</span>
                <img
                  src={imagePreview}
                  alt="Uploaded media"
                  className="w-full max-h-60 object-contain rounded bg-slate-950 border border-slate-800"
                />
              </div>
            )}

            {/* Privacy Risks */}
            <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Identified Privacy & Security Exposure</span>
              </h3>

              <div className="space-y-1.5">
                {parsedData.privacyRisks.map((risk, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-2.5 rounded text-xs font-mono text-amber-200/90 leading-relaxed">
                    • {risk}
                  </div>
                ))}
              </div>
            </div>

            {/* File Specs */}
            <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-4 space-y-2 font-mono text-xs">
              <span className="text-[10px] text-slate-400 uppercase block">File Properties</span>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Filename</span>
                <span className="text-slate-200 truncate max-w-[200px]">{parsedData.fileName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">File Size</span>
                <span className="text-slate-200">{(parsedData.fileSize / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">MIME Type</span>
                <span className="text-slate-200">{parsedData.fileType}</span>
              </div>
            </div>
          </div>

          {/* Right Column: EXIF Details & GPS Map */}
          <div className="lg:col-span-7 space-y-4">
            {/* EXIF Camera Details */}
            <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-4 space-y-3 font-mono text-xs">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Extracted EXIF Camera & Hardware Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Camera Make</span>
                  <span className="text-slate-200">{parsedData.make || 'N/A'}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Camera Model</span>
                  <span className="text-slate-200">{parsedData.model || 'N/A'}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Lens Model</span>
                  <span className="text-slate-200 truncate block">{parsedData.lensModel || 'N/A'}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">DateTime Original</span>
                  <span className="text-cyan-300">{parsedData.dateTimeOriginal || 'N/A'}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Exposure / Aperture</span>
                  <span className="text-slate-200">{parsedData.exposureTime || 'N/A'} @ {parsedData.fNumber || 'N/A'}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">ISO Speed</span>
                  <span className="text-slate-200">{parsedData.isoSpeed || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* GPS Location Map */}
            {parsedData.gpsLatitude !== undefined && parsedData.gpsLongitude !== undefined ? (
              <div className="border border-slate-800 bg-slate-900 rounded-lg p-2 h-[300px] flex flex-col space-y-2">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-xs font-mono text-amber-400 flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>EXIF Embedded GPS Coordinates</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {parsedData.gpsLatitude.toFixed(5)}, {parsedData.gpsLongitude.toFixed(5)}
                  </span>
                </div>
                <div ref={mapContainerRef} className="w-full flex-1 rounded bg-slate-950 overflow-hidden" />
              </div>
            ) : (
              <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-6 text-center text-xs text-slate-500 font-mono">
                No GPS geolocation tags detected in this media file header.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
