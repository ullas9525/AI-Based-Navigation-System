import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2 text-primary">
              <span className="material-symbols-outlined text-3xl">explore</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">NaviGuide AI</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium hover:text-primary transition-colors text-slate-600 dark:text-slate-300" href="#">Solutions</a>
            <a className="text-sm font-medium hover:text-primary transition-colors text-slate-600 dark:text-slate-300" href="#">How it Works</a>
            <a className="text-sm font-medium hover:text-primary transition-colors text-slate-600 dark:text-slate-300" href="#">Pricing</a>
            <button onClick={() => navigate('/admin/login')} className="text-sm font-medium hover:text-primary transition-colors text-slate-600 dark:text-slate-300">Contact Sales</button>
          </nav>
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              Get Started
            </button>
            <button className="md:hidden p-2 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="px-6 py-12 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
              <div className="flex flex-col gap-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  Now Live: Campus Edition v2.0
                </div>
                <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                  Navigate Complex <span className="bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">Interiors</span> with AI Precision
                </h1>
                <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  Seamless indoor navigation for hospitals, campuses, and large facilities. Help visitors find their way instantly with our AR-powered guide. No app download required.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button onClick={() => navigate('/visitor/scan')} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-primary/40">
                    <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    Scan QR Demo
                  </button>
                  <button onClick={() => navigate('/admin/login')} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2630] px-6 text-base font-bold text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                    Request Admin Access
                  </button>
                </div>
              </div>
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-slate-200 dark:border-slate-800 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-10 pointer-events-none"></div>
                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDFcPL6o6zot8M5YzDlaJpzq5QkU0-ZHvdLuMUOme4TKfqbn0xckhNItsUpCKadwkwOczoLU2wIuYXBNxski0TotAtBkRv7mGiU_rkgWhjP4cfdCfAVKo-AeLCbWarMjVwg1GMycmL-W0P5q0BRIIUB7HbN29_IEdMvKJRo6cgXgsb2Wd7sfIaNnzlcPbZ2pUKmQ-rhunlVlkzpGen9AAXlJOej3AXgVUSqk39DSUmdyAGcwypXEU-IjlYVcru6q4P-xpnp0tOsojvu')" }}>
                </div>
                {/* Floating AR Card UI Mockup */}
                <div className="absolute bottom-6 left-6 right-6 z-20 rounded-xl bg-background-light/95 dark:bg-[#1c2630]/95 p-4 backdrop-blur shadow-xl border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <span className="material-symbols-outlined">turn_right</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white">Turn Right in 20m</h3>
                      <p className="text-xs text-slate-500">Destination: Radiology Dept, Room 304</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-lg font-bold text-primary">2 min</span>
                      <span className="text-xs text-slate-500">Walking</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-slate-50 dark:bg-[#1c2630]/30 py-20 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  How It Works for Visitors
                </h2>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                  No app download required. We leverage web-based AR to get your visitors where they need to go in three simple steps.
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2630] p-8 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                  <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">1. Scan QR Code</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Visitors scan a QR code placed at entrances or reception desks to launch the web app instantly in their browser.
                </p>
              </div>
              {/* Step 2 */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2630] p-8 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                  <span className="material-symbols-outlined text-3xl">search</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">2. Select Destination</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Users search for a specific room, department, doctor, or amenity within the building complex using the intuitive search bar.
                </p>
              </div>
              {/* Step 3 */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2630] p-8 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                  <span className="material-symbols-outlined text-3xl">directions_walk</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">3. Follow AR Path</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  An augmented reality overlay appears on their camera feed, guiding them step-by-step with clear arrows and distance markers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden py-24 px-6">
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]"></div>
          <div className="relative mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Ready to transform your <br />building experience?
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="h-14 min-w-[200px] rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-8 text-lg font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
