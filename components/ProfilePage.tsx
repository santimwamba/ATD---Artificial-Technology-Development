
import React, { useState, useMemo } from 'react';
import { Message } from '../types';
import { PUBLIC_URL, NOTIFICATION_EMAILS } from '../constants';

interface ProfilePageProps {
  email: string;
  messages: Message[];
  onClearHistory: () => void;
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ email, messages, onClearHistory, onBack }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const interactionCount = messages.filter(m => m.role === 'user').length;

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages]);

  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20">
            {email.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-black text-white tracking-tight">{email}</h2>
            <p className="text-slate-400 font-bold mt-1">Verified ATD Systems Member</p>
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Interactions</p>
                <p className="text-xl font-bold text-blue-400">{interactionCount}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">ATD Tier</p>
                <p className="text-xl font-bold text-emerald-400">ADMIN-LEVEL</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button onClick={onBack} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-lg">
              Return to Console
            </button>
            <button onClick={onClearHistory} className="px-6 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 font-black rounded-xl transition-all">
              Purge Session Logs
            </button>
          </div>
        </div>
      </div>

      {/* NEW TELEMETRY DELIVERY SECTION */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-xl">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
               </svg>
            </div>
            <div>
               <h3 className="text-xl font-black text-white uppercase tracking-tighter">Transcript Delivery</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Global Telemetry Mirroring Active</p>
            </div>
         </div>
         <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 space-y-4">
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
               All transmissions from this session are securely mirrored to the following administrative nodes for archival and compliance:
            </p>
            <div className="flex flex-col gap-2">
               {NOTIFICATION_EMAILS.map((email, idx) => (
                 <div key={idx} className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-slate-300">{email}</span>
                    <span className="ml-auto text-[8px] font-black uppercase text-slate-600 tracking-[0.2em]">Verified Destination</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
          <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Intelligence Logs
        </h3>

        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
          {sortedMessages.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/20 rounded-[2.5rem] border border-dashed border-slate-700/50">
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">No intelligence packets recorded.</p>
            </div>
          ) : (
            sortedMessages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`p-6 rounded-[1.5rem] border transition-all ${isUser ? 'bg-slate-800/20 border-slate-700/50' : 'bg-blue-600/5 border-blue-500/10'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isUser ? 'text-slate-400' : 'text-blue-400'}`}>
                      {isUser ? 'Transmission' : 'Neural core reconstruction'}
                    </span>
                    <button onClick={() => handleCopyMessage(m.content, m.id)} className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${copiedId === m.id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                      {copiedId === m.id ? 'Packet Copied' : 'Copy Log'}
                    </button>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-300">
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
