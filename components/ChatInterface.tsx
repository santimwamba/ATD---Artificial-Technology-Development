
import React, { useState, useRef, useEffect } from 'react';
import { Message, Attachment } from '../types';
import { geminiService } from '../services/geminiService';
import { GEMINI_MODEL } from '../constants';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingFile, setPendingFile] = useState<Attachment | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVocalizeLatest = async () => {
    if (messages.length === 0 || isSpeaking) return;
    const latestMessage = messages[messages.length - 1];
    setIsSpeaking(true);
    try {
      await geminiService.generateSpeech(latestMessage.content);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !pendingFile) || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachment: pendingFile || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentAttachment = pendingFile;
    
    setInput('');
    setPendingFile(null);
    setIsTyping(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      let fullContent = '';
      const stream = geminiService.streamChat(currentInput, history, currentAttachment || undefined);
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => 
          prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent } : m)
        );
      }
    } catch (error) {
      setIsTyping(false);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setPendingFile({ mimeType: file.type, data: base64String, fileName: file.name });
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
        return (
          <div key={index} className="relative group my-6">
            <div className="absolute -top-3 left-4 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest z-10">Data Payload</div>
            <pre className="p-5 bg-slate-950 rounded-2xl overflow-x-auto font-mono text-[11px] text-blue-100/90 border border-white/5 shadow-inner">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      
      return (
        <div key={index} className="text-sm leading-relaxed mb-6 last:mb-0 space-y-4">
          {part.split('\n').map((line, lIdx) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '---' || trimmedLine === '***') return <hr key={lIdx} className="border-slate-700/50 my-8" />;
            if (line.startsWith('# ')) return <h1 key={lIdx} className="text-3xl font-black text-white pt-6 pb-3 border-b-2 border-blue-500/20 mb-4">{line.substring(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={lIdx} className="text-2xl font-black text-slate-100 pt-5 mb-3">{line.substring(3)}</h2>;
            if (line.startsWith('### ')) return <h3 key={lIdx} className="text-xl font-bold text-slate-200 pt-3">{line.substring(4)}</h3>;
            if (/^\d+\./.test(line)) return <div key={lIdx} className="pl-6 border-l-2 border-blue-500/30 font-medium py-2 my-2 bg-blue-500/5 rounded-r-xl text-slate-100 shadow-sm">{line}</div>;
            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={lIdx} className="ml-6 list-disc text-slate-300 py-1 font-medium">{line.substring(2)}</li>;
            if (trimmedLine === '') return <div key={lIdx} className="h-4"></div>;
            
            if (/^\*\*.*?\*\*:/.test(line)) {
               return (
                  <p key={lIdx} className="text-slate-200">
                    <span className="text-blue-400 font-bold">{line.match(/^\*\*(.*?)\*\*:/)?.[1]}:</span>
                    {line.replace(/^\*\*.*?\*\*:/, '')}
                  </p>
               );
            }

            return <p key={lIdx} className="text-slate-200 leading-relaxed">{line}</p>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full max-w-4xl mx-auto bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-black text-blue-500 text-sm shadow-inner uppercase tracking-tighter">ATD</div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-2">Intelligence Core</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-black flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
               Neural Link Stable
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleVocalizeLatest}
            disabled={messages.length === 0 || isSpeaking}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all border ${
              isSpeaking 
              ? 'bg-blue-600/20 border-blue-500 text-blue-400 animate-pulse' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 disabled:opacity-20 disabled:cursor-not-allowed shadow-lg'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Speak Output</span>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
            <div className="w-20 h-20 mb-8 border border-white/10 rounded-3xl flex items-center justify-center bg-white/5">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
            </div>
            <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Neural Intelligence</h4>
            <p className="text-slate-400 text-sm uppercase tracking-widest font-bold max-w-sm leading-relaxed">
              Global intelligence node ready. Process files, analyze visuals, or initiate complex drafting protocols.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
              <div className={`relative max-w-[95%] md:max-w-[85%] rounded-[2rem] p-8 md:p-10 shadow-2xl transition-all ${
                m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800/90 backdrop-blur-md text-slate-100 rounded-tl-none border border-slate-700 hover:border-blue-500/30'
              }`}>
                {m.attachment && (
                  <div className="mb-10 overflow-hidden rounded-[1.5rem] bg-black/40 border border-white/10 shadow-inner group-hover:border-white/20 transition-all">
                    {m.attachment.mimeType.startsWith('image/') ? (
                      <img 
                        src={`data:${m.attachment.mimeType};base64,${m.attachment.data}`} 
                        alt="Neural Source" 
                        className="max-w-full h-auto object-contain max-h-[600px] mx-auto"
                      />
                    ) : (
                      <div className="p-8 flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                        </div>
                        <div>
                           <span className="text-xs font-black uppercase tracking-widest text-blue-500 block mb-1.5">Network Packet</span>
                           <span className="text-sm font-bold text-white truncate max-w-[300px] block font-mono">{m.attachment.fileName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="content-container prose prose-invert max-w-none">
                  {m.role === 'assistant' ? renderFormattedContent(m.content) : <p className="text-base leading-relaxed font-medium">{m.content}</p>}
                </div>
                <div className="flex items-center justify-between mt-10 border-t border-white/5 pt-5">
                  <div className="flex items-center gap-5">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button 
                      onClick={() => handleCopy(m.content, m.id)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all border ${
                        copiedId === m.id 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {copiedId === m.id ? (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-[9px] font-black uppercase tracking-widest">Packet Copied</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" /></svg>
                          <span className="text-[9px] font-black uppercase tracking-widest">Copy Content</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-slate-800/60 backdrop-blur-md rounded-[1.5rem] px-8 py-5 flex gap-4 items-center border border-slate-700 shadow-xl">
                <div className="flex gap-2">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[11px] text-slate-300 font-black uppercase tracking-[0.2em] animate-pulse">Core Processing...</span>
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-8 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 z-20">
        {pendingFile && (
          <div className="mb-8 animate-fade-in flex items-center justify-center">
             <div className="inline-flex items-center gap-5 bg-slate-800 border-2 border-blue-500/50 rounded-[2rem] p-4 pr-8 shadow-2xl relative group">
                {pendingFile.mimeType.startsWith('image/') ? (
                  <img src={`data:${pendingFile.mimeType};base64,${pendingFile.data}`} className="h-20 w-20 rounded-2xl object-cover border border-white/10" alt="Pending" />
                ) : (
                  <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
                    <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div>
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                      Analysis Pending
                   </p>
                   <p className="text-sm font-bold text-white truncate max-w-[180px] font-mono">{pendingFile.fileName}</p>
                </div>
                <button type="button" onClick={() => setPendingFile(null)} className="absolute -top-4 -right-4 bg-red-600 text-white p-2.5 rounded-full shadow-2xl hover:bg-red-500 transition-all border-4 border-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
          </div>
        )}

        <div className="relative flex items-center gap-4">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.txt,.doc,.docx" />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isTyping || isProcessingFile}
            className="p-5 bg-slate-800 border border-slate-700 rounded-[1.5rem] text-slate-400 hover:text-blue-400 transition-all shadow-xl hover:shadow-blue-900/10 active:scale-95 disabled:opacity-30"
          >
            {isProcessingFile ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder={isListening ? "Neural listening active..." : "Initiate command or upload file..."}
              className={`w-full bg-slate-800 border-2 rounded-[1.5rem] pl-7 pr-28 py-5 focus:outline-none transition-all text-slate-100 text-lg ${isListening ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'border-slate-700 focus:border-blue-600 focus:shadow-2xl shadow-inner'}`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                disabled={isTyping}
                className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button 
                type="submit" 
                disabled={(!input.trim() && !pendingFile) || isTyping}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-2xl shadow-blue-900/40 disabled:opacity-30 transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.4);
          border-radius: 20px;
        }
        .document-render h1, .document-render h2, .document-render h3 {
          letter-spacing: -0.03em;
        }
      `}</style>
    </div>
  );
};
