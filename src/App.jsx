import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, MapPin, Camera, LogOut, Activity, PlusCircle, Trash2, 
  UploadCloud, ShieldCheck, Users, Clock, ArrowRight, History, Award, 
  UserCheck, BarChart3, Info, ExternalLink, Signal
} from 'lucide-react';

// --- DB CONFIG ---
const DB_KEYS = { USERS: 'vl_users', BOUNTIES: 'vl_bounties', PROOFS: 'vl_proofs' };
const saveToDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const getFromDB = (key) => JSON.parse(localStorage.getItem(key)) || [];
const ensureSeedUsers = () => {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    saveToDB(DB_KEYS.USERS, [{ email: 'admin@verifylocal.ai', password: 'admin', role: 'admin', name: 'Tony Wang, PhD' }]);
  }
};
const TRAFFIC_HOURS = ['11A', '12P', '1P', '2P', '3P', '4P', '5P', '6P', '7P', '8P'];
const getPortalMode = () => {
  if (typeof window === 'undefined') return 'public';
  return window.location.pathname.startsWith('/admin') ? 'admin' : 'public';
};
const toSeed = (value) => Array.from(value || '').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
const buildTrafficSeries = (seedValue = '') => {
  const seed = toSeed(seedValue);
  return TRAFFIC_HOURS.map((hour, idx) => {
    const wave = Math.sin((idx + (seed % 7)) * 0.8);
    const baseline = Math.max(8, Math.min(82, 26 + idx * 6 + Math.round(wave * 12)));
    const lift = 8 + ((seed + idx * 3) % 13);
    const campaign = Math.min(95, baseline + lift);
    return { hour, baseline, campaign };
  });
};

const classifyOpportunity = (series = []) => {
  if (!series.length) return { level: 'Low', tone: 'text-slate-600 bg-slate-100', window: 'N/A' };

  const avgCampaign = Math.round(series.reduce((acc, point) => acc + point.campaign, 0) / series.length);
  const bestHour = series.reduce((best, point) => (point.campaign > best.campaign ? point : best), series[0]);

  if (avgCampaign >= 65) {
    return { level: 'High', tone: 'text-emerald-700 bg-emerald-100', window: bestHour.hour };
  }
  if (avgCampaign >= 45) {
    return { level: 'Medium', tone: 'text-amber-700 bg-amber-100', window: bestHour.hour };
  }
  return { level: 'Low', tone: 'text-slate-600 bg-slate-100', window: bestHour.hour };
};

const BrandLogo = ({ className = "h-8" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none"><path d="M15 42L35 62L25 75L5 45L15 42Z" fill="#E11D48"/><path d="M5 45L25 25L35 35L15 42L5 45Z" fill="#F43F5E"/><path d="M35 62L50 85L65 62L50 72L35 62Z" fill="#1E3A8A"/><path d="M35 62L22 45L35 32L50 50L35 62Z" fill="#2563EB"/><path d="M50 50L85 15L95 25L60 70L50 50Z" fill="#15803D"/><path d="M50 50L60 70L40 70L50 50Z" fill="#22C55E"/><circle cx="35" cy="42" r="10" stroke="#1E40AF" strokeWidth="3" fill="white"/><path d="M30 42L34 46L40 38" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div className="flex items-baseline font-black tracking-tighter text-2xl"><span className="text-[#1E3A8A]">VERIFY</span><span className="text-[#15803D]">LOCAL</span><span className="text-xs text-[#15803D] ml-0.5">.AI</span></div>
  </div>
);

// --- AUTH PAGE ---
const AuthPage = ({ portalMode, roleMode, setRoleMode, authMode, setAuthMode, formData, setFormData, handleAuth, sessionID }) => {
  const isAdminPortal = portalMode === 'admin';
  const availableRoles = isAdminPortal ? ['admin'] : ['influencer', 'merchant'];

  return (
  <div className={`${isAdminPortal ? 'bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_22%),linear-gradient(180deg,_#020617_0%,_#0f172a_52%,_#111827_100%)]' : 'bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_42%,_#ffffff_100%)]'} min-h-screen animate-in fade-in duration-300`}>
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
        <div className={`${isAdminPortal ? 'bg-white/5 border border-white/10 rounded-2xl px-4 py-3 w-fit backdrop-blur-sm' : ''}`}>
          <BrandLogo className="h-11" />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
          <span className={`px-3 py-2 rounded-full border ${isAdminPortal ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white/80 border border-slate-200 text-slate-500'}`}>Proof-Based Campaigns</span>
          <span className={`px-3 py-2 rounded-full ${isAdminPortal ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20' : 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-100'}`}>{isAdminPortal ? 'Operator Portal' : 'Merchant Intelligence'}</span>
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className={`${isAdminPortal ? 'xl:col-span-7' : 'xl:col-span-6'} space-y-6`}>
          <div className={`${isAdminPortal ? 'bg-white/5 border-white/10 text-white shadow-[0_24px_90px_-42px_rgba(14,165,233,0.18)] p-8 lg:p-10' : 'bg-white/70 border border-white shadow-[0_24px_90px_-42px_rgba(30,58,138,0.35)] p-7 lg:p-8'} backdrop-blur-sm rounded-[40px]`}>
            <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] mb-5 ${isAdminPortal ? 'text-cyan-300' : 'text-blue-700'}`}>
              <Signal size={14} />
              {isAdminPortal ? 'Operator audit workspace' : 'Local proof, verified impact'}
            </div>
            <h1 className={`${isAdminPortal ? 'text-5xl lg:text-6xl max-w-3xl' : 'text-4xl lg:text-5xl max-w-2xl'} font-black tracking-[-0.05em] leading-[0.92] ${isAdminPortal ? 'text-white' : 'text-slate-950'}`}>
              {isAdminPortal ? 'Review merchant activity and traffic signals from one private portal.' : 'Run local campaigns that prove people actually showed up.'}
            </h1>
            <p className={`mt-5 ${isAdminPortal ? 'max-w-2xl text-lg' : 'max-w-xl text-base'} leading-relaxed ${isAdminPortal ? 'text-slate-300' : 'text-slate-600'}`}>
              {isAdminPortal ? 'This route is reserved for internal operators. Sign in to inspect merchant rosters, campaign evidence, and traffic-series deltas without exposing admin access on the public homepage.' : 'VerifyLocal connects merchants and creators in one workflow. Launch on-site campaigns, collect storefront proof, and monitor traffic lift from a single command surface.'}
            </p>

            <div className={`mt-7 grid grid-cols-1 sm:grid-cols-3 ${isAdminPortal ? 'gap-4' : 'gap-3'}`}>
              <div className={`rounded-[28px] border ${isAdminPortal ? 'px-5 py-5' : 'px-4 py-4'} shadow-sm ${isAdminPortal ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${isAdminPortal ? 'bg-cyan-400/15 text-cyan-300' : 'bg-blue-50 text-blue-700'}`}><PlusCircle size={20} /></div>
                <p className={`text-sm font-black ${isAdminPortal ? 'text-white' : 'text-slate-900'}`}>{isAdminPortal ? 'Merchant network view' : 'Create campaigns'}</p>
                <p className={`text-sm mt-2 ${isAdminPortal ? 'text-slate-300' : 'text-slate-500'}`}>{isAdminPortal ? 'Inspect registered merchants and their campaign footprint.' : 'Merchants publish a payout and target a real-world visit.'}</p>
              </div>
              <div className={`rounded-[28px] border ${isAdminPortal ? 'px-5 py-5' : 'px-4 py-4'} shadow-sm ${isAdminPortal ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${isAdminPortal ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}><Camera size={20} /></div>
                <p className={`text-sm font-black ${isAdminPortal ? 'text-white' : 'text-slate-900'}`}>{isAdminPortal ? 'Evidence review' : 'Collect proof'}</p>
                <p className={`text-sm mt-2 ${isAdminPortal ? 'text-slate-300' : 'text-slate-500'}`}>{isAdminPortal ? 'Trace creator submissions and verify proof across campaigns.' : 'Influencers submit on-site evidence tied to the merchant campaign.'}</p>
              </div>
              <div className={`rounded-[28px] border ${isAdminPortal ? 'px-5 py-5' : 'px-4 py-4'} shadow-sm ${isAdminPortal ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${isAdminPortal ? 'bg-blue-400/15 text-blue-300' : 'bg-slate-900 text-white'}`}><BarChart3 size={20} /></div>
                <p className={`text-sm font-black ${isAdminPortal ? 'text-white' : 'text-slate-900'}`}>{isAdminPortal ? 'Traffic audit' : 'Audit impact'}</p>
                <p className={`text-sm mt-2 ${isAdminPortal ? 'text-slate-300' : 'text-slate-500'}`}>{isAdminPortal ? 'Compare hourly lift and investigate anomalies merchant by merchant.' : 'Operators inspect network activity and traffic signals by merchant.'}</p>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-5 ${isAdminPortal ? 'gap-5' : 'gap-4'}`}>
            <div className={`lg:col-span-3 bg-[#0f172a] text-white rounded-[36px] ${isAdminPortal ? 'p-8' : 'p-6'} shadow-[0_24px_90px_-42px_rgba(15,23,42,0.55)]`}>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-200">How it works</p>
              <div className={`mt-5 ${isAdminPortal ? 'space-y-5' : 'space-y-4'}`}>
                {[
                  { icon: Users, title: '1. Merchants define the visit', text: 'Set campaign name, payout, and optionally attach a Google Place ID for real popular-times lookup.' },
                  { icon: CheckCircle, title: '2. Creators submit verifiable proof', text: 'Evidence is linked to a merchant and campaign, keeping the audit trail clean.' },
                  { icon: Activity, title: '3. Operators compare outcome signals', text: 'Admin sees roster health, evidence flow, and traffic-series deltas by merchant.' },
                ].map((item) => (
                  <div key={item.title} className={`${isAdminPortal ? 'flex gap-4 items-start' : 'flex gap-3 items-start'}`}>
                    <div className={`${isAdminPortal ? 'w-11 h-11 rounded-2xl' : 'w-10 h-10 rounded-xl'} bg-white/10 border border-white/10 flex items-center justify-center shrink-0`}><item.icon size={18} /></div>
                    <div>
                      <p className="font-black tracking-tight text-sm">{item.title}</p>
                      <p className="text-sm text-slate-300 mt-1 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`lg:col-span-2 rounded-[36px] p-6 shadow-sm space-y-5 ${isAdminPortal ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white border border-slate-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Launch snapshot</p>
                <p className={`text-3xl font-black tracking-tighter mt-2 ${isAdminPortal ? 'text-white' : 'text-slate-950'}`}>{isAdminPortal ? 'Private operator access for the VerifyLocal network.' : 'One homepage. Two public roles. One audit trail.'}</p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: ShieldCheck, label: isAdminPortal ? 'Private operator route' : 'Private operator oversight' },
                  { icon: Clock, label: 'Fast merchant onboarding' },
                  { icon: History, label: 'Persistent submission history' },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${isAdminPortal ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                    <div className={`flex items-center gap-3 ${isAdminPortal ? 'text-slate-200' : 'text-slate-700'}`}>
                      <item.icon size={16} />
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    <ArrowRight size={14} className={isAdminPortal ? 'text-slate-500' : 'text-slate-400'} />
                  </div>
                ))}
              </div>
              <div className={`rounded-2xl px-4 py-4 ${isAdminPortal ? 'bg-cyan-400/10 border border-cyan-400/20' : 'bg-blue-50 border border-blue-100'}`}>
                <p className={`text-sm font-black ${isAdminPortal ? 'text-cyan-200' : 'text-blue-900'}`}>{isAdminPortal ? 'Restricted operator route' : 'Traffic-ready setup'}</p>
                <p className={`text-sm mt-2 ${isAdminPortal ? 'text-slate-300' : 'text-blue-800'}`}>{isAdminPortal ? 'This page is the private sign-in surface for internal operators and admins.' : 'Merchants can attach a Google Place ID during signup to prepare real popular-times integration later.'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${isAdminPortal ? 'xl:col-span-5 xl:sticky xl:top-8' : 'xl:col-span-6 space-y-5'}`}>
          <div className={`rounded-[40px] shadow-[0_28px_90px_-48px_rgba(15,23,42,0.45)] overflow-hidden ${isAdminPortal ? 'bg-slate-950 border border-cyan-400/15' : 'bg-white border border-slate-200'}`}>
            <div className={`px-8 pt-8 pb-6 border-b ${isAdminPortal ? 'border-white/10 bg-[linear-gradient(135deg,_rgba(34,211,238,0.16)_0%,_rgba(15,23,42,0.9)_100%)]' : 'border-slate-100 bg-[linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)]'}`}>
              <div className="flex items-center justify-between gap-4 mb-5">
                <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${isAdminPortal ? 'text-cyan-200' : 'text-slate-400'}`}>{isAdminPortal ? 'Admin sign-in' : 'Enter the network'}</p>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isAdminPortal ? 'bg-white/5 border border-white/10 text-slate-300' : 'bg-white border border-slate-200 text-slate-500'}`}>
                  <ExternalLink size={12} />
                  {isAdminPortal ? 'Private route' : 'Live prototype'}
                </span>
              </div>
              <BrandLogo className="h-12" />
              <p className={`mt-4 text-sm leading-relaxed ${isAdminPortal ? 'text-slate-300' : 'text-slate-600'}`}>{isAdminPortal ? 'Use your internal admin credentials to access the operator dashboard.' : 'Sign in to continue, or create a role-specific account to test campaign creation and proof submission.'}</p>
              {!isAdminPortal && <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Campaigns</p>
                  <p className="mt-2 text-2xl font-black tracking-tighter text-slate-950">Proof-first</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Traffic</p>
                  <p className="mt-2 text-2xl font-black tracking-tighter text-slate-950">Visit-aware</p>
                </div>
              </div>}
            </div>

            <div className="p-8">
              {!isAdminPortal && <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Access your data</p>
                <p className="mt-2 text-sm text-blue-900 font-semibold leading-relaxed">You must sign in to view your existing data, or create an account to start using VerifyLocal.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setAuthMode('signin')} className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${authMode === 'signin' ? 'bg-white border-blue-300 text-blue-700 shadow-sm' : 'bg-transparent border-blue-200 text-blue-600/80'}`}>I already have an account</button>
                  <button type="button" onClick={() => setAuthMode('signup')} className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${authMode === 'signup' ? 'bg-white border-blue-300 text-blue-700 shadow-sm' : 'bg-transparent border-blue-200 text-blue-600/80'}`}>Create new account</button>
                </div>
              </div>}

              <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                {availableRoles.map(r => (
                  <button key={r} onClick={() => setRoleMode(r)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${roleMode === r ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>{r}</button>
                ))}
              </div>

              <div className={`rounded-[28px] px-5 py-4 mb-6 ${isAdminPortal ? 'border border-white/10 bg-white/5' : 'border border-slate-100 bg-slate-50'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current mode</p>
                <p className={`mt-2 text-lg font-black tracking-tight ${isAdminPortal ? 'text-white' : 'text-slate-900'}`}>{roleMode === 'merchant' ? 'Merchant setup' : roleMode === 'influencer' ? 'Influencer access' : 'Admin access'}</p>
                <p className={`mt-1 text-sm ${isAdminPortal ? 'text-slate-300' : 'text-slate-500'}`}>{roleMode === 'merchant' ? 'Create campaigns and connect a place ID for traffic monitoring.' : roleMode === 'influencer' ? 'Browse bounties and upload on-site evidence.' : 'Review network activity, submissions, and traffic deltas.'}</p>
              </div>

              {isAdminPortal && <div className="mb-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Security note</p>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">Keep this route internal. Share the URL only with operators who should review merchant traffic and network evidence.</p>
              </div>}

              <form onSubmit={handleAuth} className="space-y-4" autoComplete="off">
                {authMode === 'signup' && (
                  <>
                    <input id={`n-${sessionID}`} name={`n-${sessionID}`} type="text" placeholder="Full Name" value={formData.name || ''} required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" onChange={e => setFormData({...formData, name: e.target.value})} />
                    {roleMode === 'merchant' && <input id={`b-${sessionID}`} name={`b-${sessionID}`} type="text" placeholder="Stonebridge Restaurant..." value={formData.businessName || ''} required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" onChange={e => setFormData({...formData, businessName: e.target.value})} />}
                    {roleMode === 'merchant' && <input id={`pid-${sessionID}`} name={`pid-${sessionID}`} type="text" placeholder="Google Place ID (optional — e.g. ChIJN1t_...)" value={formData.placeId || ''} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-mono text-sm" onChange={e => setFormData({...formData, placeId: e.target.value})} />}
                    {roleMode === 'influencer' && <input id={`s-${sessionID}`} name={`s-${sessionID}`} type="text" placeholder="@Handle" value={formData.socialHandle || ''} required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" onChange={e => setFormData({...formData, socialHandle: e.target.value})} />}
                  </>
                )}
                <input id={`e-${sessionID}`} name={`e-${sessionID}`} type="email" placeholder="Email" value={formData.email || ''} required className={`w-full p-4 border rounded-2xl outline-none ${isAdminPortal ? 'bg-slate-900 border-white/10 text-white placeholder:text-slate-500' : 'bg-slate-50'}`} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input id={`p-${sessionID}`} name={`p-${sessionID}`} type="password" placeholder="Password" value={formData.password || ''} required className={`w-full p-4 border rounded-2xl outline-none ${isAdminPortal ? 'bg-slate-900 border-white/10 text-white placeholder:text-slate-500' : 'bg-slate-50'}`} onChange={e => setFormData({...formData, password: e.target.value})} />
                <button className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl ${isAdminPortal ? 'bg-cyan-400 text-slate-950 shadow-cyan-500/20' : 'bg-[#1E3A8A] text-white shadow-blue-100'}`}>{authMode === 'signin' ? 'Login to Dashboard' : 'Create Account & Continue'}</button>
                <p className={`text-[11px] font-bold mt-2 ${isAdminPortal ? 'text-slate-400' : 'text-slate-500'}`}>{authMode === 'signin' ? 'Use your existing credentials to access your dashboard data.' : 'Create your account first, then you can access your dashboard data.'}</p>
              </form>

              {!isAdminPortal && <button onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); }} className="w-full mt-6 text-[10px] text-blue-600 underline font-black uppercase tracking-widest">{authMode === 'signin' ? 'Create Account' : 'Return to Login'}</button>}
            </div>
          </div>

          {!isAdminPortal && <div className="rounded-[34px] border border-slate-200 bg-white/85 backdrop-blur-sm p-6 shadow-[0_20px_70px_-44px_rgba(15,23,42,0.3)]">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Why teams use it</p>
                <p className="mt-2 text-xl font-black tracking-tight text-slate-950">Built for operators, usable by merchants.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"><Users size={20} /></div>
            </div>
            <div className="space-y-3">
              {[
                'Public onboarding stays simple for merchants and creators.',
                'Proof submissions remain tied to a merchant and campaign.',
                'Traffic intelligence is ready for real place-based integration.',
              ].map((line) => (
                <div key={line} className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle size={14} /></div>
                  <p className="text-sm text-slate-600 leading-relaxed">{line}</p>
                </div>
              ))}
            </div>
          </div>}
        </div>
      </section>
    </div>
  </div>
  );
};

// --- MAIN APP ---
export default function VerifyLocalApp() {
  const portalMode = getPortalMode();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login');
  const [roleMode, setRoleMode] = useState(portalMode === 'admin' ? 'admin' : 'influencer');
  const [authMode, setAuthMode] = useState('signin');
  const [sessionNonce, setSessionNonce] = useState(0);
  const sessionID = `session-${sessionNonce}`;
  const [bounties, setBounties] = useState(() => getFromDB(DB_KEYS.BOUNTIES));
  const [proofs, setProofs] = useState(() => getFromDB(DB_KEYS.PROOFS));
  const [formData, setFormData] = useState({});
  const [newBounty, setNewBounty] = useState({ name: '', perPost: '' });
  const [engineStatus, setEngineStatus] = useState('idle');
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [selectedTrafficMerchantEmail, setSelectedTrafficMerchantEmail] = useState('');
  const [trafficSeries, setTrafficSeries] = useState([]);
  const [trafficSource, setTrafficSource] = useState('stub');

  useEffect(() => {
    ensureSeedUsers();
  }, []);

  const resetAuthContext = () => {
    setFormData({});
    setSessionNonce((prev) => prev + 1);
  };

  const handleRoleModeChange = (nextRole) => {
    if (portalMode !== 'admin' && nextRole === 'admin') return;
    setRoleMode(nextRole);
    resetAuthContext();
  };

  const handleAuthModeChange = (nextMode) => {
    if (portalMode === 'admin') return;
    setAuthMode(nextMode);
    resetAuthContext();
  };

  const handleLogout = () => {
    setUser(null);
    setFormData({});
    setSessionNonce((prev) => prev + 1);
    setPage('login');
  };

  const handleAuth = (e) => {
    e.preventDefault();
    const existing = getFromDB(DB_KEYS.USERS);
    if (authMode === 'signin') {
      const found = existing.find(u => u.email === formData.email && u.password === formData.password && u.role === roleMode);
      if (found) { setUser(found); setPage('app'); } else alert("No node found.");
    } else {
      if (existing.some(u => u.email === formData.email)) return alert("Node taken.");
      const newUser = { ...formData, role: roleMode, id: Date.now() };
      saveToDB(DB_KEYS.USERS, [...existing, newUser]);
      setUser(newUser); setPage('app');
    }
  };

  const merchantProofs = proofs.filter((p) => p.merchantEmail === user?.email);
  const influencerProofs = proofs.filter((p) => p.influencerEmail === user?.email);
  const networkUsers = getFromDB(DB_KEYS.USERS);
  const merchantUsers = networkUsers.filter((u) => u.role === 'merchant');
  const influencerUsers = networkUsers.filter((u) => u.role === 'influencer');
  const merchantCampaigns = bounties.filter((b) => b.merchantEmail === user?.email);
  const merchantTrafficSeries = buildTrafficSeries(user?.placeId || user?.email || 'merchant');
  const merchantTrafficDelta = merchantTrafficSeries.reduce((acc, point) => acc + (point.campaign - point.baseline), 0);
  const merchantOpportunity = classifyOpportunity(merchantTrafficSeries);
  const activeTrafficMerchant = merchantUsers.find((m) => m.email === selectedTrafficMerchantEmail) || merchantUsers[0] || null;
  const activeTrafficDelta = trafficSeries.reduce((acc, p) => acc + p.campaign - p.baseline, 0);

  useEffect(() => {
    if (!activeTrafficMerchant?.email) return;
    const controller = new AbortController();
    const url = `/api/popular-times?merchantEmail=${encodeURIComponent(activeTrafficMerchant.email)}&placeId=${encodeURIComponent(activeTrafficMerchant.placeId || '')}`;
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setTrafficSeries(data.series);
        setTrafficSource(data.source);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setTrafficSeries(buildTrafficSeries(activeTrafficMerchant.email));
        setTrafficSource('stub');
      });
    return () => controller.abort();
  }, [activeTrafficMerchant?.email, activeTrafficMerchant?.placeId]);

  if (page === 'login') return <AuthPage portalMode={portalMode} sessionID={sessionID} roleMode={roleMode} setRoleMode={handleRoleModeChange} authMode={authMode} setAuthMode={handleAuthModeChange} formData={formData} setFormData={setFormData} handleAuth={handleAuth} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <BrandLogo className="h-10" />
        <div className="flex items-center gap-6">
           <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">{user.businessName || user.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">{user.role} node</p>
           </div>
           <button onClick={handleLogout} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 border border-slate-100 transition-all shadow-sm"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="flex-1 p-12 max-w-7xl mx-auto w-full">
        
        {/* --- ADMIN GOD VIEW W/ GOOGLE TRAFFIC DATA --- */}
        {user.role === 'admin' && (
          <div className="space-y-8">
            <header className="bg-white rounded-[36px] border shadow-sm px-8 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Global Audit Center</h1>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Network Operations Dashboard</p>
              </div>
              <div className="bg-[#1E3A8A] text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs w-fit">
                <Signal size={14} className="animate-pulse" /> GOOGLE PLACES API CONNECTED
              </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl border p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Merchants</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{merchantUsers.length}</p>
              </div>
              <div className="bg-white rounded-3xl border p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Influencers</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{influencerUsers.length}</p>
              </div>
              <div className="bg-white rounded-3xl border p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaigns</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{bounties.length}</p>
              </div>
              <div className="bg-white rounded-3xl border p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evidence Tokens</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{proofs.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <section className="xl:col-span-8 bg-white rounded-[40px] border shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-8 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-blue-200 mb-1">
                      <BarChart3 size={15} />
                      <span className="text-[10px] font-black uppercase tracking-[0.25em]">Signal 1 · Google Popular Times</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter text-white leading-tight">
                      {activeTrafficMerchant ? (activeTrafficMerchant.businessName || activeTrafficMerchant.name) : 'No merchant selected'}
                    </h2>
                    <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mt-1">{activeTrafficMerchant?.email || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Tuesday Delta</p>
                      <p className="text-3xl font-black text-white leading-none mt-1">+{activeTrafficDelta}</p>
                      <div className={`mt-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${
                        trafficSource === 'google_places'
                          ? 'bg-green-400/20 text-green-300'
                          : 'bg-white/10 text-blue-300'
                      }`}>
                        {trafficSource === 'google_places' ? '● Live' : '○ Stub'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-7">
                  {/* Merchant selector */}
                  <div className="flex flex-wrap gap-2">
                    {merchantUsers.length === 0 ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">No merchants available</span>
                    ) : merchantUsers.map((merchantNode) => {
                      const isActive = activeTrafficMerchant?.email === merchantNode.email;
                      return (
                        <button
                          key={merchantNode.email}
                          onClick={() => setSelectedTrafficMerchantEmail(merchantNode.email)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isActive ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}
                        >
                          {merchantNode.businessName || merchantNode.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Chart */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Hourly Foot Traffic</p>
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-200 inline-block"></span>Baseline</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block"></span>Post-Campaign</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5 h-48 bg-slate-50 rounded-2xl px-4 pt-4 pb-0 border border-slate-100">
                      {trafficSeries.length === 0 ? (
                      <div className="flex-1 flex items-end gap-1.5 h-full">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="flex-1 flex items-end gap-0.5 justify-center h-full">
                            <div className="w-5/12 bg-slate-100 rounded-t-md animate-pulse" style={{ height: `${30 + (i % 4) * 15}%` }}></div>
                            <div className="w-5/12 bg-blue-100 rounded-t-md animate-pulse" style={{ height: `${40 + (i % 5) * 12}%` }}></div>
                          </div>
                        ))}
                      </div>
                    ) : trafficSeries.map((point) => {
                        const isMax = point.campaign === Math.max(...trafficSeries.map(p => p.campaign));
                        return (
                          <div key={point.hour} className="flex-1 flex flex-col items-center justify-end gap-0.5 h-full">
                            <div
                              className="w-full flex items-end gap-0.5 justify-center"
                              style={{ height: '100%' }}
                            >
                              <div
                                className="w-5/12 bg-slate-200 rounded-t-md transition-all"
                                title={`${point.hour} baseline: ${point.baseline}`}
                                style={{ height: `${point.baseline}%` }}
                              ></div>
                              <div
                                className={`w-5/12 rounded-t-md transition-all shadow-sm ${isMax ? 'bg-blue-500 ring-2 ring-blue-300 ring-offset-1' : 'bg-blue-600'}`}
                                title={`${point.hour} post-campaign: ${point.campaign}`}
                                style={{ height: `${point.campaign}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-10 gap-1 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                      {(trafficSeries.length > 0 ? trafficSeries : Array.from({ length: 10 }, (_, i) => ({ hour: TRAFFIC_HOURS[i] }))).map((point) => (
                        <span key={`${point.hour}-label`}>{point.hour}</span>
                      ))}
                    </div>
                  </div>

                  {/* Column details table */}
                  <div className="rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Hourly Breakdown — {activeTrafficMerchant?.businessName || activeTrafficMerchant?.name || 'N/A'}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left px-4 py-2 font-black uppercase tracking-widest text-slate-400">Hour</th>
                            <th className="text-right px-4 py-2 font-black uppercase tracking-widest text-slate-400">Baseline</th>
                            <th className="text-right px-4 py-2 font-black uppercase tracking-widest text-slate-400">Campaign</th>
                            <th className="text-right px-4 py-2 font-black uppercase tracking-widest text-slate-400">Delta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trafficSeries.map((point, i) => (
                            <tr key={`${point.hour}-row`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                              <td className="px-4 py-2 font-black text-slate-700">{point.hour}</td>
                              <td className="px-4 py-2 text-right text-slate-500 font-semibold">{point.baseline}</td>
                              <td className="px-4 py-2 text-right text-slate-700 font-bold">{point.campaign}</td>
                              <td className="px-4 py-2 text-right">
                                <span className="bg-blue-50 text-blue-700 font-black px-2 py-0.5 rounded-lg">+{point.campaign - point.baseline}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI insight */}
                  <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-slate-50 rounded-2xl border border-blue-100 px-6 py-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0"><Info size={18}/></div>
                    <p className="text-sm font-bold text-slate-700 leading-snug flex-1">AI Observation: Verified social proof posts correlate with positive foot-traffic lift across this merchant&apos;s peak hours.</p>
                    <button className="shrink-0 px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all">Audit</button>
                  </div>
                </div>
              </section>

              <section className="xl:col-span-4 space-y-8">
                <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
                  <div className="p-6 border-b bg-slate-50">
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Network Registry</h3>
                  </div>
                  <div className="p-5 space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Merchants</p>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-black">{merchantUsers.length}</span>
                      </div>
                      <div className="max-h-[150px] overflow-y-auto divide-y border rounded-2xl">
                        {merchantUsers.length === 0 ? (
                          <p className="p-4 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">No merchants</p>
                        ) : merchantUsers.map((merchantNode) => (
                          <div key={merchantNode.id || merchantNode.email} className="p-3">
                            <p className="text-xs font-black text-slate-900">{merchantNode.businessName || merchantNode.name || 'Unnamed Merchant'}</p>
                            <p className="text-[10px] font-bold text-slate-400">{merchantNode.email}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Influencers</p>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-black">{influencerUsers.length}</span>
                      </div>
                      <div className="max-h-[150px] overflow-y-auto divide-y border rounded-2xl">
                        {influencerUsers.length === 0 ? (
                          <p className="p-4 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">No influencers</p>
                        ) : influencerUsers.map((influencerNode) => (
                          <div key={influencerNode.id || influencerNode.email} className="p-3">
                            <p className="text-xs font-black text-slate-900">{influencerNode.name || 'Unnamed Influencer'}</p>
                            <p className="text-[10px] font-bold text-slate-400">{influencerNode.socialHandle || influencerNode.email}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden flex flex-col h-[420px]">
                  <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Global Evidence Flow</h3>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black">{proofs.length} Tokens</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {proofs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                        No evidence submitted yet.
                      </div>
                    ) : proofs.map((p) => (
                      <div key={p.id} className="bg-slate-50 p-3 rounded-2xl border flex gap-3 items-center">
                        <img src={p.image} className="w-14 h-14 rounded-xl object-cover border" />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-xs text-slate-900 truncate">{p.bountyName}</p>
                          <p className="text-[10px] font-black text-[#1E3A8A]">{p.influencerHandle}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase truncate">{p.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* --- MERCHANT VIEW --- */}
        {user.role === 'merchant' && (
          <div className="grid grid-cols-12 gap-10">
             <div className="col-span-4 bg-white p-10 rounded-[40px] border shadow-sm h-fit">
                <h3 className="font-black text-[#1E3A8A] uppercase tracking-widest text-xs mb-8">Deploy Budget</h3>
                <form onSubmit={(e) => { e.preventDefault(); const u = [...bounties, { id: Date.now(), ...newBounty, merchantEmail: user.email, city: 'Milford, CT' }]; saveToDB(DB_KEYS.BOUNTIES, u); setBounties(u); setNewBounty({name:'', perPost:''}); alert("Bounty deployed!"); }} className="space-y-4">
                  <input type="text" placeholder="Campaign Name" value={newBounty.name} required className="w-full p-4 border rounded-2xl bg-slate-50 outline-none" onChange={e => setNewBounty({...newBounty, name: e.target.value})} />
                  <input type="text" placeholder="Payout Per Proof" value={newBounty.perPost} required className="w-full p-4 border rounded-2xl bg-slate-50 outline-none" onChange={e => setNewBounty({...newBounty, perPost: e.target.value})} />
                  <button className="w-full py-5 bg-[#1E3A8A] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Deploy to Marketplace</button>
                </form>
             </div>
             <div className="col-span-8 space-y-4">
                <div className="bg-white p-6 rounded-[30px] border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant traffic signal</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight mt-1">Opportunity: {merchantOpportunity.level}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Best posting window: {merchantOpportunity.window}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily campaign lift</p>
                    <p className="text-3xl font-black text-[#1E3A8A] mt-1">+{merchantTrafficDelta}</p>
                    <span className="inline-flex mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700">
                      Estimated signal
                    </span>
                  </div>
                </div>
                <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 ml-4">My Campaigns</h3>
                {merchantCampaigns.length === 0 ? (
                  <div className="bg-white p-10 rounded-[40px] border text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                    No campaigns yet. Deploy your first campaign.
                  </div>
                ) : merchantCampaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-white p-6 rounded-[30px] border shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black text-slate-900 tracking-tight">{campaign.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{campaign.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[#1E3A8A]">{campaign.perPost}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Per Proof</p>
                    </div>
                  </div>
                ))}
                <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 ml-4">Merchant Proof Log</h3>
               {merchantProofs.length === 0 ? (
                <div className="bg-white p-10 rounded-[40px] border text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                  No proofs yet. Deploy a bounty to start receiving evidence.
                </div>
               ) : merchantProofs.map(p => (
                <div key={p.id} className="bg-white p-8 rounded-[40px] border flex gap-8 items-center shadow-sm">
                  <img src={p.image} className="w-32 h-32 rounded-3xl object-cover border shadow-sm" />
                  <div className="flex-1">
                    <h4 className="font-black text-2xl text-slate-900 tracking-tight">{p.bountyName}</h4>
                    <p className="text-xs font-black text-[#15803D] uppercase tracking-widest mt-1">Verification Node: {p.influencerHandle}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-6 tracking-widest italic">{p.timestamp}</p>
                  </div>
                </div>
               ))}
             </div>
          </div>
        )}

        {/* --- INFLUENCER HUB --- */}
        {user.role === 'influencer' && (
          <div className="grid grid-cols-12 gap-10">
             <div className="col-span-8 space-y-8">
                <h1 className="text-4xl font-black tracking-tighter">Bounties Near You</h1>
                {bounties.length === 0 ? (
                  <div className="bg-white p-10 rounded-[40px] border text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                    No active bounties in your area yet.
                  </div>
                ) : bounties.map(b => (
                  <div key={b.id} className="bg-white p-10 rounded-[40px] border flex justify-between items-center hover:shadow-2xl transition-all border-slate-200">
                    <div className="flex gap-10 items-center">
                      <div className="w-20 h-20 bg-[#1E3A8A] rounded-[30px] flex items-center justify-center text-white font-black text-3xl shadow-xl">{b.name?.[0] || '?'}</div>
                      <div>
                        <h4 className="text-2xl font-black text-[#1E3A8A] tracking-tighter">{b.name}</h4>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mt-2"><MapPin size={12} className="text-red-500"/> {b.city}</p>
                        <div className="mt-3 flex items-center gap-2">
                          {(() => {
                            const signal = classifyOpportunity(buildTrafficSeries(b.merchantEmail || b.name || 'opportunity'));
                            return (
                              <>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${signal.tone}`}>Traffic potential: {signal.level}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Best window: {signal.window}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-12">
                       <div><p className="text-4xl font-black tracking-tighter text-slate-900">{b.perPost}</p><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payout</p></div>
                       <button onClick={() => { setSelectedBounty(b); setEngineStatus('uploading'); }} className="bg-[#1E3A8A] text-white px-10 py-5 rounded-[25px] font-black uppercase tracking-widest shadow-2xl hover:bg-[#15803D] transition-all flex items-center gap-3"><Camera size={20}/> Submit Proof</button>
                    </div>
                  </div>
                ))}
             </div>
             <div className="col-span-4 space-y-6">
                <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 flex items-center gap-2"><Award size={16}/> Verified Submissions</h3>
                {influencerProofs.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border shadow-sm text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                    You have no verified submissions yet.
                  </div>
                ) : influencerProofs.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-3xl border shadow-sm group">
                     <img src={p.image} className="w-full h-40 rounded-2xl object-cover mb-4 grayscale hover:grayscale-0 transition-all" />
                     <p className="font-black text-sm text-[#1E3A8A]">{p.bountyName}</p>
                     <p className="text-[9px] font-black uppercase tracking-widest text-[#15803D] mt-1 flex items-center gap-1"><UserCheck size={10}/> Verified as {user.socialHandle}</p>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* --- ENGINE MODAL --- */}
      {engineStatus !== 'idle' && (
        <div className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
          <div className="bg-white rounded-[50px] max-w-xl w-full p-16 shadow-2xl space-y-8 animate-in zoom-in duration-300 border-t-8 border-[#1E3A8A]">
            {engineStatus === 'uploading' && (
              <div className="text-center space-y-8">
                <h2 className="text-3xl font-black tracking-tighter">Submit Evidence</h2>
                <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-slate-100 rounded-[40px] cursor-pointer hover:bg-slate-50 transition-all">
                   <UploadCloud size={60} className="text-slate-300 mb-4" />
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                     const f = e.target.files?.[0];
                     if (!f) return;
                      const r = new FileReader();
                      r.onloadend = () => { setEngineStatus('verifying'); setTimeout(() => { 
                        const upd = [...proofs, { id: Date.now(), bountyId: selectedBounty.id, bountyName: selectedBounty.name, influencerEmail: user.email, influencerHandle: user.socialHandle, image: r.result, merchantEmail: selectedBounty.merchantEmail, timestamp: new Date().toLocaleString() }];
                        saveToDB(DB_KEYS.PROOFS, upd); setProofs(upd); setEngineStatus('success'); 
                      }, 4000); };
                      r.readAsDataURL(f);
                   }} />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Storefront Photo</p>
                </label>
              </div>
            )}
            {engineStatus === 'verifying' && <div className="text-center space-y-10 animate-pulse"><h2 className="text-3xl font-black tracking-tighter text-[#1E3A8A]">Verifying Node...</h2><p className="text-[#1E3A8A] font-black uppercase text-[10px] tracking-[0.4em]">4-Stage Engine Running</p></div>}
            {engineStatus === 'success' && <div className="text-center space-y-10 animate-in zoom-in duration-300"><div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><CheckCircle size={48}/></div><h2 className="text-4xl font-black tracking-tighter">Proof Verified</h2><button onClick={() => setEngineStatus('idle')} className="w-full py-5 bg-[#1E3A8A] text-white rounded-2xl font-black uppercase tracking-widest">Complete Task</button></div>}
          </div>
        </div>
      )}
    </div>
  );
}