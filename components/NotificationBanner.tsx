
import React from 'react';

interface NotificationBannerProps {
  type: 'login' | 'subscribe';
  onClose: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ type, onClose }) => {
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-5 rounded-3xl mb-8 flex justify-between items-start animate-fade-in shadow-xl shadow-emerald-950/20">
      <div className="flex gap-4">
        <div className="mt-1 w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
           </svg>
        </div>
        <div>
          <h4 className="font-black text-sm uppercase tracking-wider mb-1">
            {type === 'login' ? 'Handshake Verified' : 'Neural Core Initialized'}
          </h4>
          <p className="text-xs text-emerald-300/80 leading-relaxed max-w-md">
            Your session is now active. All transmissions and telemetry logs are securely archived and mirrored to the administrative core for quality and safety compliance.
          </p>
        </div>
      </div>
      <button 
        onClick={onClose}
        className="p-1 text-emerald-400 hover:text-emerald-200 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
