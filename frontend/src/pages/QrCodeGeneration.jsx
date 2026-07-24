import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

const QrCodeGeneration = () => {
  const [selectedLocation, setSelectedLocation] = useState('Main Lobby Entrance');
  const [qrColor, setQrColor] = useState('blue');
  const [includeScanMe, setIncludeScanMe] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuDfLgX6Q3BngyD2M37cIhhOi-fAz8HryvAVmwPO1YuYo4SQZzrs8GiQ_c2B_CIKlwG2776Ir4x43Jruct79Qq1O2PIHhVnuHtl4bHPghu8yJ5bHUTIwjmiywG18qQlcunewtVdjb7MfJx27odgmZNCtPmBmP1XM11_UTYK8zI5yzB6AiFOJnRdPfcA8RKrxr-FB2VUa0Y4jN5Pi4z_PdxTzMoQCRGHSNy7ykRbMfbA1HfHTCONH6JEDKcAxw17gNVqyWlUBGkBrirwN'); // Default placeholder
  const [qrDestinationUrl, setQrDestinationUrl] = useState(`${FRONTEND_URL}/visitor/navigate/1?loc=Main%20Lobby%20Entrance`);

  const handleGenerate = async () => {
    setGenerating(true);

    // Simulate generation delay
    await new Promise(r => setTimeout(r, 600));

    try {
      const response = await axios.post(`${API_URL}/api/navigation/qr/generate`, {
        node_id: selectedLocation
      });
      // Assuming backend sends back a base64 Data URL or direct Image URL
      if (response.data.success && response.data.qr_code) {
        setQrCodeUrl(response.data.qr_code_url); // Or use the base64 code if provided
        setQrDestinationUrl(response.data.destination_url);

        // In a real scenario you would set the src of the image to the response data
        alert(`QR Code generated for: ${response.data.destination_url}`);
      }
    } catch (err) {
      console.error("Error generating QR", err);
      // Fallback pseudo-generation for prototype feel
      const fallbackUrl = `${FRONTEND_URL}/visitor/navigate/1?loc=${encodeURIComponent(selectedLocation)}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fallbackUrl)}`);
      setQrDestinationUrl(fallbackUrl);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-text-main font-display overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">

        <Topbar
          title="QR Code Generator"
          description="Create navigation points for facility entryways and hallways."
          actionLabel="New Entry Point"
          actionIcon="add"
          onActionClick={handleGenerate}
        />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-col lg:flex-row gap-8 h-full max-w-7xl mx-auto">

            {/* Left Column: Customization Controls */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">

              {/* Configuration Card */}
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-highlight rounded-xl p-6 flex flex-col gap-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-text-main flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">tune</span>
                  Configuration
                </h2>

                {/* Location Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500 dark:text-text-muted">Target Location</label>
                  <div className="relative">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-surface-highlight text-slate-900 dark:text-text-main rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option>Main Lobby Entrance</option>
                      <option>Emergency Room (ER) - North</option>
                      <option>Cafeteria Hallway B</option>
                      <option>Parking Garage Level 2</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-text-muted">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Color Picker (Visual only for prototype) */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-500 dark:text-text-muted">QR Brand Color</label>
                  <div className="flex gap-3">
                    <button onClick={() => setQrColor('blue')} className={`w-10 h-10 rounded-full bg-blue-500 transition-all ${qrColor === 'blue' ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark ring-blue-500' : ''}`}></button>
                    <button onClick={() => setQrColor('emerald')} className={`w-10 h-10 rounded-full bg-emerald-500 transition-all ${qrColor === 'emerald' ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark ring-emerald-500' : 'hover:ring-2 hover:ring-offset-2 hover:ring-emerald-500'}`}></button>
                    <button onClick={() => setQrColor('violet')} className={`w-10 h-10 rounded-full bg-violet-600 transition-all ${qrColor === 'violet' ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark ring-violet-600' : 'hover:ring-2 hover:ring-offset-2 hover:ring-violet-600'}`}></button>
                    <button onClick={() => setQrColor('slate')} className={`w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-700 transition-all ${qrColor === 'slate' ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark ring-slate-900' : 'hover:ring-2 hover:ring-offset-2 hover:ring-slate-400'}`}></button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-surface-highlight">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-text-main">Include "Scan Me" Frame</span>
                      <span className="text-xs text-slate-500 dark:text-text-muted">Adds call-to-action border</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={includeScanMe} onChange={() => setIncludeScanMe(!includeScanMe)} />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-surface-highlight peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="mt-4 w-full py-3 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">rotate_right</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">qr_code_2</span>
                      Generate QR Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Preview & Actions */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">

              {/* Preview Card */}
              <div className="flex-1 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-highlight rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
                {/* Grid Background Pattern */}
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(#000000 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="text-center space-y-1 mb-2">
                    <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-surface-highlight text-xs font-medium text-slate-600 dark:text-text-muted border border-slate-300 dark:border-white/5">Print Preview: A4 Template</span>
                  </div>

                  {/* The Physical Signage Preview */}
                  <div className={`bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6 max-w-sm w-full transform transition-transform duration-300 ${includeScanMe ? 'border-4 border-primary' : ''}`}>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-3xl text-primary">local_hospital</span>
                      </div>
                      <h2 className="text-slate-900 font-bold text-xl tracking-tight">City General Hospital</h2>
                      <p className="text-slate-500 text-sm font-medium">Indoor Navigation</p>
                    </div>

                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-primary rounded-xl opacity-20 blur"></div>
                      <img
                        alt="QR Code Preview"
                        className="relative w-48 h-48 mix-blend-multiply transition-opacity duration-300"
                        style={{ opacity: generating ? 0.5 : 1 }}
                        src={qrCodeUrl}
                      />
                    </div>

                    <div className="text-center w-full max-w-[240px] overflow-hidden text-ellipsis px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <a href={qrDestinationUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline font-mono break-all whitespace-normal">
                        {qrDestinationUrl}
                      </a>
                    </div>

                    <div className="text-center">
                      <p className="text-slate-900 font-bold text-lg">{selectedLocation.split('(')[0]}</p>
                      <p className="text-slate-500 text-sm mt-1">Scan to find your destination</p>
                    </div>

                    <div className="w-full pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                      <span>ID: #L0C-{(Math.random() * 1000).toFixed(0)}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">public</span> city.nav.ai</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-highlight rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-text-main">Ready to export</span>
                    <span className="text-xs text-slate-500 dark:text-text-muted">Design locked</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-transparent hover:bg-slate-200 dark:hover:bg-surface-highlight border border-slate-200 dark:border-surface-highlight text-slate-700 dark:text-text-main rounded-lg transition-colors text-sm font-medium">
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    Export PDF
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-lg shadow-primary/20 transition-all text-sm font-medium">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download PNG
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrCodeGeneration;
