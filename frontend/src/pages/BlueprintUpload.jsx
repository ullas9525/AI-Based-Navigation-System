import React, { useState, useRef } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import axios from 'axios';

const BlueprintUpload = () => {
  const [file, setFile] = useState(null);
  const [buildingName, setBuildingName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const [mapLink, setMapLink] = useState('');

  const handleUpload = async () => {
    if (!file || !buildingName) {
      setError("Please provide a building name and select a file.");
      return;
    }

    setProcessing(true);
    setError(null);
    setProcessStatus(null);

    // Simulate initial upload delay for UX
    await new Promise(r => setTimeout(r, 800));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('buildingName', buildingName);
    formData.append('mapLink', mapLink);

    try {
      const response = await axios.post('http://localhost:5000/api/blueprints/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProcessStatus(response.data);
      setFile(null);
      setBuildingName('');
    } catch (err) {
      setError(err.response?.data?.error || "Error uploading blueprint. Ensure backend is running.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        <Topbar title="Blueprint Management" showSearch={false} />

        <div className="flex flex-1 justify-center py-5 px-4 md:px-10 lg:px-40">
          <div className="flex flex-col max-w-[960px] flex-1 w-full gap-8">

            <div className="flex flex-col gap-2">
              <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Upload Blueprint</h1>
              <p className="text-slate-500 dark:text-[#9dabb9] text-base font-normal leading-normal max-w-2xl">
                Upload your architectural drawings to generate high-precision indoor navigation maps. Our AI analyzes walls, doors, and connectivity automatically.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {!processing && !processStatus && (
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Enter Building/Zone Name (e.g. Science Center)"
                  className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] focus:ring-2 focus:ring-primary focus:outline-none"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Paste Google Maps Share Link (e.g. https://maps.app.goo.gl/...)"
                  className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] focus:ring-2 focus:ring-primary focus:outline-none"
                  value={mapLink}
                  onChange={(e) => setMapLink(e.target.value)}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center w-full min-h-[320px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#3b4754] bg-slate-50 dark:bg-[#1a222c] hover:bg-slate-100 dark:hover:bg-[#202934] hover:border-primary/50 transition-all duration-300 cursor-pointer"
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png"
                  />

                  <div className="flex flex-col items-center gap-6 p-10 text-center z-10">
                    <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-[#283039] flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                      <span className="material-symbols-outlined text-4xl">{file ? 'check_circle' : 'cloud_upload'}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-slate-900 dark:text-white text-xl font-bold">
                        {file ? file.name : "Select Blueprint Here"}
                      </p>
                      <p className="text-slate-500 dark:text-[#9dabb9] text-sm">Supported formats: JPG, PNG</p>
                    </div>
                    {file && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                        className="mt-2 flex min-w-[120px] cursor-pointer items-center justify-center rounded-xl h-11 px-8 bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/30"
                      >
                        Start Upload & Analysis
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis Progress / Success Section */}
            {(processing || processStatus) && (
              <div className="flex flex-col gap-6 bg-white dark:bg-[#1a222c] rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-[#283039]">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-[#3b4754] pb-4 mb-2">
                  <span className={`material-symbols-outlined text-primary text-2xl ${processing ? 'animate-spin' : ''}`}>
                    {processing ? 'settings_suggest' : 'task_alt'}
                  </span>
                  <h2 className="text-slate-900 dark:text-white text-xl font-bold">
                    {processing ? 'AI Analysis In Progress' : 'Analysis Complete'}
                  </h2>
                  <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${processing ? 'bg-blue-100 text-primary dark:bg-blue-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}`}>
                    {processing ? 'Processing' : 'Done'}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    {processing ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                          <span className="text-slate-700 dark:text-white font-medium text-lg">Analyzing floor connectivity...</span>
                          <span className="text-primary font-bold text-lg">Running Graph Network</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#283039] rounded-full h-3 overflow-hidden">
                          <div className="bg-primary h-full rounded-full relative overflow-hidden w-full">
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -skew-x-12 origin-top-left" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4 flex flex-col gap-4">
                        <p className="text-green-800 dark:text-green-400 font-medium">Successfully parsed {processStatus?.building}.</p>
                        <p className="text-sm text-green-700 dark:text-green-500">Nodes detected: {processStatus?.nodes_detected}</p>

                        <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800/50">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Generated Navigation QR:</p>
                          <p className="text-xs font-mono bg-white dark:bg-black/20 p-2 rounded">{processStatus?.qr_code_url}</p>
                        </div>

                        {processStatus?.nodes && processStatus.nodes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800/50">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Attach 360° Media to Nodes:</p>
                            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
                              {processStatus.nodes.map(node => (
                                <div key={node.id} className="flex flex-col gap-2 p-3 bg-white dark:bg-[#202934] rounded border border-slate-200 dark:border-slate-700">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{node.label} <span className="text-xs text-slate-500">({node.type})</span></span>
                                  </div>
                                  <input 
                                    type="file" 
                                    accept=".jpg,.jpeg,.png,.mp4,.webm"
                                    className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-white hover:file:bg-blue-600"
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      try {
                                        await axios.post(`http://localhost:5000/api/media/node/${processStatus.building_id}/${node.id}`, formData);
                                        alert(`Successfully uploaded media for ${node.label}`);
                                      } catch (err) {
                                        alert(`Failed to upload media: ${err.response?.data?.error || err.message}`);
                                      }
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button onClick={() => { setProcessStatus(null) }} className="mt-2 w-fit px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                          Upload Another
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Visual Feedback (Mini Preview) */}
                  <div className="flex flex-col gap-3">
                    <div className="relative w-full aspect-video lg:aspect-square bg-slate-100 dark:bg-[#1a222c] rounded-xl overflow-hidden border border-slate-200 dark:border-[#3b4754] flex items-center justify-center">
                      {processing && (
                        <>
                          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#3b4754 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 border border-primary/30 rounded-full animate-ping"></div>
                          <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_15px_rgba(19,127,236,0.8)] animate-pulse"></div>
                        </>
                      )}
                      {!processing && processStatus && processStatus.qr_code_url && (
                        <div className="flex flex-col items-center gap-4 p-4 h-full w-full justify-center">
                          <img
                            src={`http://localhost:5000${processStatus.qr_code_url}`}
                            alt="Navigation QR Code"
                            className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-full max-w-[200px] h-auto object-contain"
                          />
                          <a
                            href={`http://localhost:5000${processStatus.qr_code_url}`}
                            download={`Navigation_QR_${processStatus.building.replace(/\s+/g, '_')}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition shadow-md shadow-primary/20"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Download QR
                          </a>
                          {processStatus.qr_destination_url && (
                            <div className="text-center w-full max-w-[200px] mt-1">
                              <a
                                href={processStatus.qr_destination_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-primary hover:underline font-mono break-all whitespace-normal"
                              >
                                {processStatus.qr_destination_url}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintUpload;
