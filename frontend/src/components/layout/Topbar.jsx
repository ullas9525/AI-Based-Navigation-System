import React from 'react';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ title, description, showSearch = true, onActionClick, actionLabel, actionIcon }) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-8 py-6 sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
        {description && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder-slate-400 w-64 shadow-sm transition-all"
              placeholder="Search..."
              type="text"
            />
          </div>
        )}

        {actionLabel && (
          <button
            onClick={onActionClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {actionIcon && <span className="material-symbols-outlined text-[20px]">{actionIcon}</span>}
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
