import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/visitor/navigate/1', icon: 'bar_chart', label: 'Maps View (Demo)' },
  { path: '/admin/qr', icon: 'qr_code_2', label: 'QR Management' },
  { path: '/admin/blueprint', icon: 'settings', label: 'Blueprint Upload' },
];

const Sidebar = () => {
  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111418]">
      <div className="flex h-full flex-col justify-between p-4">

        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-center px-2 py-2">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">apartment</span>
            </div>
            <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-normal">IndoorNav Admin</h1>
          </div>

          <nav className="flex flex-col gap-2 mt-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <p className="text-sm font-medium leading-normal">{item.label}</p>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCszJhxbK8PGUKGebwAHBmlQLt40L5GsLQF91voC81FYL6-7LiARSXJbwissBvigV5l54Mi6lxlLjmTZu45quMauXAZAg3BJNGFzjezTLb9X0hDefIeuBsrfefB8xOdvRvTLIvYFXEg6y6yVMXsK0LU1LlFYyOiC2DagqpGObwgX27RPT1JP8RBH8KB5wN3aK274METj6qc83oM2BSt01476V-qi4fAEulTW-PHCXtynqDzIh9oyHPheVrMV4mTA4hfhAVDDBxR8OKV")' }}></div>
            <div className="flex flex-col">
              <p className="text-sm font-medium leading-none text-slate-900 dark:text-white">Admin User</p>
              <p className="text-xs text-slate-500">System Admin</p>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
