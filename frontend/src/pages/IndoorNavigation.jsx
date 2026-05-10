import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const IndoorNavigation = () => {
  const { buildingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Pre-fill start from QR scan (?startNode=entrance) or default
  const startLocParam = searchParams.get('startNode') || searchParams.get('loc') || 'Entrance';

  const [startLoc, setStartLoc]           = useState(startLocParam);
  const [endLoc, setEndLoc]               = useState('');
  const [nodes, setNodes]                 = useState([]);
  const [pathData, setPathData]           = useState(null);
  const [loading, setLoading]             = useState(false);
  const [currentFloor, setCurrentFloor]   = useState('1');
  const [blueprintUrl, setBlueprintUrl]   = useState(null);

  const [checkingLocation, setCheckingLocation] = useState(true);
  const [locationError, setLocationError]       = useState(null);
  const [buildingName, setBuildingName]         = useState('');

  // -------------------------------------------------------------------------
  // Haversine formula — distance between two GPS points in metres
  // -------------------------------------------------------------------------
  const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // -------------------------------------------------------------------------
  // On mount: fetch building info (name, lat/lng, blueprint_url, nodes list)
  // Also run geo-fence check
  // -------------------------------------------------------------------------
  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/blueprints/${buildingId || 1}`);
        const building = res.data;

        setBuildingName(building.name || '');
        setNodes(building.nodes || []);

        // Set blueprint image URL (served from Flask /uploads/<filename>)
        if (building.blueprint_url) {
          setBlueprintUrl(`${BASE_URL}${building.blueprint_url}`);
        }

        // Validate or fallback the start location
        let currentStart = startLoc;
        if (building.nodes && building.nodes.length > 0) {
          const startExists = building.nodes.find(
            n => n.id === currentStart || n.label.toLowerCase() === currentStart.toLowerCase()
          );
          
          if (!startExists) {
            const fallbackStart = building.nodes.find(n => n.type === 'entrance') || building.nodes[0];
            currentStart = fallbackStart.id;
            setStartLoc(currentStart);
          }
        }

        // We no longer auto-select a destination. The user must manually choose from the dropdown.

        // Geo-fence: skip if no coordinates stored
        if (!building.latitude || !building.longitude) {
          setCheckingLocation(false);
          return;
        }

        if (!navigator.geolocation) {
          setLocationError('Geolocation is not supported by your browser');
          setCheckingLocation(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const dist = getDistanceFromLatLonInM(
              position.coords.latitude, position.coords.longitude,
              building.latitude, building.longitude
            );
            if (dist > 2000) {
              setLocationError(
                `You are ${Math.round(dist)} meters away. Please proceed to the ${building.name} entrance to begin navigation.`
              );
            }
            setCheckingLocation(false);
          },
          () => {
            setLocationError('Unable to retrieve your location. Please allow location permissions.');
            setCheckingLocation(false);
          }
        );

      } catch (err) {
        console.error('Failed to load building data', err);
        setCheckingLocation(false);
      }
    };

    verifyAndLoad();
  }, [buildingId]);

  // -------------------------------------------------------------------------
  // Fetch route whenever start or end node changes
  // -------------------------------------------------------------------------
  const fetchRoute = async () => {
    if (!startLoc || !endLoc) return;
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/navigation/route`, {
        building_id: parseInt(buildingId || 1, 10),
        start: startLoc,
        end: endLoc
      });
      setPathData(response.data);
    } catch (err) {
      console.error('Failed to fetch route', err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    if (startLoc && endLoc) {
      fetchRoute();
    }
  }, [startLoc, endLoc]);

  // -------------------------------------------------------------------------
  // Build SVG polyline points string from path coordinate data
  // The SVG uses viewBox="0 0 1000 1000" which matches our coordinate space
  // -------------------------------------------------------------------------
  const buildPolylinePoints = (path) => {
    if (!path || path.length === 0) return '';
    return path.map(p => `${p.x},${p.y}`).join(' ');
  };

  const pathCoords  = pathData?.path || [];
  
  let startPoint = pathCoords[0] || null;
  if (!startPoint && startLoc && nodes.length > 0) {
    const node = nodes.find(n => n.id === startLoc);
    if (node) {
      startPoint = { x: node.x, y: node.y };
    }
  }

  const endPoint = pathCoords[pathCoords.length - 1] || null;

  // -------------------------------------------------------------------------
  // Loading / error screens (preserved original markup exactly)
  // -------------------------------------------------------------------------
  if (checkingLocation) {
    return (
      <div className="flex bg-[#11161d] h-screen w-full items-center justify-center text-white flex-col gap-4">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">my_location</span>
        <h2 className="text-xl font-bold font-display">Verifying Location...</h2>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="flex font-display bg-[#11161d] h-screen w-full items-center justify-center p-6">
        <div className="bg-[#1c2127] border border-red-500/30 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center gap-4">
          <div className="size-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <span className="material-symbols-outlined justify-center text-4xl">location_off</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Too Far Away</h2>
          <p className="text-slate-400">{locationError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition shadow-lg shadow-primary/20">
            Check Again
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main Navigation UI
  // -------------------------------------------------------------------------
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-hidden h-screen flex flex-col">

      {/* ── Top Navigation Bar ── */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18212a] px-6 py-3 z-20 shadow-sm relative shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white cursor-pointer" onClick={() => navigate('/')}>
            <div className="size-8 text-primary">
              <span className="material-symbols-outlined text-3xl">near_me</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">IndoorNav</h2>
          </div>

          {/* Destination selector — now a real dropdown populated from DB nodes */}
          <div className="hidden md:flex flex-col min-w-40 h-10 w-96">
            <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-slate-100 dark:bg-[#283039] focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <div className="text-slate-500 dark:text-[#9dabb9] flex border-none items-center justify-center pl-4 rounded-l-xl">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <select
                id="destination-select"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-[#9dabb9] px-3 text-sm font-normal leading-normal cursor-pointer"
                value={endLoc}
                onChange={(e) => setEndLoc(e.target.value)}
              >
                <option value="">Select destination...</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-6">
            <a className="text-primary dark:text-primary text-sm font-bold leading-normal transition-colors" href="#">Map</a>
            <a className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-medium leading-normal transition-colors" href="#">Directory</a>
            <a className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-medium leading-normal transition-colors" href="#">Amenities</a>
            <a className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-medium leading-normal transition-colors" href="#">Help</a>
          </nav>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden lg:block"></div>
          <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-slate-200 dark:border-slate-700 cursor-pointer" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuACTrN_sbLfOLy5ydb-tR8Bn4PjHDYIEZB3R0eD4J5Ovy45naVmHeYLmQC1k5rl1axp2EofSTmV35T-Qj9YHqtqeEFK0a-eiAOQVKXJ4n3SfVtf6Jj5AndiH2PBJ1bOC5KNfvVGB2WKAqah9AWK91cUIWOQUWCLw6Ir1RuBNXpQG8aEpGKGnSjqD4T0nVfr_2jQAsMJNiAbtIBDcPL-gqEt6plpcD3ouW7DfNT39s5Ov2yKQgs5y2tYrql5gaCo3VTf4rYO8Vuk5t5s")' }}></div>
        </div>
      </header>

      {/* ── Main Map Area ── */}
      <main className="flex-1 relative w-full h-full overflow-hidden bg-slate-100 dark:bg-[#11161d]">

        {/* Blueprint image background — loaded dynamically from DB */}
        <div className="absolute inset-0 w-full h-full bg-slate-200 dark:bg-[#151b23] z-0 overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center opacity-80 dark:opacity-60 transform scale-105"
            style={{
              backgroundImage: blueprintUrl
                ? `url('${blueprintUrl}')`
                : "url('https://placeholder.pics/svg/300')"
            }}
          ></div>

          {/* SVG path overlay — viewBox matches 0-1000 coordinate space */}
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 backdrop-blur-sm">
              <span className="material-symbols-outlined animate-spin text-white text-4xl">refresh</span>
            </div>
          ) : (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
            >
              <defs>
                <filter height="140%" id="glow" width="140%" x="-20%" y="-20%">
                  <feGaussianBlur result="blur" stdDeviation="4"></feGaussianBlur>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                </filter>
              </defs>

              {/* Dynamic path polyline from route API */}
              {pathCoords.length > 1 && (
                <polyline
                  className="animate-[dash_20s_linear_infinite]"
                  points={buildPolylinePoints(pathCoords)}
                  fill="none"
                  filter="url(#glow)"
                  stroke="#137fec"
                  strokeDasharray="12 6"
                  strokeLinecap="round"
                  strokeWidth="6"
                />
              )}

              {/* Intermediate waypoint dots */}
              {pathCoords.slice(1, -1).map((pt, i) => (
                <circle
                  key={`waypoint-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="6"
                  fill="#137fec"
                  opacity="0.6"
                />
              ))}

              {/* Current Location — pulsing dot at path start */}
              {startPoint && (
                <circle cx={startPoint.x} cy={startPoint.y} fill="#137fec" r="12" stroke="white" strokeWidth="3">
                  <animate attributeName="r" dur="2s" repeatCount="indefinite" values="12;16;12"></animate>
                  <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="1;0.7;1"></animate>
                </circle>
              )}

              {/* Destination Pin at path end */}
              {endPoint && (
                <g transform={`translate(${endPoint.x - 12}, ${endPoint.y - 32})`}>
                  <path
                    d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12zm0 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                    fill="#ef4444"
                  ></path>
                </g>
              )}
            </svg>
          )}
        </div>

        {/* Start / End Location Badges */}
        <div className="absolute top-6 left-6 z-20 hidden sm:flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-white dark:bg-[#1c2127] rounded-xl p-3 shadow-lg border border-slate-200 dark:border-slate-800 max-w-xs">
            <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-sm">my_location</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wide">From</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {nodes.find(n => n.id === startLoc)?.label || startLoc}
              </span>
            </div>
          </div>

          <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700 ml-7 border-l border-dashed border-slate-400 dark:border-slate-600"></div>

          <div className="flex items-center gap-3 bg-white dark:bg-[#1c2127] rounded-xl p-3 shadow-lg border border-slate-200 dark:border-slate-800 max-w-xs">
            <div className="size-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 shrink-0">
              <span className="material-symbols-outlined text-sm">location_on</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wide">To</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {nodes.find(n => n.id === endLoc)?.label || endLoc || 'Select destination'}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Controls: Floor Switcher */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          <div className="bg-white dark:bg-[#1c2127] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-1.5 flex flex-col gap-1 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
            {['3', '2', '1', 'L', 'B1'].map(floor => (
              <button
                key={floor}
                onClick={() => setCurrentFloor(floor)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${currentFloor === floor ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-[#283039]'}`}
              >
                {floor}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Controls: Zoom Tools */}
        <div className="absolute right-6 bottom-[180px] lg:bottom-[200px] flex flex-col gap-3 z-20">
          <button className="flex size-12 items-center justify-center rounded-xl bg-white dark:bg-[#1c2127] text-slate-700 dark:text-white shadow-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#283039] transition-all">
            <span className="material-symbols-outlined">my_location</span>
          </button>
          <div className="flex flex-col rounded-xl bg-white dark:bg-[#1c2127] shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button className="flex size-10 items-center justify-center text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-[#283039] transition-all border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button className="flex size-10 items-center justify-center text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-[#283039] transition-all">
              <span className="material-symbols-outlined">remove</span>
            </button>
          </div>
        </div>

        {/* Bottom Panel: Navigation Steps */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl z-30">
          <div className="bg-white dark:bg-[#1c2127] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">

            {/* Main Instruction */}
            <div className="flex-1 p-5 flex items-center gap-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-[#2d3642]">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-3xl">turn_left</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#283039] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Step</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {pathCoords.length > 0 ? `${pathCoords.length} stops` : '—'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {pathData?.error
                    ? 'Route not found'
                    : pathCoords.length > 1
                      ? `Head towards ${pathCoords[1].label}`
                      : endLoc
                        ? 'Calculating route...'
                        : 'Select a destination above'}
                </h3>
                <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                  {pathCoords.length > 2 ? `Next: ${pathCoords[2].label}` : pathCoords.length === 2 ? 'Next: Destination' : ''}
                </p>
              </div>
            </div>

            {/* Secondary Info */}
            <div className="p-4 bg-slate-50 dark:bg-[#222932] md:w-72 flex flex-col justify-center gap-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Distance to destination</span>
                {pathData && pathData.total_cost !== undefined ? (
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {pathData.total_cost.toFixed(0)} m
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-900 dark:text-white">—</span>
                )}
              </div>
              <div className="w-full bg-slate-200 dark:bg-[#2d3642] rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full w-1/3"></div>
              </div>

              <div className="flex gap-2 mt-1">
                <button className="flex-1 h-9 rounded-lg bg-white dark:bg-[#2d3642] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#36404d] transition-colors">
                  Preview
                </button>
                <button className="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                  Start AR
                </button>
              </div>
            </div>

          </div>

          {/* Mobile Drawer Handle */}
          <div className="w-full flex justify-center mt-2 md:hidden">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700/50 backdrop-blur-sm"></div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default IndoorNavigation;
