import React, { useState } from 'react';
import { useAuth, DEFAULT_EMAIL } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Input from '../components/ui/Input';

// Reference Icons (Quoted path imports to support Vite special filename parsing)
import puchoLogo from '../assets/brand/logo.png';
import UserIcon from '../assets/icons/Property 2=Users, Property 1=Default.png';
import LockIcon from '../assets/icons/Property 2=Lock, Property 1=Default.png';
import ArrowRightIcon from '../assets/icons/Property 2=Arrow Right, Property 1=Default.png';
import MoonIcon from '../assets/icons/Property 2=Moon, Property 1=Default.png';
import SparklesIcon from '../assets/icons/Property 2=Magic-pen, Property 1=Default.png';
import CircleIcon from '../assets/icons/Property 2=agent.png';

import mascot1 from '../assets/mascot_1.png';
import mascot3 from '../assets/mascot_3.png';
import mascot4 from '../assets/mascot_4.png';
import mascot5 from '../assets/mascot_5.png';

// Floating Mascot Component with Keyframe Animation and Cursor Hover Effects
const Mascot = ({ imageSrc, delay, x, y, size = "w-16 h-16", cursorColor = "text-blue-500", cursorRotation = "0deg" }) => {
  return (
    <div
      className={`absolute ${x} ${y} z-20 animate-float transition-all duration-300 hover:scale-110 hover:rotate-6 cursor-pointer pointer-events-auto`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`${size} rounded-full overflow-hidden shadow-lg relative bg-white/50 backdrop-blur-sm border border-white/40`}>
        <img
          src={imageSrc}
          alt="Client Mascot"
          className="w-full h-full object-cover"
        />
      </div>
      <div
        className={`absolute -bottom-3 -right-3 ${cursorColor} drop-shadow-md`}
        style={{ transform: `rotate(${cursorRotation})` }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.5 3.5L10.5 20.5L13.5 13.5L20.5 10.5L3.5 3.5Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

// Demo sign-in (pre-filled fields + 'Use Demo Credentials') stays on in every build, production included — the
// owner's decision (19 Nov 2026), overriding QA L-03.
const SHOW_DEMO = true;

export default function Login() {
  const { login, storedPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // back to the page that asked for sign-in (ProtectedRoute passes it), else the overview
  const nextPath = location.state?.from && location.state.from !== '/' ? location.state.from : '/overview';
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(SHOW_DEMO ? DEFAULT_EMAIL : '');
  const [password, setPassword] = useState(SHOW_DEMO ? (storedPassword || '') : '');
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      navigate(nextPath, { replace: true });
    } else {
      setError(result.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEmail(DEFAULT_EMAIL);
    setPassword(storedPassword || '');

    const result = await login(DEFAULT_EMAIL, storedPassword || '');

    if (result.success) {
      navigate(nextPath, { replace: true });
    } else {
      setError(result.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div data-theme="light" className="min-h-screen md:h-screen w-full bg-[#FAFAFF] text-[#111834] relative flex items-center justify-center p-4 pt-16 md:pt-4 lg:p-8 overflow-x-hidden md:overflow-hidden font-plex">
      {/* Full Screen Grid Pattern - Base */}
      <div 
        className="absolute inset-0 z-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)'
        }}
      />

      {/* Interactive Grid Spotlight (Purple Radial Glow) */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-50"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`
        }}
      />

      {/* Ambient Blurred Accents */}
      <div className="absolute top-0 left-0 w-[300px] md:w-[500px] lg:w-[800px] h-[300px] md:h-[500px] lg:h-[800px] bg-purple-600/30 rounded-full blur-[80px] lg:blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[300px] md:w-[500px] lg:w-[800px] h-[300px] md:h-[500px] lg:h-[800px] bg-blue-600/30 rounded-full blur-[80px] lg:blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Floating Mascots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
        {/* Top Left */}
        <Mascot
          imageSrc={mascot1}
          x="top-[4%] left-4 md:top-[2%] md:left-[1%]"
          delay={0}
          size="w-12 h-12 md:w-16 md:h-16"
          cursorColor="text-blue-500"
          cursorRotation="-10deg"
        />

        {/* Top Right */}
        <Mascot
          imageSrc={mascot5}
          x="top-[4%] right-4 md:top-[2%] md:right-[1%]"
          delay={1.5}
          size="w-12 h-12 md:w-16 md:h-16"
          cursorColor="text-purple-500"
          cursorRotation="15deg"
        />

        {/* Bottom Left */}
        <Mascot
          imageSrc={mascot3}
          x="bottom-[4%] left-2 md:bottom-[2%] md:left-[2%]"
          delay={0.8}
          size="w-10 h-10 md:w-16 md:h-16"
          cursorColor="text-yellow-500"
          cursorRotation="-5deg"
        />

        {/* Bottom Right */}
        <Mascot
          imageSrc={mascot4}
          x="bottom-[4%] right-2 md:bottom-[2%] md:right-[2%]"
          delay={2.2}
          size="w-10 h-10 md:w-16 md:h-16"
          cursorColor="text-green-500"
          cursorRotation="10deg"
        />
      </div>

      {/* Mobile Logo Header */}
      <div className="absolute top-6 left-0 right-0 flex justify-center md:hidden z-20">
        <img src={puchoLogo} alt="Pucho" className="h-6" />
      </div>

      {/* Main Grid Frame */}
      <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-6 md:gap-12 lg:gap-24 relative z-10 items-center h-full md:h-auto content-center">
        {/* Left Info Panel */}
        <div className="text-center md:text-left space-y-4 md:space-y-8 md:pl-8 lg:pl-16 ">
          <div className="hidden md:flex justify-start mb-8 lg:mb-16">
            <img src={puchoLogo} alt="Pucho" className="h-7 lg:h-9" />
          </div>

          <div className="space-y-2 md:space-y-4 lg:space-y-6">
            <div className="space-y-1 md:space-y-2">
              <div className="font-semibold text-[#111834] text-sm md:text-base lg:text-lg">Website Creator OS</div>
              <div className="text-xs font-semibold text-purple-600 tracking-wider uppercase drop-shadow-sm">BUILT ON PUCHO.AI</div>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-[70px] font-semibold text-[#111834] leading-[1.1] md:leading-[1] lg:leading-[0.95] tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-[#111834] to-[#4338ca]">
              Onboard.<br />
              <span className="text-[#8b5cf6]/80">Optimize.</span><br />
              Deploy.
            </h1>

            <p className="text-[#111834] text-xs md:text-sm lg:text-base leading-relaxed max-w-md mx-auto md:mx-0 opacity-70 hidden md:block">
              Plan search-optimized websites, gather client approval, generate AI build prompts, and audit performance from a single centralized Channel Partner platform.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="hidden md:flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 lg:gap-4 pt-2 md:pt-3 lg:pt-4">
            <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-purple-50 border border-purple-100 rounded-full text-xs font-semibold text-purple-700">
              <img src={SparklesIcon} alt="" className="w-4 h-4" />
              SEO / AEO / GEO Optimization
            </div>
            <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-green-50 border border-green-100 rounded-full text-xs font-semibold text-green-700">
              <img src={CircleIcon} alt="" className="w-3 h-3" />
              Service Connected
            </div>
          </div>
        </div>

        {/* Right Glass Card Login Form */}
        <div className="flex flex-col items-center justify-center md:justify-end w-full">
          <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 lg:p-12 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-sm md:max-w-md border border-white/50 relative overflow-hidden group">
            <div className="space-y-2 mb-6 md:mb-8">
              <h2 className="text-2xl font-semibold text-[#111834]">Welcome Back</h2>
              <p className="text-[#6B7280] text-sm">Enter your credentials to access the Operating System.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Partner Email or Username"
                type="text"
                icon={UserIcon}
                placeholder="partner@websitecreator.os"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Secure Password"
                type="password"
                icon={LockIcon}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && (
                <div role="alert" className="p-3 rounded-xl bg-bad-soft text-bad-text text-[13px] border border-bad-edge font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="relative w-full h-[52px] flex items-center justify-center gap-3 rounded-full transition-all duration-300 ease-in-out font-semibold text-[16px] text-white overflow-hidden group disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: 'linear-gradient(180deg, #5833EF 0%, #3A10CE 100%)',
                  boxShadow: '0px 4.4px 8.8px rgba(58, 16, 206, 0.3)',
                }}
              >
                {/* Gloss Reflection Overlay */}
                <div
                  className="absolute top-[1px] left-[1px] right-[1px] h-[25px] rounded-full pointer-events-none transition-opacity duration-300 group-hover:opacity-0"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 100%)',
                    zIndex: 1,
                  }}
                />

                <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                  {loading ? 'Entering dashboard...' : 'Launch Operating System'}
                  {!loading && <img src={ArrowRightIcon} alt="" className="w-5 h-5 -rotate-45 invert brightness-0" />}
                </span>
              </button>
            </form>

            {/* 1-Click Demo Access Button — development builds only */}
            {SHOW_DEMO && (<div className="mt-5 flex flex-col items-center gap-2">
              <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full h-[48px] flex items-center justify-center gap-2 rounded-full text-sm font-semibold text-[#8b5cf6] bg-purple-50 border border-purple-100 transition-all duration-300 hover:bg-purple-100 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer shadow-soft"
              >
                <img src={SparklesIcon} alt="" className="w-4 h-4" />
                {loading ? 'Entering demo...' : 'Use Demo Credentials'}
              </button>
            </div>)}
          </div>

          {/* Mobile Description Details */}
          <div className="block md:hidden text-center mt-8 space-y-4">
            <p className="text-[#111834] text-xs leading-relaxed max-w-xs mx-auto opacity-70">
              Plan search-optimized websites, gather client approval, generate AI build prompts, and audit performance from a single centralized Channel Partner platform.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full text-xs font-medium text-purple-700">
                <img src={SparklesIcon} alt="" className="w-4 h-4" />
                SEO/AEO/GEO
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full text-xs font-medium text-green-700">
                <img src={CircleIcon} alt="" className="w-3 h-3" />
                System Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
