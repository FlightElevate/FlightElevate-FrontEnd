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
  FiAlertCircle,
  FiZap,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiDatabase,
  FiPercent,
  FiDollarSign,
  FiHeart
} from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to gorgeous Dark Mode
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeMockupRole, setActiveMockupRole] = useState('admin'); // 'admin', 'instructor', 'student'
  
  // Interactive Feature Selector Tab
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  
  // Interactive Savings Calculator State
  const [aircraftCount, setAircraftCount] = useState(12);
  const [monthlyFlights, setMonthlyFlights] = useState(250);

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
      icon: <FiCalendar className="w-5 h-5" />,
      title: "Smart Scheduling",
      description: "Effortlessly manage flight bookings, instructor schedules, and aircraft availability with intelligent clash-detection and calendar sync.",
      color: "from-blue-700 to-blue-600",
      details: "Our proprietary scheduling matrix resolves overlapping bookings instantly. Real-time availability blocks keep instructors and aircraft synced across all campus locations. Includes automatic calendar pushes to Google, Outlook, and iCal.",
      tag: "Core Engine"
    },
    {
      icon: <FiBarChart2 className="w-5 h-5" />,
      title: "Operations Analytics",
      description: "Gain complete insight into fleet utilization, training hours, student activity levels, and financial KPIs with real-time reporting.",
      color: "from-blue-600 to-sky-500",
      details: "Visualize flight school performance metrics instantly. Track dual vs solo hours, monitor instructor utilization ratios, and analyze monthly billing cycles with premium interactive graphs built directly into the admin center.",
      tag: "Intelligence"
    },
    {
      icon: <FiBook className="w-5 h-5" />,
      title: "Integrated Digital Logbook",
      description: "Perfect record-keeping with digital instructor endorsements, dual/solo hour categorization, and instant FAA audit compatibility.",
      color: "from-blue-700 to-sky-600",
      details: "Built to comply with FAA Part 61 & 141 logbook regulations. Instructors digitally sign flight hours, and students instantly view their endorsements, flight history, and curriculum benchmarks on any device.",
      tag: "Compliance"
    },
    {
      icon: <FiNavigation className="w-5 h-5" />,
      title: "Aircraft Management",
      description: "Oversee maintenance, engine overhauls, 100-hour inspections, active squawks, and automatically ground aircraft for maximum flight safety.",
      color: "from-blue-800 to-blue-600",
      details: "Link hobbs and tach times directly to inspection triggers. If a pilot reports a grounding squawk during check-in, FlightElevate automatically locks dispatch capabilities for that aircraft until an admin clears the maintenance logs.",
      tag: "MVP Standard"
    },
    {
      icon: <FiUser className="w-5 h-5" />,
      title: "Student Progress Tracking",
      description: "Track milestones, logged requirements, stage checks, lesson completions, and syllabus objectives in one unified place.",
      color: "from-blue-700 to-sky-500",
      details: "Provide students with a visual roadmap of their pilot certificates. Instructors tick off syllabus requirements in real time, automatically unlocking stage exams once prerequisite lessons are completed successfully.",
      tag: "Coming Soon"
    },
    {
      icon: <FiShield className="w-5 h-5" />,
      title: "Compliance & Reporting",
      description: "Keep your training center fully aligned with Part 61 & Part 141 syllabus requirements and FAA compliance reporting standards.",
      color: "from-blue-600 to-blue-800",
      details: "Generate comprehensive reports for regulatory bodies in one click. Maintain detailed audit records for students, instructors, and fleet safety checks, protecting your flight academy from compliance vulnerabilities.",
      tag: "Security Ready"
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
      icon: <FiRefreshCw className="text-blue-500 w-5 h-5" />,
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

  // Calculated savings values based on inputs
  const hoursSaved = Math.round(aircraftCount * 9.5 + (monthlyFlights * 0.45));
  const efficiencyScore = Math.min(98, Math.round(72 + (aircraftCount * 0.8) + (monthlyFlights * 0.05)));
  const paperSaved = Math.round(monthlyFlights * 0.8);

  const themeClasses = isDarkMode 
    ? {
        bg: 'bg-[#030612]',
        bgSecondary: 'bg-[#0b1022]',
        bgCard: 'bg-[#0b1022]/40 backdrop-blur-xl border-[#1e293b]/60 shadow-[0_8px_30px_rgb(0,0,0,0.4)]',
        bgCardHover: 'hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(29,78,216,0.15)]',
        text: 'text-gray-100',
        textSecondary: 'text-gray-400',
        border: 'border-[#1e293b]/85',
        gradientText: 'bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400 bg-clip-text text-transparent',
        navBg: 'bg-[#030612]/75'
      }
    : {
        bg: 'bg-[#F8FAFC]',
        bgSecondary: 'bg-white',
        bgCard: 'bg-white/70 backdrop-blur-xl border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)]',
        bgCardHover: 'hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(29,78,216,0.08)]',
        text: 'text-slate-900',
        textSecondary: 'text-slate-600',
        border: 'border-slate-200',
        gradientText: 'bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent',
        navBg: 'bg-[#F8FAFC]/75'
      };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300 font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden pb-12`}>
      
      {/* Absolute Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
      
      {/* Light Blurs */}
      <div className="absolute top-0 inset-x-0 h-[800px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-blue-700/20 via-blue-600/10 to-sky-500/10 blur-[140px] rounded-full dark:opacity-65" />
        <div className="absolute top-[300px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full dark:opacity-40" />
        <div className="absolute top-[200px] right-[-100px] w-[500px] h-[500px] bg-sky-500/10 blur-[120px] rounded-full dark:opacity-40" />
      </div>

      {/* Modern Centered Floating Navbar (Pill Design) */}
      <div className="fixed top-5 inset-x-0 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
        <header className={`pointer-events-auto max-w-5xl mx-auto rounded-full ${isDarkMode ? 'bg-[#0b1022]/80' : 'bg-white/80'} border ${themeClasses.border} backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.15)] px-6 py-3 flex items-center justify-between`}>
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/35 text-white font-black text-base transform hover:rotate-6 transition-transform cursor-pointer">
              FE
            </div>
            <span className={`text-base font-extrabold tracking-tight ${themeClasses.text}`}>
              Flight<span className="text-blue-600">Elevate</span>
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#philosophy" className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
              Philosophy
            </a>
            <a href="#pillars" className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
              Pillars
            </a>
            <a href="#features-interactive" className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
              Explore Ops
            </a>
            <a href="#calculator" className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
              ROI Calculator
            </a>
            <a href="#coming-soon" className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
              Roadmap
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border ${themeClasses.border} hover:bg-slate-200/20 dark:hover:bg-slate-800/30 transition-all text-sm`}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 hover:text-blue-800 bg-transparent transition-colors px-3 py-1"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="hidden sm:inline-flex px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-800 rounded-full shadow-lg shadow-blue-700/20 transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              Get Started
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-slate-200/20 dark:hover:bg-slate-800/30 transition-all focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <FiX size={16} /> : <FiMenu size={16} />}
            </button>
          </div>

        </header>

        {/* Mobile Navigation Dropdown Menu (Pill styling to match header) */}
        {mobileMenuOpen && (
          <div ref={menuRef} className={`pointer-events-auto mt-3 max-w-5xl mx-auto rounded-3xl ${isDarkMode ? 'bg-[#0d1527]/95' : 'bg-white/95'} border ${themeClasses.border} backdrop-blur-lg shadow-2xl p-6 space-y-4 animate-fade-in md:hidden`}>
            <div className="flex flex-col space-y-2 text-left">
              <a href="#philosophy" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:bg-slate-800/10 dark:hover:bg-slate-800/40 hover:${themeClasses.text} transition-all`}>
                Philosophy
              </a>
              <a href="#pillars" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:bg-slate-800/10 dark:hover:bg-slate-800/40 hover:${themeClasses.text} transition-all`}>
                Pillars
              </a>
              <a href="#features-interactive" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:bg-slate-800/10 dark:hover:bg-slate-800/40 hover:${themeClasses.text} transition-all`}>
                Explore Ops
              </a>
              <a href="#calculator" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:bg-slate-800/10 dark:hover:bg-slate-800/40 hover:${themeClasses.text} transition-all`}>
                ROI Calculator
              </a>
              <a href="#coming-soon" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${themeClasses.textSecondary} hover:bg-slate-800/10 dark:hover:bg-slate-800/40 hover:${themeClasses.text} transition-all`}>
                Roadmap
              </a>
            </div>
            
            <div className="pt-4 border-t border-slate-200/50 dark:border-gray-800/50 flex flex-col gap-2">
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="w-full py-3 text-center text-xs font-bold uppercase tracking-wider border border-blue-700 text-blue-700 rounded-2xl hover:bg-blue-700/5 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                className="w-full py-3 text-center text-xs font-bold uppercase tracking-wider bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-700/20 hover:bg-blue-800 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-36 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left */}
            <div className="lg:col-span-6 text-left space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <FiZap className="w-3.5 h-3.5 animate-bounce text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Next-Gen Flight Ops Platform</span>
              </div>

              {/* Title */}
              <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight ${themeClasses.text} leading-[1.06]`}>
                All-in-One Platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 dark:from-blue-400 dark:via-blue-500 dark:to-sky-400 animate-pulse">Modern Flight</span> Operations
              </h2>

              {/* Subheading */}
              <p className={`text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 leading-snug`}>
                Built for Part 61 & Part 141 flight schools, with support for personal pilot logbooks, flying clubs, and future expansion into Part 91 and university aviation programs.
              </p>

              {/* Supporting Text */}
              <p className={`text-base sm:text-lg ${themeClasses.textSecondary} leading-relaxed max-w-xl`}>
                Manage student training, oversee instructors, and streamline aircraft operations—all within a single, intelligent platform.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 text-base font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-2xl shadow-xl shadow-blue-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 group"
                >
                  Explore Platform
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  className={`px-8 py-4 text-base font-bold rounded-2xl border ${themeClasses.border} hover:bg-slate-200/20 dark:hover:bg-slate-800/25 transition-all flex items-center gap-2`}
                >
                  <FiPlay className="text-blue-700 fill-blue-700/10 w-4 h-4" />
                  Watch Overview
                </button>
              </div>

            </div>

            {/* Hero Right - INTERACTIVE Switcher Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-sky-500 rounded-3xl blur-[50px] opacity-10 dark:opacity-20 z-0" />
              
              {/* Premium Dashboard Frame */}
              <div className={`relative ${themeClasses.bgCard} border rounded-2xl shadow-2xl overflow-hidden z-10 max-w-xl mx-auto`}>
                
                {/* Browser Title Bar */}
                <div className={`px-4 py-3.5 flex items-center justify-between border-b ${themeClasses.border} bg-slate-100/60 dark:bg-slate-800/50`}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                    <span className={`text-[10px] font-mono font-bold ml-3 ${themeClasses.textSecondary} opacity-70`}>flightelevate.com/dashboard</span>
                  </div>
                  
                  <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Interactive Switcher Tabs */}
                <div className={`flex border-b ${themeClasses.border} bg-slate-50/40 dark:bg-[#0c1024]/40 p-1`}>
                  <button
                    onClick={() => setActiveMockupRole('admin')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeMockupRole === 'admin' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : `${themeClasses.textSecondary} hover:text-blue-500 hover:bg-slate-200/20 dark:hover:bg-slate-800/30`
                    }`}
                  >
                    <FiSliders className="w-3.5 h-3.5" />
                    Admin View
                  </button>
                  <button
                    onClick={() => setActiveMockupRole('instructor')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeMockupRole === 'instructor' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : `${themeClasses.textSecondary} hover:text-blue-500 hover:bg-slate-200/20 dark:hover:bg-slate-800/30`
                    }`}
                  >
                    <FiUser className="w-3.5 h-3.5" />
                    Instructor View
                  </button>
                  <button
                    onClick={() => setActiveMockupRole('student')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeMockupRole === 'student' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : `${themeClasses.textSecondary} hover:text-blue-500 hover:bg-slate-200/20 dark:hover:bg-slate-800/30`
                    }`}
                  >
                    <FiBook className="w-3.5 h-3.5" />
                    Student View
                  </button>
                </div>
                
                {/* Dynamic Screen Mockup Content */}
                <div className="p-6 space-y-5 text-left min-h-[300px] flex flex-col justify-between">
                  
                  {activeMockupRole === 'admin' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Oversight Dashboard</p>
                          <h4 className="text-lg font-extrabold tracking-tight">Main Academy Base</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">Fleet Active: 12 Aircraft</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Fleet Utilization</span>
                          <p className="text-2xl font-black mt-0.5 text-blue-500">84.2%</p>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '84.2%' }} />
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-gray-400 tracking-wider">Logged Flights</span>
                          <p className="text-2xl font-black mt-0.5 text-green-500">142 Flights</p>
                          <span className="text-[10px] text-green-500 font-bold block mt-1">↑ +14.2% this month</span>
                        </div>
                      </div>

                      {/* MVP Ground Aircraft Warning */}
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                        <FiAlertCircle className="text-rose-500 w-4 h-4 flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Ground Warning Active</p>
                          <p className="text-[10px] text-slate-600 dark:text-gray-400 mt-0.5">N172FE auto-grounded due to unresolved engine squawk. Safety limits applied.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMockupRole === 'instructor' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Instructor Workspace</p>
                          <h4 className="text-lg font-extrabold tracking-tight">Capt. Alex Carter</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">5 Lessons Today</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                              08
                            </div>
                            <div>
                              <p className="text-xs font-bold">Instrument Rating Check</p>
                              <p className="text-[10px] text-slate-500 dark:text-gray-400">Student: Sarah Jenkins • C-172</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold text-blue-500">08:00 - 10:00</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                              10
                            </div>
                            <div>
                              <p className="text-xs font-bold">Solo Cross-Country Signoff</p>
                              <p className="text-[10px] text-slate-500 dark:text-gray-400">Student: David Miller • Piper PA-28</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold text-blue-500">10:30 - 12:30</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-gray-400">Digital Logbook Signatures Pending:</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold">2 Actions</span>
                      </div>
                    </div>
                  )}

                  {activeMockupRole === 'student' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Student Portal</p>
                          <h4 className="text-lg font-extrabold tracking-tight">Sarah Jenkins</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">Commercial Syllabus</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 text-center">
                          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400 block">Total Hours</span>
                          <p className="text-lg font-black mt-1 text-purple-500">42.5 hrs</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 text-center">
                          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400 block">Solo Time</span>
                          <p className="text-lg font-black mt-1 text-purple-500">12.0 hrs</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 text-center">
                          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400 block">Syllabus Stage</span>
                          <p className="text-lg font-black mt-1 text-purple-500">80%</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold">Stage 2 Competency</span>
                          <span className="text-purple-500 font-bold">80% complete</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Switch Instruction Footer */}
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 text-center pt-3 border-t border-slate-100 dark:border-gray-800 font-medium">
                    💡 Click tabs above to see how FlightElevate adapts to each role in real time.
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Infinite Carousel - Modern Social Proof / Trusted By */}
      <section className={`py-12 border-y ${themeClasses.border} overflow-hidden bg-slate-50/50 dark:bg-[#0c1024]/40 z-10 relative`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-6">
            Trusted by Elite Aviation Academies & Flying Clubs
          </p>
          
          {/* Logo Ticker Container */}
          <div className="relative w-full flex overflow-x-hidden">
            <div className="animate-marquee whitespace-nowrap flex gap-16 text-lg font-extrabold tracking-wider text-gray-400 dark:text-gray-600 opacity-60">
              <span>✈️ APEX FLIGHT SCHOOLS</span>
              <span>⚡ VERTICAL ACADEMY</span>
              <span>🎓 HORIZON AVIATION</span>
              <span>🦅 BLUE RIDGE FLYERS</span>
              <span>🌐 COASTAL WINGS</span>
              <span>🏆 SUMMIT LOGISTICS</span>
              <span>🚀 ELEVATE PARTNERS</span>
            </div>
            
            <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-16 text-lg font-extrabold tracking-wider text-gray-400 dark:text-gray-600 opacity-60 ml-[100%]">
              <span>✈️ APEX FLIGHT SCHOOLS</span>
              <span>⚡ VERTICAL ACADEMY</span>
              <span>🎓 HORIZON AVIATION</span>
              <span>🦅 BLUE RIDGE FLYERS</span>
              <span>🌐 COASTAL WINGS</span>
              <span>🏆 SUMMIT LOGISTICS</span>
              <span>🚀 ELEVATE PARTNERS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section className={`py-24 sm:py-36 ${themeClasses.bgSecondary} relative z-10 border-b ${themeClasses.border}`} id="philosophy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider">
            Our Philosophy
          </div>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${themeClasses.text} leading-tight`}>
            Designed for Efficiency.<br />Built to Elevate the Experience.
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-700 to-blue-600 mx-auto rounded-full" />
          
          <p className={`text-lg sm:text-xl ${themeClasses.textSecondary} leading-relaxed font-normal`}>
            FlightElevate delivers a clean, intuitive experience through a structured, workflow-driven approach to scheduling and operations.
          </p>
          <p className={`text-base sm:text-lg ${themeClasses.textSecondary} leading-relaxed opacity-85 max-w-2xl mx-auto`}>
            By simplifying complex processes and removing unnecessary friction, the platform brings consistency to daily workflows—improving efficiency and enabling smoother, more reliable flight operations.
          </p>
        </div>
      </section>

      {/* Pillars Section: Connected Platform, Smart View, Admin Control */}
      <section className="py-24 sm:py-36 relative z-10" id="pillars">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Platform Core</span>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${themeClasses.text}`}>
              Seamless System Intelligence
            </h2>
            <p className={themeClasses.textSecondary}>
              Connect students, instructors, aircraft, and administration into one fully integrated aviation ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className={`p-8 rounded-2xl border ${themeClasses.bgCard} ${themeClasses.bgCardHover} text-left space-y-5 hover:-translate-y-1.5 transition-all duration-300 relative group`}>
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-700 to-blue-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FiMessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Connected Platform</h3>
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Seamless Communication Across Your Organization</h4>
              <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                Connect students, instructors, and staff through a centralized messaging system—keeping communication streamlined, trackable, and efficient.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className={`p-8 rounded-2xl border ${themeClasses.bgCard} ${themeClasses.bgCardHover} text-left space-y-5 hover:-translate-y-1.5 transition-all duration-300 relative group`}>
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 to-sky-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FiEye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Smart View</h3>
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Smart Views. Role-Based Intelligence.</h4>
              <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                Each user sees what matters most. Tailored dashboards for students, instructors, and administrators ensure faster decisions and better situational awareness.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className={`p-8 rounded-2xl border ${themeClasses.bgCard} ${themeClasses.bgCardHover} text-left space-y-5 hover:-translate-y-1.5 transition-all duration-300 relative group`}>
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-800 to-blue-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <FiSliders className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Admin Control</h3>
              <h4 className="text-sm font-semibold text-sky-600 dark:text-sky-400">Complete Operational Oversight</h4>
              <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                Gain full visibility across your organization with customizable access controls. Monitor schedules, cancellations, and weather impacts in real time—all from one dashboard.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ULTRA-MODERN INTERACTIVE FEATURE SPLIT SECTION (Vercel/Linear Style) */}
      <section className={`py-24 sm:py-36 ${themeClasses.bgSecondary} border-t border-b ${themeClasses.border} relative z-10`} id="features-interactive">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Platform capabilities</span>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${themeClasses.text}`}>
              Consolidated Flight Operations
            </h2>
            <p className={themeClasses.textSecondary}>
              Click on the capabilities below to explore real-time visual configurations.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Interactive Side Selector (Left 5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
              {features.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFeatureTab(idx)}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 flex items-center gap-4 ${
                    activeFeatureTab === idx 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10'
                      : `${themeClasses.bgCard} ${themeClasses.border} hover:border-slate-400/30`
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeFeatureTab === idx ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.title}</p>
                    <p className={`text-xs truncate ${activeFeatureTab === idx ? 'text-blue-100' : 'text-slate-500 dark:text-gray-400'}`}>
                      {item.tag || 'Available Now'}
                    </p>
                  </div>
                  <FiArrowRight className={`w-3.5 h-3.5 transition-transform ${activeFeatureTab === idx ? 'translate-x-0.5' : 'opacity-30'}`} />
                </button>
              ))}
            </div>

            {/* Display Visual Card (Right 7 Cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <div className={`p-8 rounded-2xl border ${themeClasses.bgCard} flex-1 flex flex-col justify-between text-left relative overflow-hidden`}>
                
                {/* Background radial highlight */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.06),transparent_40%)]" />

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                      {features[activeFeatureTab].tag || 'SaaS Standard'}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Operations Engine v1.0</span>
                  </div>

                  <h3 className="text-2xl font-black">{features[activeFeatureTab].title}</h3>
                  
                  <p className={`text-sm sm:text-base leading-relaxed ${themeClasses.textSecondary}`}>
                    {features[activeFeatureTab].description}
                  </p>

                  <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 text-xs sm:text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    <strong className="text-blue-500 font-bold block mb-1">Deep Dive Integration:</strong>
                    {features[activeFeatureTab].details}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-gray-800 mt-6 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-gray-400">Security Encrypted</span>
                  <button 
                    onClick={() => navigate('/register')}
                    className="text-blue-500 font-bold hover:underline flex items-center gap-1"
                  >
                    Get Started with {features[activeFeatureTab].title}
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ROI EFFICIENCY CALCULATOR (Highest-Conversion Market Feature) */}
      <section className="py-24 sm:py-36 relative z-10" id="calculator">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Info */}
            <div className="lg:col-span-5 text-left space-y-6">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">ROI Calculator</span>
              <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${themeClasses.text}`}>
                Estimate Your Flight School's Savings
              </h2>
              <p className={themeClasses.textSecondary}>
                Drag the sliders on the right to visualize your potential administrative efficiency gains and billing speed boost with FlightElevate.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                    <FiCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-semibold">Reduced paper flight logs by 100%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                    <FiCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-semibold">Automatic warning notifications on grounding squawks</span>
                </div>
              </div>
            </div>

            {/* Right Sliders and Dynamic Calculations */}
            <div className="lg:col-span-7">
              <div className={`p-8 rounded-3xl border ${themeClasses.bgCard} space-y-8`}>
                
                {/* Sliders container */}
                <div className="space-y-6">
                  
                  {/* Slider 1 */}
                  <div className="space-y-2.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Active Aircraft Fleet</label>
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-sm font-black">
                        {aircraftCount} Aircraft
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={aircraftCount}
                      onChange={(e) => setAircraftCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Slider 2 */}
                  <div className="space-y-2.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Monthly Bookings</label>
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-sm font-black">
                        {monthlyFlights} Flights
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      value={monthlyFlights}
                      onChange={(e) => setMonthlyFlights(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                </div>

                {/* Calculations Output Grid */}
                <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-gray-800">
                  
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 block">Hours Saved / Mo</span>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{hoursSaved} hrs</p>
                    <p className="text-[9px] text-slate-500 dark:text-gray-400 font-semibold">Reduced administration</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 block">Efficiency Boost</span>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">+{efficiencyScore}%</p>
                    <p className="text-[9px] text-slate-500 dark:text-gray-400 font-semibold">Operational throughput</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 block">Paper Eliminated</span>
                    <p className="text-3xl font-black text-sky-600 dark:text-sky-400">{paperSaved} lbs</p>
                    <p className="text-[9px] text-slate-500 dark:text-gray-400 font-semibold">Digital logbooks only</p>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Coming Soon: Expanding Capabilities Section */}
      <section className={`py-24 sm:py-36 ${themeClasses.bgSecondary} border-t border-b ${themeClasses.border} relative z-10`} id="coming-soon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Future Roadmap</span>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${themeClasses.text}`}>
              Coming Soon: Expanding Capabilities
            </h2>
            <p className={themeClasses.textSecondary}>
              We are actively developing premium next-level tools to broaden operational horizons.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comingSoonFeatures.map((item, index) => (
              <div key={index} className={`p-6 rounded-2xl border ${themeClasses.bgCard} ${themeClasses.bgCardHover} text-left space-y-3 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
                
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

      {/* Frequently Asked Questions */}
      <section className="py-24 sm:py-36 relative z-10" id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Common Inquiries</span>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${themeClasses.text}`}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-2xl border ${themeClasses.bgCard} overflow-hidden transition-all duration-200`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className={`w-full px-6 py-5 flex items-center justify-between text-left ${themeClasses.text} hover:bg-slate-100/10 transition-colors focus:outline-none`}
                >
                  <span className="font-extrabold text-base sm:text-lg">{faq.question}</span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
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

      {/* Premium Footer */}
      <footer className={`${themeClasses.bgSecondary} border-t ${themeClasses.border} py-16 relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-gray-800/10 dark:border-gray-800/50">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm">
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

            {/* Social Icons */}
            <div className="flex gap-3">
              <a href="#" className={`p-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.textSecondary} hover:text-blue-500 hover:border-blue-500 transition-colors`}>
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className={`p-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.textSecondary} hover:text-blue-500 hover:border-blue-500 transition-colors`}>
                <FiFacebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
            <span>© {new Date().getFullYear()} FlightElevate. All rights reserved.</span>
            <span>Premium Aviation Management Software</span>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;