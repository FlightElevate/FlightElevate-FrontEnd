import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiCheck, 
  FiCalendar, 
  FiBarChart2, 
  FiBook, 
  FiNavigation, 
  FiUser, 
  FiShield,
  FiChevronDown,
  FiMenu,
  FiX,
  FiMessageSquare,
  FiEye,
  FiSliders,
  FiCpu,
  FiCompass,
  FiSun,
  FiRefreshCw,
  FiTrendingUp,
  FiArrowRight,
  FiPlay,
  FiTwitter,
  FiFacebook,
  FiGlobe,
  FiAward,
  FiAlertCircle
} from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to a gorgeous Dark Mode
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const menuRef = useRef(null);

  // Redirect authenticated users to dashboard immediately
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Show nothing while checking authentication to prevent flash
  if (authLoading || isAuthenticated) {
    return null;
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    {
      icon: <FiCalendar className="w-6 h-6" />,
      title: "Smart Scheduling",
      description: "Effortlessly manage flight bookings, instructor schedules, and aircraft availability with intelligent clash-detection and calendar sync.",
      tag: null
    },
    {
      icon: <FiBarChart2 className="w-6 h-6" />,
      title: "Operations Analytics",
      description: "Gain complete insight into fleet utilization, training hours, student activity levels, and financial KPIs with real-time reporting.",
      tag: null
    },
    {
      icon: <FiBook className="w-6 h-6" />,
      title: "Integrated Digital Logbook",
      description: "Perfect record-keeping with digital instructor endorsements, dual/solo hour categorization, and instant FAA audit compatibility.",
      tag: null
    },
    {
      icon: <FiNavigation className="w-6 h-6" />,
      title: "Aircraft Management",
      description: "Oversee maintenance, engine overhauls, 100-hour inspections, active squawks, and automatically ground aircraft for maximum flight safety.",
      tag: null
    },
    {
      icon: <FiUser className="w-6 h-6" />,
      title: "Student Progress Tracking",
      description: "Track milestones, logged requirements, stage checks, lesson completions, and syllabus objectives in one unified place.",
      tag: "Coming Soon"
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "Compliance & Reporting",
      description: "Keep your training center fully aligned with Part 61 & Part 141 syllabus requirements and FAA compliance reporting standards.",
      tag: null
    }
  ];

  const comingSoonFeatures = [
    {
      icon: <FiCpu className="text-purple-500 w-5 h-5" />,
      category: "AI & Assistance",
      title: "Pilot AI",
      description: "Intelligent assistant designed by a pilot, for pilots. Delivers automated scheduling recommendations and real-time operational answers."
    },
    {
      icon: <FiCompass className="text-blue-500 w-5 h-5" />,
      category: "Dispatch & Operations",
      title: "Weight & Balance Dispatch",
      description: "Fully integrated dispatch workflows calculating center of gravity (CG) limits alongside digital check-outs."
    },
    {
      icon: <FiSun className="text-yellow-500 w-5 h-5" />,
      category: "Dispatch & Operations",
      title: "Weather on the Go",
      description: "Real-time METAR, TAF, and wind insight natively embedded inside lesson booking and calendar dispatch screens."
    },
    {
      icon: <FiGlobe className="text-green-500 w-5 h-5" />,
      category: "Operational Expansion",
      title: "Part 91 Operations",
      description: "Broadened support catering to corporate flight departments, private flying clubs, and single-owner aircraft structures."
    },
    {
      icon: <FiRefreshCw className="text-indigo-500 w-5 h-5" />,
      category: "System Intelligence",
      title: "SRS (Smart Recovery)",
      description: "Intelligent recovery workflows to handle scheduling disruptions caused by unexpected maintenance grounding or weather changes."
    },
    {
      icon: <FiTrendingUp className="text-pink-500 w-5 h-5" />,
      category: "Data & Insights",
      title: "Advanced & Predictive Analytics",
      description: "Foresee booking bottlenecks, forecast parts replacement times, and project organization revenue months in advance."
    }
  ];

  const faqs = [
    {
      question: "Who is FlightElevate built for?",
      answer: "FlightElevate is designed specifically for Part 61 and Part 141 flight schools, with complete support for personal pilot logbooks, flying clubs, and future expansion into Part 91 and university aviation programs."
    },
    {
      question: "Can FlightElevate replace my current scheduling system?",
      answer: "Yes. FlightElevate is engineered as an all-in-one flight operations suite that seamlessly consolidates scheduling, compliance, internal communication, and logbook entries into one intelligent interface."
    },
    {
      question: "Does it support compliance and reporting?",
      answer: "Absolutely. The platform features built-in compliance frameworks that track flight times, inspect aircraft currencies, and generate exportable reports for regulatory audits."
    },
    {
      question: "Is the platform customizable?",
      answer: "Yes! FlightElevate offers flexible configurations tailored to your organization. You can define custom locations, aircraft categories, and lesson structures that align perfectly with your operations."
    },
    {
      question: "Are mobile apps available?",
      answer: "FlightElevate is fully optimized for mobile web browsers, and our dedicated native mobile apps for iOS and Android are currently in active development."
    }
  ];

  const themeClasses = isDarkMode 
    ? {
        bg: 'bg-[#0B0F19]',
        bgSecondary: 'bg-[#111827]',
        bgCard: 'bg-[#1F2937]/50 backdrop-blur-md border-gray-800/80',
        text: 'text-white',
        textSecondary: 'text-gray-400',
        border: 'border-gray-800',
        gradientText: 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent',
        navBg: 'bg-[#0B0F19]/80'
      }
    : {
        bg: 'bg-slate-50',
        bgSecondary: 'bg-white',
        bgCard: 'bg-white/70 backdrop-blur-md border-slate-200/80 shadow-sm',
        text: 'text-slate-900',
        textSecondary: 'text-slate-600',
        border: 'border-slate-200',
        gradientText: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent',
        navBg: 'bg-slate-50/80'
      };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300 font-sans selection:bg-blue-500 selection:text-white`}>
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-500/20 to-purple-500/10 dark:from-blue-600/10 dark:to-purple-800/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-[250px] left-[10%] w-[300px] h-[300px] bg-indigo-500/10 dark:bg-indigo-600/5 blur-[80px] rounded-full"></div>
      </div>

      {/* Navbar */}
      <header className={`sticky top-0 z-50 ${themeClasses.navBg} border-b ${themeClasses.border} backdrop-blur-md transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
                FE
              </div>
              <span className={`text-xl font-bold tracking-tight ${themeClasses.text}`}>
                Flight<span className="text-blue-600">Elevate</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#philosophy" className={`text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
                Philosophy
              </a>
              <a href="#connected" className={`text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
                Core Pillars
              </a>
              <a href="#features" className={`text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
                Features
              </a>
              <a href="#coming-soon" className={`text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
                Roadmap
              </a>
              <a href="#faq" className={`text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
                FAQ
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl border ${themeClasses.border} hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-all text-lg`}
                aria-label="Toggle Theme"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium transition-all text-blue-600 hover:text-blue-700 bg-transparent"
              >
                Sign In
              </button>
              
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
              >
                Get Started
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2.5 rounded-xl border ${themeClasses.border} hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors`}
              >
                {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div ref={menuRef} className={`md:hidden border-t ${themeClasses.border} ${themeClasses.bgSecondary} px-4 py-6 space-y-4 shadow-xl animate-fade-in`}>
            <div className="flex flex-col space-y-3">
              <a href="#philosophy" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-lg text-base font-medium ${themeClasses.textSecondary} hover:bg-slate-800/30 hover:${themeClasses.text}`}>
                Philosophy
              </a>
              <a href="#connected" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-lg text-base font-medium ${themeClasses.textSecondary} hover:bg-slate-800/30 hover:${themeClasses.text}`}>
                Core Pillars
              </a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-lg text-base font-medium ${themeClasses.textSecondary} hover:bg-slate-800/30 hover:${themeClasses.text}`}>
                Features
              </a>
              <a href="#coming-soon" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-lg text-base font-medium ${themeClasses.textSecondary} hover:bg-slate-800/30 hover:${themeClasses.text}`}>
                Roadmap
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-lg text-base font-medium ${themeClasses.textSecondary} hover:bg-slate-800/30 hover:${themeClasses.text}`}>
                FAQ
              </a>
            </div>
            <div className="pt-4 border-t border-gray-800/30 flex flex-col gap-3">
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="w-full py-3 text-center text-sm font-medium border border-blue-600 text-blue-600 rounded-xl"
              >
                Sign In
              </button>
              <button
                onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                className="w-full py-3 text-center text-sm font-medium bg-blue-600 text-white rounded-xl shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 sm:pt-20 sm:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left */}
            <div className="lg:col-span-7 text-left space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <FiAward className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider">Aviation Operations Evolved</span>
              </div>

              {/* Title */}
              <h2 className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight ${themeClasses.text} leading-[1.1]`}>
                All-in-One Platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">Modern Flight</span> Operations
              </h2>

              {/* Subheading */}
              <p className={`text-lg sm:text-xl font-semibold text-blue-600 dark:text-blue-400 leading-snug`}>
                Built for Part 61 & Part 141 flight schools, with support for personal pilot logbooks, flying clubs, and future expansion into Part 91 and university aviation programs.
              </p>

              {/* Supporting Text */}
              <p className={`text-base sm:text-lg ${themeClasses.textSecondary} leading-relaxed max-w-2xl`}>
                Manage student training, oversee instructors, and streamline aircraft operations—all within a single, intelligent platform.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group"
                >
                  Explore Platform
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  className={`px-8 py-4 text-base font-semibold rounded-xl border ${themeClasses.border} hover:bg-slate-200/25 dark:hover:bg-slate-800/25 transition-all flex items-center gap-2`}
                >
                  <FiPlay className="text-blue-500 fill-blue-500/20" />
                  Watch Overview
                </button>
              </div>

            </div>

            {/* Hero Right - Dashboard Preview Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-[40px] opacity-15 dark:opacity-20 z-0"></div>
              
              {/* Premium Browser Window Frame */}
              <div className={`relative ${themeClasses.bgCard} border rounded-2xl shadow-2xl overflow-hidden z-10 max-w-lg mx-auto`}>
                {/* Browser Title Bar */}
                <div className={`px-4 py-3 flex items-center gap-1.5 border-b ${themeClasses.border} bg-slate-100/50 dark:bg-slate-800/40`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
                  <span className={`text-[11px] font-mono font-medium ml-4 ${themeClasses.textSecondary} opacity-70`}>flightelevate.com/dashboard</span>
                </div>
                
                {/* Mockup Dashboard Content */}
                <div className="p-5 sm:p-6 space-y-5">
                  
                  {/* Summary Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800/10 dark:border-gray-800">
                    <div>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">TODAY'S OPERATIONS</p>
                      <h4 className="text-base font-bold">Main Campus Base</h4>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20 rounded-full">
                      Live Uptime
                    </span>
                  </div>

                  {/* Operational Cards Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/50 border border-gray-200/50 dark:border-gray-800 text-left">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Fleet Utilization</span>
                      <p className="text-xl font-bold mt-0.5">84.2%</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: '84.2%' }}></div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/50 border border-gray-200/50 dark:border-gray-800 text-left">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Logged Hours</span>
                      <p className="text-xl font-bold mt-0.5">142.5 hrs</p>
                      <span className="text-[10px] text-green-500 flex items-center gap-0.5 mt-1 font-semibold">
                        ↑ +12.4% this week
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/50 border border-gray-200/50 dark:border-gray-800 text-left">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Upcoming Flights</span>
                      <p className="text-xl font-bold mt-0.5">18 Lessons</p>
                      <p className="text-[10px] text-gray-500 mt-1">4 multi-engine dispatches</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/50 border border-gray-200/50 dark:border-gray-800 text-left">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Active Instructors</span>
                      <p className="text-xl font-bold mt-0.5">9 On Duty</p>
                      <p className="text-[10px] text-gray-500 mt-1">6 student check-outs</p>
                    </div>

                  </div>

                  {/* Dispatch Warning Banner preview (matches real MVP features) */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left flex items-start gap-2.5">
                    <FiAlertCircle className="text-amber-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Ground Warning Active</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">N172FE requires a 25-hour oil change. Grounding rules block maneuvers.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Core Philosophy */}
      <section className={`py-20 sm:py-32 ${themeClasses.bgSecondary} relative z-10 border-t border-b ${themeClasses.border}`} id="philosophy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Philosophy</p>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight ${themeClasses.text}`}>
            Designed for Efficiency.<br />Built to Elevate the Experience.
          </h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
          <p className={`text-lg sm:text-xl ${themeClasses.textSecondary} leading-relaxed font-normal`}>
            FlightElevate delivers a clean, intuitive experience through a structured, workflow-driven approach to scheduling and operations.
          </p>
          <p className={`text-base sm:text-lg ${themeClasses.textSecondary} leading-relaxed opacity-85`}>
            By simplifying complex processes and removing unnecessary friction, the platform brings consistency to daily workflows—improving efficiency and enabling smoother, more reliable flight operations.
          </p>
        </div>
      </section>

      {/* Pillars Section: Connected Platform, Smart View, Admin Control */}
      <section className="py-24 sm:py-32 relative z-10" id="connected">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Core Pillars</span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${themeClasses.text}`}>
              Seamless System Intelligence
            </h2>
            <p className={themeClasses.textSecondary}>
              We connect students, instructors, aircraft, and staff into one synchronized operational matrix.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className={`p-8 rounded-2xl border ${themeClasses.bgCard} text-left space-y-5 hover:-translate-y-1 transition-all duration-300`}>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FiMessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Connected Platform</h3>
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Seamless Communication</h4>
              <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                Connect students, instructors, and staff through a centralized messaging system—keeping communication streamlined, trackable, and efficient.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className={`p-8 rounded-2xl border ${themeClasses.bgCard} text-left space-y-5 hover:-translate-y-1 transition-all duration-300`}>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FiEye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Smart View</h3>
              <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Role-Based Intelligence</h4>
              <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                Each user sees what matters most. Tailored dashboards for students, instructors, and administrators ensure faster decisions and better situational awareness.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className={`p-8 rounded-2xl border ${themeClasses.bgCard} text-left space-y-5 hover:-translate-y-1 transition-all duration-300`}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FiSliders className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Admin Control</h3>
              <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400">Operational Oversight</h4>
              <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                Gain full visibility across your organization with customizable access controls. Monitor schedules, cancellations, and weather impacts in real time—all from one dashboard.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section className={`py-24 sm:py-32 ${themeClasses.bgSecondary} border-t border-b ${themeClasses.border} relative z-10`} id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Aviation Currencies</span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${themeClasses.text}`}>
              Full Suite Operations & Currencies
            </h2>
            <p className={themeClasses.textSecondary}>
              Eliminate paperwork. FlightElevate maps all Part 61 & 141 workflows seamlessly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((item, index) => (
              <div key={index} className={`p-6 rounded-2xl border ${themeClasses.bgCard} text-left space-y-4 hover:shadow-md transition-all`}>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    {item.icon}
                  </div>
                  {item.tag && (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full animate-pulse">
                      {item.tag}
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-bold">{item.title}</h4>
                <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Statistics / Performance Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center items-center">
            
            <div className="space-y-1">
              <p className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400">60%</p>
              <p className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary}`}>Workload Reduction</p>
              <p className={`text-sm ${themeClasses.textSecondary} opacity-80`}>Reduce administrative scheduling workload</p>
            </div>

            <div className="space-y-1">
              <p className="text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400">99.99%</p>
              <p className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary}`}>Cloud Reliability</p>
              <p className={`text-sm ${themeClasses.textSecondary} opacity-80`}>Engineered on elite cloud infrastructure</p>
            </div>

            <div className="space-y-1">
              <p className="text-4xl sm:text-5xl font-black text-purple-600 dark:text-purple-400">Desktop</p>
              <p className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary}`}>Optimized Browser</p>
              <p className={`text-sm ${themeClasses.textSecondary} opacity-80`}>Beautiful on large screens & notebooks</p>
            </div>

            <div className="space-y-1">
              <p className="text-4xl sm:text-5xl font-black text-pink-600 dark:text-pink-400">Mobile</p>
              <p className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary}`}>Coming Soon</p>
              <p className={`text-sm ${themeClasses.textSecondary} opacity-80`}>Native iOS & Android apps in progress</p>
            </div>

          </div>
        </div>
      </section>

      {/* Coming Soon / Roadmap Section */}
      <section className={`py-24 sm:py-32 ${themeClasses.bgSecondary} border-t border-b ${themeClasses.border} relative z-10`} id="coming-soon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Future Roadmap</span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${themeClasses.text}`}>
              Expanding Capabilities
            </h2>
            <p className={themeClasses.textSecondary}>
              We are constantly pushing limits to transform aviation education and flight logging.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comingSoonFeatures.map((item, index) => (
              <div key={index} className={`p-6 rounded-2xl border ${themeClasses.bgCard} text-left space-y-3 relative overflow-hidden group hover:border-blue-500/30 transition-all`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                    {item.category}
                  </span>
                </div>

                <h4 className="text-base font-bold group-hover:text-blue-500 transition-colors">{item.title}</h4>
                <p className={`text-xs ${themeClasses.textSecondary} leading-relaxed`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 sm:py-32 relative z-10" id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Got Questions?</span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${themeClasses.text}`}>
              Frequently Asked Questions
            </h2>
            <p className={themeClasses.textSecondary}>
              Everything you need to know about FlightElevate.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-2xl border ${themeClasses.bgCard} overflow-hidden transition-all duration-200`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className={`w-full px-6 py-5 flex items-center justify-between text-left ${themeClasses.text} hover:bg-slate-100/10 transition-colors`}
                >
                  <span className="font-bold text-base sm:text-lg">{faq.question}</span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                    <FiChevronDown className="w-5 h-5" />
                  </div>
                </button>
                {openFaq === index && (
                  <div className={`px-6 py-5 border-t ${themeClasses.border} bg-slate-100/10 dark:bg-slate-800/10 animate-fade-in`}>
                    <p className={`text-sm sm:text-base leading-relaxed ${themeClasses.textSecondary}`}>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className={`${themeClasses.bgSecondary} border-t ${themeClasses.border} py-16 relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-gray-800/10 dark:border-gray-800/50">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                FE
              </div>
              <span className={`text-lg font-bold tracking-tight ${themeClasses.text}`}>
                Flight<span className="text-blue-600">Elevate</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold">
              <a href="/user-policy" className={`${themeClasses.textSecondary} hover:text-blue-600 transition-colors`}>
                User Policy
              </a>
              <a href="#philosophy" className={`${themeClasses.textSecondary} hover:text-blue-600 transition-colors`}>
                About
              </a>
              <a href="#faq" className={`${themeClasses.textSecondary} hover:text-blue-600 transition-colors`}>
                Contact
              </a>
            </div>

            {/* Socials */}
            <div className="flex gap-4">
              <a href="#" className={`p-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.textSecondary} hover:text-blue-500 hover:border-blue-500 transition-colors`}>
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className={`p-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.textSecondary} hover:text-blue-500 hover:border-blue-500 transition-colors`}>
                <FiFacebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>© {new Date().getFullYear()} FlightElevate. All rights reserved.</span>
            <span>Made with passion for flight instructors and students.</span>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;