import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

const mockBuildings = [
  { id: 1, name: "Main Campus Library", zone: "Zone A", floors: 4, scans: 1240, status: "Active" },
  { id: 2, name: "West Wing Hospital", zone: "Main Building", floors: 8, scans: 3500, status: "Active" },
  { id: 3, name: "Engineering Block A", zone: "North Campus", floors: 3, scans: 890, status: "Maintenance" },
  { id: 4, name: "Science Center", zone: "East Wing", floors: 5, scans: 1100, status: "Active" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar
          title="Managed Buildings"
          description="Overview of all active indoor navigation zones"
          actionLabel="Upload New Building"
          actionIcon="add"
          onActionClick={() => navigate('/admin/blueprint')}
        />

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">

            {mockBuildings.map((building) => (
              <div key={building.id} className="group flex flex-col bg-white dark:bg-[#1e252b] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300">
                <div className="relative w-full aspect-video overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: 'url("https://placeholder.pics/svg/300")' }}>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                    <span className="text-xs font-medium text-white flex items-center gap-1">
                      <span className={`block size-1.5 rounded-full ${building.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span> {building.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{building.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{building.zone} • {building.floors} Floors</p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-700 w-full my-1"></div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                      <span className="font-semibold">{building.scans.toLocaleString()}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-normal">scans</span>
                    </div>
                    <button className="text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Placeholder Card */}
            <div
              onClick={() => navigate('/admin/blueprint')}
              className="group flex flex-col items-center justify-center bg-transparent border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl min-h-[300px] hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-3xl">add_business</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Add Building</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure a new map</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
