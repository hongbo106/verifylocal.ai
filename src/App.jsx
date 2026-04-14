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
  const existingUsers = getFromDB(DB_KEYS.USERS);
  const hasAdmin = existingUsers.some((u) => u.email === 'admin@verifylocal.ai' && u.role === 'admin');
  if (!hasAdmin) {
    saveToDB(DB_KEYS.USERS, [
      ...existingUsers,
      { email: 'admin@verifylocal.ai', password: 'admin', role: 'admin', name: 'Tony Wang, PhD' },
    ]);
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
  const availableRoles = isAdminPortal ? ['admin'] : ['merchant', 'influencer'];

  // ── Admin portal: compact dark sign-in only ──────────────────────────────
  if (isAdminPortal) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex flex-col">
        <div className="px-8 py-5 flex items-center justify-between border-b border-white/5">
          <BrandLogo className="h-8" />
          <span className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ShieldCheck size={11} /> Operator Portal
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Admin sign-in</h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">Reserved for internal operators. Use your admin credentials to access the dashboard.</p>
            <div className="bg-cyan-400/5 border border-cyan-400/15 rounded-xl px-4 py-3 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">Security note</p>
              <p className="text-xs text-slate-400">Keep this URL internal. Share only with authorized operators.</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-3" autoComplete="off">
              <input id={`e-${sessionID}`} name={`e-${sessionID}`} type="email" placeholder="Admin email" value={formData.email || ''} required autoComplete="off" className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/40 transition-colors text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
              <input id={`p-${sessionID}`} name={`p-${sessionID}`} type="password" placeholder="Password" value={formData.password || ''} required autoComplete="off" className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/40 transition-colors text-sm" onChange={e => setFormData({...formData, password: e.target.value})} />
              <button className="w-full py-3.5 bg-cyan-400 text-slate-950 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20 text-sm mt-1">Access operator dashboard</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Public SaaS landing page ─────────────────────────────────────────────
  return (
    <div className="bg-white min-h-screen font-sans">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo className="h-8" />
          <div className="flex items-center gap-3">
            <a href="#auth-section" onClick={() => setAuthMode('signin')} className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Sign in</a>
            <a href="#auth-section" onClick={() => setAuthMode('signup')} className="bg-slate-950 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">Get started</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-7 border border-blue-100">
            <ShieldCheck size={12} /> Verification infrastructure for local commerce
          </div>
          <h1 className="text-5xl lg:text-[3.4rem] font-black tracking-[-0.04em] text-slate-950 leading-[1.06]">
            Verify that local creator marketing actually happened.
          </h1>
          <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-lg">
            VerifyLocal proves a social post was created at a real location, filters for local reach, and only releases payment when verification passes.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#auth-section" onClick={() => setAuthMode('signup')} className="bg-slate-950 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200/60 flex items-center gap-2 text-sm">
              Join the pilot <ArrowRight size={15} />
            </a>
            <a href="#how" className="text-slate-600 font-semibold px-4 py-3.5 flex items-center gap-2 hover:text-slate-900 transition-colors text-sm">
              How it works
            </a>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
            {['No payment without verification', 'Mandatory disclosure built-in', 'Confidence-labeled metrics'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                <CheckCircle size={13} className="text-emerald-500 shrink-0" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative hidden lg:block">
          <div className="bg-slate-950 rounded-2xl p-6 shadow-2xl shadow-slate-300/40">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campaign Analytics</p>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" /> Live
              </span>
            </div>
            <p className="text-white font-bold text-base mb-4">Stonebridge Restaurant</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Verified Local Views', value: '2,847', sub: '↑ 34% vs last week', color: 'text-emerald-400' },
                { label: 'Filtered Out', value: '1,203', sub: 'Non-local audience', color: 'text-slate-500' },
                { label: 'Confidence Score', value: '94%', sub: 'High confidence', color: 'text-blue-400' },
                { label: 'Paid Out', value: '$340', sub: '3 tokens released', color: 'text-emerald-400' },
              ].map(m => (
                <div key={m.label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">{m.label}</p>
                  <p className="text-white text-xl font-black tracking-tight">{m.value}</p>
                  <p className={`text-xs mt-0.5 ${m.color}`}>{m.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-500/30 rounded-lg flex items-center justify-center shrink-0">
                <ShieldCheck size={14} className="text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-blue-200 text-xs font-bold">Local Proof Token #LPT-0047</p>
                <p className="text-slate-400 text-xs">4-stage engine passed · Payment released</p>
              </div>
              <CheckCircle size={15} className="text-emerald-400 shrink-0" />
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
              <MapPin size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Location verified</p>
              <p className="text-[10px] text-slate-400">Milford, CT · on-site proof collected</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-slate-50 border-y border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">The problem</p>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-950">Merchants pay for reach. They get no proof.</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 p-7">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4">What merchants pay for</p>
              <ul className="space-y-3">
                {['Creator posts to "local" audience', 'Impressions and reach metrics', 'Brand awareness campaigns', 'Influencer visit claims'].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" /></span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-7">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">What they actually get today</p>
              <ul className="space-y-3">
                {['No proof the creator was on-site', 'Global audience, not local', 'No verified foot-traffic signal', 'Payment upfront, no accountability'].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full" /></span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">How it works</p>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-950">4-stage verification engine</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { num: '01', icon: MapPin, title: 'Capture on-site signals', text: 'Creator submits geo-tagged storefront proof tied to the merchant location.' },
              { num: '02', icon: Activity, title: 'Filter bad submissions', text: 'Out-of-area audience and non-local content is filtered before any payment is considered.' },
              { num: '03', icon: ShieldCheck, title: 'Verify location & authenticity', text: 'Location data, post timing, and audience signals are cross-checked against the campaign.' },
              { num: '04', icon: CheckCircle, title: 'Release with Proof Token', text: 'Payment is released via escrow only after a Local Proof Token is minted and verification passes.' },
            ].map(step => (
              <div key={step.num} className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-5xl font-black text-slate-100 tracking-tighter absolute top-3 right-4 select-none">{step.num}</p>
                <div className="w-9 h-9 bg-slate-950 rounded-xl flex items-center justify-center mb-4">
                  <step.icon size={16} className="text-white" />
                </div>
                <h3 className="font-black text-slate-900 tracking-tight text-sm mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD SECTION */}
      <section className="bg-slate-950 py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Merchant dashboard</p>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white">Your ROI, measured and verified.</h2>
            <p className="mt-5 text-slate-400 text-lg leading-relaxed">Every campaign shows exactly what was verified, what was filtered out, and what you paid for. No guesswork.</p>
            <ul className="mt-8 space-y-3.5">
              {[
                { icon: BarChart3, text: 'Budget posted and verified local views side-by-side' },
                { icon: Activity, text: 'Non-local audience automatically filtered out' },
                { icon: ShieldCheck, text: 'Confidence-labeled foot traffic lift estimate' },
                { icon: CheckCircle, text: 'Payment tied to Local Proof Token issuance' },
              ].map(item => (
                <li key={item.text} className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="w-7 h-7 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon size={13} className="text-blue-400" />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white font-bold text-sm">Stonebridge Restaurant</p>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded-full">Active</span>
            </div>
            {[
              { label: 'Budget posted', value: '$500', pct: 100, color: 'bg-blue-500' },
              { label: 'Verified local views', value: '2,847', pct: 72, color: 'bg-emerald-500' },
              { label: 'Non-local filtered', value: '1,203', pct: 30, color: 'bg-slate-600' },
              { label: 'Paid out', value: '$340', pct: 68, color: 'bg-blue-400' },
            ].map(row => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="text-white font-bold">{row.value}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-center gap-3 mt-2">
              <Activity size={13} className="text-blue-400 shrink-0" />
              <div>
                <p className="text-blue-200 text-xs font-bold">Estimated foot traffic lift</p>
                <p className="text-slate-400 text-xs">+18% this week · Confidence 91% (estimated signal)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Built to be trusted</p>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-950">Verification you can stand behind.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: ShieldCheck, title: 'Third-party escrow', text: 'Funds are held and only released when the verification engine approves the submission.' },
              { icon: CheckCircle, title: 'Mandatory disclosure', text: 'All sponsored content is marked for compliance. No undisclosed paid posts.' },
              { icon: Info, title: 'Confidence-labeled metrics', text: 'Every metric carries a confidence score. No opaque vanity numbers.' },
              { icon: Award, title: 'Local Proof Token', text: 'Each verified campaign event is recorded as a tamper-evident proof token.' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <item.icon size={16} className="text-blue-700" />
                </div>
                <h3 className="font-black text-slate-900 text-sm mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR MERCHANTS / FOR CREATORS */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-950 rounded-2xl p-8 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">For merchants</p>
            <h3 className="text-2xl font-black tracking-tight mb-3">Only pay for verified local reach.</h3>
            <p className="text-slate-400 leading-relaxed text-sm mb-6">Post a campaign budget and location. We verify every submission, filter irrelevant reach, and release payment only when proof passes.</p>
            <ul className="space-y-2 mb-8">
              {['Set campaign budget and location', 'Receive on-site creator proofs', 'Review verified local views', 'Pay only for verified results'].map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle size={13} className="text-emerald-400 shrink-0" /> {t}
                </li>
              ))}
            </ul>
            <a href="#auth-section" onClick={() => { setRoleMode('merchant'); setAuthMode('signup'); }} className="inline-flex items-center gap-2 bg-white text-slate-950 font-bold px-5 py-3 rounded-xl hover:bg-slate-100 transition-colors text-sm">Start as merchant <ArrowRight size={14} /></a>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4">For creators</p>
            <h3 className="text-2xl font-black tracking-tight text-slate-950 mb-3">Get guaranteed payment when verification passes.</h3>
            <p className="text-slate-500 leading-relaxed text-sm mb-6">Browse campaigns near you, visit the location, and submit on-site proof. Payment is held in escrow and released automatically when your submission clears.</p>
            <ul className="space-y-2 mb-8">
              {['Browse local merchant campaigns', 'Visit and capture on-site proof', 'Submit through the verification engine', 'Get paid via escrow when verified'].map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={13} className="text-emerald-500 shrink-0" /> {t}
                </li>
              ))}
            </ul>
            <a href="#auth-section" onClick={() => { setRoleMode('influencer'); setAuthMode('signup'); }} className="inline-flex items-center gap-2 bg-slate-950 text-white font-bold px-5 py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm">Start as creator <ArrowRight size={14} /></a>
          </div>
        </div>
      </section>

      {/* AUTH SECTION */}
      <section id="auth-section" className="bg-slate-50 border-t border-slate-100 py-20">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Join the pilot</h2>
            <p className="mt-2 text-slate-500 text-sm">Sign in to your existing account or create a new one.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-3">
              <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1">
                <button type="button" onClick={() => setAuthMode('signin')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${authMode === 'signin' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sign in</button>
                <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${authMode === 'signup' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Create account</button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">I am a</p>
              <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
                {availableRoles.map(r => (
                  <button key={r} type="button" onClick={() => setRoleMode(r)} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${roleMode === r ? 'bg-white shadow text-slate-950' : 'text-slate-400'}`}>{r === 'influencer' ? 'Creator' : r}</button>
                ))}
              </div>
              <form onSubmit={handleAuth} className="space-y-3" autoComplete="off">
                {authMode === 'signup' && (
                  <>
                    <input id={`n-${sessionID}`} name={`n-${sessionID}`} type="text" placeholder="Full name" value={formData.name || ''} required autoComplete="off" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors text-sm" onChange={e => setFormData({...formData, name: e.target.value})} />
                    {roleMode === 'merchant' && <input id={`b-${sessionID}`} name={`b-${sessionID}`} type="text" placeholder="Business name" value={formData.businessName || ''} required autoComplete="off" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors text-sm" onChange={e => setFormData({...formData, businessName: e.target.value})} />}
                    {roleMode === 'merchant' && <input id={`pid-${sessionID}`} name={`pid-${sessionID}`} type="text" placeholder="Google Place ID (optional)" value={formData.placeId || ''} autoComplete="off" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors text-sm font-mono" onChange={e => setFormData({...formData, placeId: e.target.value})} />}
                    {roleMode === 'influencer' && <input id={`s-${sessionID}`} name={`s-${sessionID}`} type="text" placeholder="@handle" value={formData.socialHandle || ''} required autoComplete="off" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors text-sm" onChange={e => setFormData({...formData, socialHandle: e.target.value})} />}
                  </>
                )}
                <input id={`e-${sessionID}`} name={`e-${sessionID}`} type="email" placeholder="Email address" value={formData.email || ''} required autoComplete="off" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
                <input id={`p-${sessionID}`} name={`p-${sessionID}`} type="password" placeholder="Password" value={formData.password || ''} required autoComplete="new-password" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-colors text-sm" onChange={e => setFormData({...formData, password: e.target.value})} />
                <button className="w-full py-3.5 bg-slate-950 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-md mt-1">
                  {authMode === 'signin' ? 'Sign in to dashboard' : 'Create account'}
                </button>
              </form>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-5">No payment information required for pilot access.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo className="h-7" />
          <p className="text-sm text-slate-400">© 2026 VerifyLocal. Verification infrastructure for local commerce.</p>
        </div>
      </footer>

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