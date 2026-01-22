
import React, { useState, useMemo, useEffect } from 'react';
import { AuthMode, ApiError } from '../types';
import { 
  ERROR_WEAK_PASSWORD,
  NOTIFICATION_EMAILS
} from '../constants';

interface AuthFormProps {
  onSuccess: (email: string, mode: AuthMode) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [telemetryStep, setTelemetryStep] = useState(0);

  useEffect(() => {
    const savedEmail = localStorage.getItem('atd_remembered_identity');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      mixed: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  }, [password]);

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (mode === AuthMode.SUBSCRIBE && !isPasswordValid) {
      setError(ERROR_WEAK_PASSWORD);
      setIsLoading(false);
      return;
    }

    // Explicit Telemetry Sync Simulation
    setTimeout(() => {
      setTelemetryStep(1); // Mirrored to first admin
      setTimeout(() => {
        setTelemetryStep(2); // Mirrored to second admin
        setTimeout(() => {
          setIsLoading(false);
          setIsSuccess(true);
          
          localStorage.setItem('atd_remembered_identity', email);

          if (mode !== AuthMode.RESET) {
            setTimeout(() => onSuccess(email, mode), 1200);
          } else {
            setTimeout(() => {
              setIsSuccess(false);
              setMode(AuthMode.LOGIN);
            }, 3000);
          }
        }, 1000);
      }, 1000);
    }, 1200);
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md bg-slate-800 p-10 rounded-3xl border border-emerald-500/50 shadow-2xl flex flex-col items-center justify-center py-16 animate-fade-in text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Uplink Secured</h3>
        <p className="text-slate-400 text-sm mt-4 leading-relaxed">
          Identity verified and mirrored across administrative nodes.<br/>
          <span className="text-[10px] text-emerald-500 font-mono mt-2 block">DELIVERY CONFIRMED TO ADMINISTRATIVE CLUSTER</span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl relative">
      <div className="flex mb-10 bg-slate-900 p-1 rounded-2xl border border-slate-800">
        <button
          onClick={() => { setMode(AuthMode.LOGIN); setError(null); }}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            mode === AuthMode.LOGIN ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => { setMode(AuthMode.SUBSCRIBE); setError(null); }}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            mode === AuthMode.SUBSCRIBE ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
          {mode === AuthMode.LOGIN ? 'Authorize' : mode === AuthMode.SUBSCRIBE ? 'Uplink' : 'Recovery'}
        </h2>
        <p className="text-slate-500 text-[10px] font-bold mt-2 uppercase tracking-widest">ATD Neural Intelligence Portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Network Identity (Email)</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
            placeholder="dev@atd-intel.ai"
          />
        </div>

        {mode !== AuthMode.RESET && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Access Key</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-slate-100 font-mono tracking-widest placeholder:text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
              placeholder="••••••••"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/40 uppercase tracking-widest text-xs"
        >
          {isLoading ? (
            <div className="flex flex-col gap-2 items-center justify-center">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                {telemetryStep === 0 ? 'SYNCHRONIZING...' : 'MIRRORING LOGS...'}
              </span>
              <span className="text-[8px] opacity-80 text-blue-300 font-mono tracking-tighter">
                {telemetryStep === 1 
                  ? `DELIVERING TO ${NOTIFICATION_EMAILS[0]}` 
                  : telemetryStep === 2 
                  ? `DELIVERING TO ${NOTIFICATION_EMAILS[1]}` 
                  : 'ESTABLISHING SECURE HANDSHAKE'}
              </span>
            </div>
          ) : (
            <span>{mode === AuthMode.LOGIN ? 'Authorize Handshake' : 'Initialize Neural Node'}</span>
          )}
        </button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <p className="text-[9px] text-slate-600 text-center font-black uppercase tracking-widest leading-relaxed">
          SECURITY PROTOCOL: All authentication events are archived and delivered to the ATD administrative cluster.
        </p>
      </div>
    </div>
  );
};
