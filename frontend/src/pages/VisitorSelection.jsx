import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VisitorSelection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = null; // Basic state for future search functionality

  const handleDestinationClick = (destination) => {
    // In a real app, this would pass destination coordinates/ID to the map
    navigate('/visitor/navigate/1');
  };

  const destinations = [
    { name: "Emergency Room", loc: "Level 1, West Wing", icon: "medical_services", color: "red" },
    { name: "Cafeteria", loc: "Level 2, Main Hall", icon: "restaurant", color: "orange" },
    { name: "Restrooms", loc: "All Levels", icon: "wc", color: "blue" },
    { name: "Pharmacy", loc: "Level 1, Lobby", icon: "medication", color: "green" },
    { name: "Parking", loc: "Garage A & B", icon: "local_parking", color: "slate" },
    { name: "Info Desk", loc: "Main Entrance", icon: "info", color: "purple" },
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display antialiased min-h-screen">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="flex h-full grow flex-col">

          {/* Header Section */}
          <div className="flex flex-1 justify-center py-5 px-4 md:px-40">
            <div className="flex flex-col max-w-[960px] flex-1 w-full">

              {/* Top Navigation Bar */}
              <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-4 md:px-10 py-3 mb-8">
                <div className="flex items-center gap-4">
                  <div className="size-8 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">local_hospital</span>
                  </div>
                  <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">North Medical Center</h2>
                </div>
                <div className="hidden sm:flex gap-2">
                  <button onClick={() => navigate('/admin/login')} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 transition-colors">
                    <span className="truncate">Admin Sign In</span>
                  </button>
                  <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                    <span className="truncate">Help</span>
                  </button>
                </div>
                <div className="sm:hidden text-slate-900 dark:text-white cursor-pointer">
                  <span className="material-symbols-outlined">menu</span>
                </div>
              </header>

              {/* Main Content Area */}
              <main className="flex flex-col items-center w-full max-w-2xl mx-auto">

                {/* Hero / Welcome */}
                <div className="w-full text-center pb-8 pt-6 px-4">
                  <h1 className="tracking-tight text-3xl md:text-5xl font-bold leading-tight mb-4">
                    Welcome to <span className="text-primary">North Medical Center</span>
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">Find your way quickly and easily.</p>
                </div>

                {/* Search Bar */}
                <div className="w-full px-4 py-3 mb-8">
                  <label className="flex flex-col h-16 w-full shadow-lg rounded-xl transition-transform hover:scale-[1.01]">
                    <div className="flex w-full flex-1 items-center rounded-xl h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent overflow-hidden">
                      <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center pl-4 pr-2">
                        <span className="material-symbols-outlined text-2xl">search</span>
                      </div>
                      <input
                        className="flex w-full min-w-0 flex-1 resize-none bg-transparent text-slate-900 dark:text-white focus:outline-0 border-none h-full placeholder:text-slate-400 dark:placeholder:text-slate-500 px-2 text-lg font-normal leading-normal"
                        placeholder="Where are you going?"
                        type="text"
                      />
                      <div className="pr-4 hidden sm:block">
                        <button className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors">
                          <span className="material-symbols-outlined">mic</span>
                        </button>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Quick Destinations Section */}
                <div className="w-full px-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em]">Quick Destinations</h2>
                    <button onClick={() => navigate('/visitor/navigate/1')} className="text-primary text-sm font-semibold hover:underline">View Map</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {destinations.map((dest, i) => (
                      <button
                        key={i}
                        onClick={() => handleDestinationClick(dest.name)}
                        className={`group flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 items-center text-center transition-all hover:border-${dest.color}-500 hover:shadow-md hover:-translate-y-1`}
                      >
                        <div className={`p-4 rounded-full bg-${dest.color}-100 dark:bg-${dest.color}-900/30 text-${dest.color}-600 dark:text-${dest.color}-400 group-hover:scale-110 transition-transform duration-300`}>
                          <span className="material-symbols-outlined text-4xl">{dest.icon}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-lg font-bold leading-tight">{dest.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{dest.loc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Locations */}
                <div className="w-full px-4 mt-8">
                  <h2 className="text-[18px] font-bold leading-tight tracking-[-0.015em] mb-3 text-slate-500 dark:text-slate-400 uppercase text-xs">Recently Visited</h2>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleDestinationClick('Dr. Smith')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                      <span className="material-symbols-outlined text-slate-400">history</span>
                      <span className="flex-1 font-medium">Dr. Smith - Cardiology</span>
                      <span className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">Suite 304</span>
                    </button>
                    <button onClick={() => handleDestinationClick('Radiology')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                      <span className="material-symbols-outlined text-slate-400">history</span>
                      <span className="flex-1 font-medium">Radiology Department</span>
                      <span className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">Level B1</span>
                    </button>
                  </div>
                </div>

              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorSelection;
