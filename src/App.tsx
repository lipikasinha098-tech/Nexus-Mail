import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Copy, RefreshCw, LogIn, Trash2, Sparkles, Plus, Clock } from 'lucide-react';
import { Starfield } from './components/Starfield';
import { MessageViewer } from './components/MessageViewer';
import { EmailMessage, DetailedMessage } from './types';

export default function App() {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [inbox, setInbox] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<DetailedMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [copied, setCopied] = useState(false);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate');
      if (!res.ok) throw new Error("Failed to generate email");
      const data = await res.json();
      if (data && data.length > 0) {
        const newEmail = data[0];
        setCurrentEmail(newEmail);
        localStorage.setItem('nexus_current_email', newEmail);
        setInbox([]);
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Failed to generate email', err);
      alert('Failed to generate new email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Load saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexus_current_email');
    if (saved && saved.includes('@') && saved.includes('web-library.net')) {
      setCurrentEmail(saved);
    } else {
      // Auto-generate on first visit or if invalid domain
      handleGenerate();
    }
  }, []);

  // Poll inbox every 5 seconds if an email is active
  useEffect(() => {
    if (!currentEmail) return;
    
    fetchInbox();
    const interval = setInterval(fetchInbox, 5000);
    return () => clearInterval(interval);
  }, [currentEmail]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !loginInput.includes('@')) return;
    setCurrentEmail(loginInput);
    localStorage.setItem('nexus_current_email', loginInput);
    setInbox([]);
    setSelectedMessage(null);
    setLoginInput('');
  };

  const handleLogout = () => {
    setCurrentEmail(null);
    localStorage.removeItem('nexus_current_email');
    setInbox([]);
    setSelectedMessage(null);
  };

  const fetchInbox = async () => {
    if (!currentEmail) return;
    const [login, domain] = currentEmail.split('@');
    try {
      const res = await fetch(`/api/inbox?login=${login}&domain=${domain}`);
      if (!res.ok) {
        if (res.status === 500) {
           handleLogout();
           alert("Invalid or expired email address.");
           return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setInbox(data);
      }
    } catch (err) {
      console.error('Failed to fetch inbox', err);
    }
  };

  const openMessage = async (msg: EmailMessage) => {
    if (!currentEmail) return;
    setIsLoading(true);
    const [login, domain] = currentEmail.split('@');
    try {
      const res = await fetch(`/api/message?login=${login}&domain=${domain}&id=${msg.id}`);
      if (!res.ok) throw new Error("Failed to fetch message");
      const data = await res.json();
      setSelectedMessage(data);
    } catch (err) {
      console.error('Failed to fetch message', err);
      alert('Failed to load message.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyEmail = () => {
    if (!currentEmail) return;
    navigator.clipboard.writeText(currentEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden font-sans">
      <Starfield />
      
      {/* Header */}
      <nav className="relative z-10 h-20 border-b border-nexus-800 flex items-center justify-between px-4 sm:px-10 bg-[#09090b]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-nexus-accent rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">NEXUS</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Network Status</span>
            <span className="text-xs font-mono text-nexus-glow">OPERATIONAL // {inbox.length > 0 ? '12.4ms' : '24.8ms'}</span>
          </div>
          {currentEmail ? (
            <button onClick={handleLogout} className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-md hover:bg-slate-200 transition-colors">
              LOG OUT
            </button>
          ) : (
             <button onClick={() => document.getElementById('login-input')?.focus()} className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-md hover:bg-slate-200 transition-colors">
              LOGIN WITH MAIL
            </button>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col p-4 sm:p-10 overflow-hidden">
        {!currentEmail ? (
          // Landing View
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full text-center"
          >
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-nexus-accent blur-[100px] opacity-20 rounded-full" />
              <Mail className="w-24 h-24 text-white relative z-10 mx-auto" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-4 text-white">Cosmic Temp Mail</h2>
            <p className="text-slate-400 mb-10">Instantly generate unlimited, anonymous disposable emails. No passwords, no tracking, just seamless inbox access.</p>
            
            <div className="w-full space-y-6">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-nexus-accent hover:bg-nexus-glow text-black py-4 px-6 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                GENERATE NEW MAIL
              </button>
              
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-slate-500">
                <div className="h-px bg-slate-800 flex-1" />
                <span>OR LOGIN WITH EXISTING</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>
              
              <form onSubmit={handleLogin} className="flex gap-2">
                <input 
                  id="login-input"
                  type="email" 
                  required
                  placeholder="user@web-library.net"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="flex-1 bg-black border border-slate-700 rounded-xl px-4 py-3 text-cyan-400 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button 
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          // Dashboard View
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0">
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-6 overflow-y-auto">
               <div className="p-6 sm:p-8 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm shrink-0">
                  <h1 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Generated Interface</h1>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-cyan-500/20 blur rounded-lg"></div>
                    <input type="text" readOnly value={currentEmail} 
                           className="relative w-full bg-black border border-slate-700 p-4 rounded-lg font-mono text-cyan-400 text-base sm:text-lg outline-none" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={copyEmail} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors">
                      {copied ? 'COPIED!' : 'COPY EMAIL'}
                    </button>
                    <button onClick={handleGenerate} disabled={isGenerating} className="flex-1 bg-cyan-500 text-black hover:bg-cyan-400 py-3 rounded-lg text-xs sm:text-sm font-bold transition-colors">
                      {isGenerating ? 'GENERATING...' : 'REGENERATE'}
                    </button>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase">Session Validity</span>
                      <span className="text-lg font-mono text-white">89D : 23H : 59M</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-cyan-500 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold">90D</span>
                    </div>
                  </div>
               </div>
               
               <div className="flex-1 p-6 sm:p-8 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl flex flex-col shrink-0 min-h-[250px]">
                  <h2 className="text-xs font-bold text-slate-500 uppercase mb-4">Account Stats</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Total Received</span>
                      <span className="text-sm font-mono">{inbox.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Active Sessions</span>
                      <span className="text-sm font-mono text-cyan-400">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Data Cleaned</span>
                      <span className="text-sm font-mono">{(inbox.length * 1.2).toFixed(1)} MB</span>
                    </div>
                  </div>
                  <div className="mt-auto pt-6">
                    <div className="p-4 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
                      <p className="text-[11px] leading-relaxed text-cyan-200/60">
                        Nexus uses advanced encryption to ensure your disposable identities remain private. No passwords required—just mail authentication.
                      </p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="col-span-1 lg:col-span-8 bg-black/40 border border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[400px]">
               <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-100">Instant Inbox</h2>
                  </div>
                  <button onClick={fetchInbox} className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-wider">
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Auto-refreshing every 5s</span>
                    <span className="sm:hidden">Refresh</span>
                  </button>
               </div>
               
               <div className="flex-1 relative overflow-hidden">
                 <AnimatePresence mode="wait">
                   {selectedMessage ? (
                     <motion.div 
                        key="message"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute inset-0 z-20 bg-[#09090b]"
                      >
                        <MessageViewer message={selectedMessage} onBack={() => setSelectedMessage(null)} />
                      </motion.div>
                   ) : (
                     <motion.div 
                        key="inbox"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="h-full overflow-y-auto"
                      >
                        <table className="w-full text-left table-fixed">
                          <thead className="sticky top-0 bg-slate-900/90 backdrop-blur z-10">
                            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                              <th className="px-4 sm:px-6 py-4 font-semibold w-1/3">From</th>
                              <th className="px-4 sm:px-6 py-4 font-semibold w-1/2">Subject</th>
                              <th className="hidden sm:table-cell px-6 py-4 font-semibold w-24">Time</th>
                              <th className="px-4 sm:px-6 py-4 font-semibold text-right w-24">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {inbox.length === 0 ? (
                               <tr>
                                 <td colSpan={4} className="p-0 border-none">
                                    <div className="flex flex-col items-center justify-center h-64 opacity-20 pointer-events-none text-slate-500">
                                      <RefreshCw className="w-12 h-12 mb-4 animate-spin-slow" />
                                      <p className="text-xs">Waiting for more incoming data...</p>
                                    </div>
                                 </td>
                               </tr>
                            ) : (
                              inbox.map((msg) => (
                                <tr key={msg.id} onClick={() => openMessage(msg)} className="hover:bg-white/5 cursor-pointer transition-colors group">
                                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm font-medium text-slate-300 truncate">{msg.from}</td>
                                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm text-slate-400 truncate">{msg.subject || '(No Subject)'}</td>
                                  <td className="hidden sm:table-cell px-6 py-5 text-xs font-mono text-slate-500 whitespace-nowrap">
                                    {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px] font-bold group-hover:bg-cyan-500 group-hover:text-black transition-colors inline-block">VIEW</span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 h-10 border-t border-slate-800 flex items-center justify-between px-4 sm:px-10 text-[10px] text-slate-600 bg-black shrink-0">
        <div>NEXUS ENGINE v4.2.0 &copy; 2026</div>
        <div className="hidden sm:flex gap-6 uppercase tracking-tighter">
          <span className="text-cyan-900">UNLIMITED ALIASES</span>
          <span className="text-cyan-900">NO PASSWORD SYSTEM</span>
          <span className="text-cyan-900">90 DAY RETENTION</span>
        </div>
      </footer>
    </div>
  );
}
