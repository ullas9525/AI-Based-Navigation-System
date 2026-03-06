import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ErrorPage = ({ code = 404, message = "Looks like you navigated off the map." }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white text-center">
      <div className="size-24 rounded-full bg-red-100 dark:bg-red-900/30 flex justify-center items-center text-red-500 mb-6">
        <span className="material-symbols-outlined text-5xl">wrong_location</span>
      </div>
      <h1 className="text-6xl font-black mb-4 tracking-tighter text-slate-800 dark:text-slate-100">{code}</h1>
      <p className="text-xl text-slate-500 dark:text-slate-400 mb-8 max-w-md">{message}</p>

      <button
        onClick={() => navigate(-1)}
        className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-transform"
      >
        Go Back
      </button>
    </div>
  );
};
