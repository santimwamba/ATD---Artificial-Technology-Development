
import React, { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { ChatInterface } from './components/ChatInterface';
import { NotificationBanner } from './components/NotificationBanner';
import { ProfilePage } from './components/ProfilePage';
import { UserSession, AuthMode, Message } from './types';
import { NOTIFICATION_EMAILS, PUBLIC_URL } from './constants';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [view, setView] = useState<'chat' | 'profile'>('chat');
  const [notification, setNotification] = useState<{ type: 'login' | 'subscribe' | 'bridge' } | null>(null);
  const [bridgeData, setBridgeData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial Load: Check for stored session & history
    const savedSession = localStorage.getItem('atd_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

    const savedHistory = localStorage.getItem('atd_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error("Failed to load ATD history", e);
      }
    }

    // Check for Neural Bridge link on mount
    const params = new URLSearchParams(window.location.search);
    const bridgePacket = params.get('bridge');
    if (bridgePacket) {
      try {
        const decoded = JSON.parse(atob(bridgePacket));
        setBridgeData(decoded);
        setNotification({ type: 'bridge' as any });
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Invalid bridge packet received", e);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('atd_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('atd_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('atd_session');
    }
  }, [session]);

  const handleAuthSuccess = (email: string, mode: AuthMode) => {
    const newSession = { email, isLoggedIn: true };
    setSession(newSession);
    setNotification({ type: mode === AuthMode.LOGIN ? 'login' : 'subscribe' });
  };

  const handleLogout = () => {
    setSession(null);
    setNotification(null);
    setView('chat');
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('atd_history');
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-blue-500/30">
      {/* ATD Header */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row gap-4 justify-between items-center mb-12 bg-slate-900/20 p-6 rounded-[2.5rem] backdrop-blur-sm border border-white/5">
        <div 
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => setView('chat')}
        >
          <div className="w-14 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl transition-all group-hover:bg-white/10 overflow-hidden relative">
            <img 
              src="logo.png" 
              alt="ATD Logo" 
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-blue-500 font-black text-xs">ATD</span>';
              }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tighter leading-none">
              ATD
            </h1>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em] mt-1 leading-none">Artificial Tech Development</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
           {/* Connection Indicator */}
           <div className="hidden lg:flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Uplink Status</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                 <span className={`text-[11px] font-black tracking-tighter ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
                 </span>
              </div>
           </div>

          {session && (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView(view === 'chat' ? 'profile' : 'chat')}
                className="hidden md:block text-right hover:opacity-80 transition-opacity"
              >
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                  {view === 'chat' ? 'User Profile' : 'Back to Console'}
                </p>
                <p className="text-sm text-slate-300 font-semibold">{session.email}</p>
              </button>
              <button 
                onClick={handleLogout}
                className="px-5 py-2.5 bg-slate-800 hover:bg-red-900/20 text-slate-300 hover:text-red-400 text-xs font-black rounded-xl transition-all border border-slate-700 hover:border-red-500/30"
              >
                OFFLINE
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl flex flex-col items-center flex-1">
        {!isOnline && (
          <div className="w-full max-w-4xl bg-amber-500/10 border border-amber-500/20 text-amber-200 p-3 rounded-2xl mb-6 text-center text-xs font-bold uppercase tracking-widest animate-fade-in">
             Limited Functionality: Administrative logs will sync once connection is restored.
          </div>
        )}

        {notification?.type === 'bridge' && (
          <div className="w-full max-w-4xl bg-blue-500/10 border border-blue-500/20 text-blue-400 p-6 rounded-3xl mb-8 animate-fade-in flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
               </div>
               <div>
                  <h4 className="font-black text-sm uppercase tracking-wider">Neural Bridge Handshake</h4>
                  <p className="text-xs text-blue-300/80 mt-1">Found peer node: {bridgeData?.origin} (Admin: {bridgeData?.identity})</p>
               </div>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg transition-all"
            >
              ACKNOWLEDGE
            </button>
          </div>
        )}

        {!session ? (
          <div className="w-full flex flex-col items-center justify-center py-12">
            <div className="mb-10 text-center space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                Artificial Technology <br/> <span className="text-blue-600">Development</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                Global Ready. Synchronized via Neural Core.
              </p>
            </div>
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        ) : (
          <div className="w-full flex flex-col items-center animate-fade-in">
            {notification && notification.type !== 'bridge' && view === 'chat' && (
              <div className="w-full max-w-4xl">
                <NotificationBanner 
                  type={notification.type as any} 
                  onClose={() => setNotification(null)} 
                />
              </div>
            )}
            
            {view === 'chat' ? (
              <ChatInterface messages={messages} setMessages={setMessages} />
            ) : (
              <ProfilePage 
                email={session.email} 
                messages={messages} 
                onClearHistory={clearHistory}
                onBack={() => setView('chat')}
              />
            )}
          </div>
        )}
      </main>

      <footer className="w-full max-w-6xl mt-12 py-12 border-t border-slate-800/50 text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-4">
          <span>&copy; {new Date().getFullYear()} ATD</span>
          <div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
          <span>Artificial Technology Development</span>
        </div>
        <div className="flex items-center gap-6 text-slate-700">
           <span className="hover:text-blue-500 transition-colors cursor-pointer">Sitemap</span>
           <span className="hover:text-blue-500 transition-colors cursor-pointer">Intel Mirror</span>
           <span className={`px-3 py-1 bg-slate-900 border border-slate-800 rounded ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
              STATUS: {isOnline ? 'ACCESSIBLE' : 'OFFLINE'}
           </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
