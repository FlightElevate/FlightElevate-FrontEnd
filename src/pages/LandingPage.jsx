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
  FiArrowRight,
  FiPlay,
  FiTwitter,
  FiFacebook,
  FiSliders,
  FiZap,
  FiAlertCircle,
  FiActivity,
  FiCheckCircle,
  FiDollarSign,
  FiClock,
  FiDownload,
  FiCpu
} from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeMockupRole, setActiveMockupRole] = useState('admin'); // 'admin', 'instructor', 'student'
  
  // Interactive Feature Selector Tab
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  
  // Interactive Savings Calculator State
  const [aircraftCount, setAircraftCount] = useState(8);
  const [monthlyFlights, setMonthlyFlights] = useState(180);

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

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    {
      icon: <FiCheckCircle className="w-5 h-5" />,
      title: "Connected Platform",
      description: "Seamless Communication Across Your Organization",
      details: "Connect students, instructors, and staff through a centralized messaging system—keeping communication streamlined, trackable, and efficient.",
      tag: "Connected Platform"
    },
    {
      icon: <FiUser className="w-5 h-5" />,
      title: "Smart View",
      description: "Smart Views. Role-Based Intelligence.",
      details: "Each user sees what matters most. Tailored dashboards for students, instructors, and administrators ensure faster decisions and better situational awareness.",
      tag: "Smart View"
    },
    {
      icon: <FiSliders className="w-5 h-5" />,
      title: "Admin Control",
      description: "Complete Operational Oversight",
      details: "Gain full visibility across your organization with customizable access controls. Monitor schedules, cancellations, and weather impacts in real time—all from one dashboard.",
      tag: "Admin Control"
    }
  ];

  const faqs = [
    {
      question: "Who is FlightElevate built for?",
      answer: "FlightElevate is designed for Part 61 and Part 141 flight schools, with future expansion into Part 91 operations and aviation programs."
    },
    {
      question: "Can FlightElevate replace my current scheduling system?",
      answer: "Yes. FlightElevate is built as an all-in-one platform that streamlines scheduling, communication, and operations."
    },
    {
      question: "Does it support compliance and reporting?",
      answer: "Yes. The platform supports operational tracking, reporting, and regulatory requirements."
    },
    {
      question: "Is the platform customizable?",
      answer: "Yes. FlightElevate offers flexible configurations aligned with your workflows."
    },
    {
      question: "Are mobile apps available?",
      answer: "Mobile apps for iOS and Android are currently in development."
    }
  ];

  const comingSoonFeatures = [
    {
      icon: <FiCpu className="w-5 h-5 text-blue-700" />,
      category: "AI Operations",
      title: "Cognitive AI & Voice Bots",
      description: "AI-assisted chatbots, voice-command assistance, and FBO coordination voice bots powered by OpenAI & custom LLMs (Mistral/LLaMA)."
    },
    {
      icon: <FiNavigation className="w-5 h-5 text-blue-700" />,
      category: "Operations",
      title: "Corporate & Crew Scheduling",
      description: "Expanding platform support for corporate aviation, crew scheduling workflows, dispatch management, and automated hotel booking integrations."
    },
    {
      icon: <FiActivity className="w-5 h-5 text-blue-700" />,
      category: "Intelligent Tools",
      title: "Weight, Balance & Weather",
      description: "Integrated real-time weight & balance tools, aviation weather forecast integrations, and proactive safety management warnings."
    },
    {
      icon: <FiSliders className="w-5 h-5 text-blue-700" />,
      category: "Maintenance",
      title: "Safety Management & Inventory",
      description: "Automated Safety Management System (SMS), aircraft downtime tracking, maintenance restrictions, and inventory module tracking."
    },
    {
      icon: <FiBarChart2 className="w-5 h-5 text-blue-700" />,
      category: "Database & Analytics",
      title: "Analytical DB & Models",
      description: "Planned MongoDB secondary database analytics framework for high-throughput reporting, forecasting, and operational bottlenecks."
    },
    {
      icon: <FiShield className="w-5 h-5 text-blue-700" />,
      category: "Compliance",
      title: "Enterprise Audit Logging",
      description: "Immutable security audit logging, sensitive document protection, and advanced role-based access control (RBAC) compliance."
    }
  ];

  // Calculated savings values based on inputs
  const hoursSaved = Math.round(aircraftCount * 8 + (monthlyFlights * 0.4));
  const efficiencyScore = Math.min(98, Math.round(75 + (aircraftCount * 0.5) + (monthlyFlights * 0.03)));
  const paperSaved = Math.round(monthlyFlights * 0.7);

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-slate-800 transition-colors duration-300 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden pb-12">
      
      {/* Light Blurs */}
      <div className="absolute top-0 inset-x-0 h-[800px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-r from-blue-700/5 via-blue-600/8 to-sky-500/5 blur-[160px] rounded-full" />
        <div className="absolute top-[200px] left-[-200px] w-[600px] h-[600px] bg-blue-600/5 blur-[140px] rounded-full" />
      </div>

      {/* Floating Navbar (Pill Design) */}
      <div className="fixed top-5 inset-x-0 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
        <header className="pointer-events-auto max-w-4xl mx-auto rounded-full bg-white/95 border border-slate-100 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-6 py-3 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center shadow-md shadow-blue-700/20 text-white font-black text-sm">
              FE
            </div>
            <span className="text-sm font-extrabold tracking-tight text-slate-900">
              Flight<span className="text-blue-700">Elevate</span>
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-6">
            <a href="#philosophy" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-700 transition-colors">
              Philosophy
            </a>
            <a href="#features-interactive" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-700 transition-colors">
              Pillars
            </a>
            <a href="#features-list" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-700 transition-colors">
              Features
            </a>
            <a href="#coming-soon" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-700 transition-colors">
              Roadmap
            </a>
            <a href="#faq" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-700 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-blue-700 transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-800 rounded-full shadow-md shadow-blue-700/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </button>
            
            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-full border border-slate-200 hover:bg-slate-55 transition-all focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <FiX size={14} /> : <FiMenu size={14} />}
            </button>
          </div>

        </header>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div ref={menuRef} className="pointer-events-auto mt-3 max-w-4xl mx-auto rounded-2xl bg-white border border-slate-100 shadow-xl p-5 space-y-3 lg:hidden">
            <div className="flex flex-col space-y-1 text-left">
              <a href="#philosophy" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-55 transition-all">
                Philosophy
              </a>
              <a href="#features-interactive" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-55 transition-all">
                Pillars
              </a>
              <a href="#features-list" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-55 transition-all">
                Features
              </a>
              <a href="#coming-soon" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-55 transition-all">
                Roadmap
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-55 transition-all">
                FAQ
              </a>
            </div>
            
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider bg-blue-700 text-white rounded-xl shadow-md hover:bg-blue-800 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-28 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left */}
            <div className="lg:col-span-6 text-left space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100/60 shadow-[0_2px_10px_rgba(29,78,216,0.02)]">
                <FiZap className="w-3.5 h-3.5 text-blue-700 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-750">Part 61 & Part 141 Flight Operations</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
                All-in-One Platform for <span className="text-blue-700 relative">Modern Flight</span> Operations
              </h2>

              {/* Subheading */}
              <p className="text-xs sm:text-sm font-extrabold text-blue-700 uppercase tracking-wider leading-relaxed">
                Built for Part 61 & Part 141 flight schools, with support for personal pilot logbooks, flying clubs, and future expansion into Part 91 and university aviation programs.
              </p>

              {/* Supporting Text */}
              <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-xl">
                Manage student training, oversee instructors, and streamline aircraft operations—all within a single, intelligent platform.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => navigate('/register')}
                  className="px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-lg shadow-blue-700/15 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 group"
                >
                  Explore Platform
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#features-interactive"
                  className="px-7 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-55 transition-all flex items-center gap-2"
                >
                  <FiPlay className="text-blue-700 fill-blue-700/10 w-3.5 h-3.5" />
                  Watch Overview
                </a>
              </div>

            </div>

            {/* Hero Right - Interactive Premium Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/10 to-sky-500/10 rounded-2xl blur-[40px] opacity-30 z-0" />
              
              {/* Premium Dashboard Frame */}
              <div className="relative bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-10 max-w-xl mx-auto">
                
                {/* Browser Title Bar */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                    <span className="text-[10px] font-semibold ml-3 text-slate-400">flightelevate.com/dashboard</span>
                  </div>
                  
                  <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Simulated Screen with matching Sidebar and Content Pane */}
                <div className="flex min-h-[340px] text-left">
                  
                  {/* Matching Sidebar Frame in exact Brand bg-blue-700 */}
                  <div className="w-40 bg-blue-700 text-white p-3 flex flex-col justify-between border-r border-blue-800">
                    <div className="space-y-4">
                      {/* Brand Label */}
                      <div className="flex items-center gap-1.5 border-b border-blue-600/60 pb-2">
                        <div className="w-5 h-5 rounded bg-white text-blue-700 flex items-center justify-center font-black text-[10px]">FE</div>
                        <span className="text-[10px] font-extrabold tracking-tight">FlightElevate</span>
                      </div>
                      
                      {/* Sidebar Items */}
                      <div className="space-y-1">
                        <div className={`px-2 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-colors ${activeMockupRole === 'admin' ? 'bg-white text-blue-700' : 'hover:bg-blue-600/80'}`} onClick={() => setActiveMockupRole('admin')}>
                          <FiSliders className="w-3 h-3" />
                          <span>Admin View</span>
                        </div>
                        <div className={`px-2 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-colors ${activeMockupRole === 'instructor' ? 'bg-white text-blue-700' : 'hover:bg-blue-600/80'}`} onClick={() => setActiveMockupRole('instructor')}>
                          <FiUser className="w-3 h-3" />
                          <span>Instructor</span>
                        </div>
                        <div className={`px-2 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-colors ${activeMockupRole === 'student' ? 'bg-white text-blue-700' : 'hover:bg-blue-600/80'}`} onClick={() => setActiveMockupRole('student')}>
                          <FiBook className="w-3 h-3" />
                          <span>Student View</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Trial Status Badge shown conditionally */}
                    {activeMockupRole === 'student' && (
                      <div className="bg-blue-800/60 rounded p-1.5 border border-blue-500/50">
                        <p className="text-[7px] text-blue-200 uppercase font-bold tracking-wider">Trial Status</p>
                        <p className="text-[8px] font-bold text-white mt-0.5">8 Days Remaining</p>
                      </div>
                    )}
                  </div>

                  {/* Main Panel Area */}
                  <div className="flex-1 p-4 bg-[#F8FAFC] flex flex-col justify-between">
                    
                    {/* Active View Title */}
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h4 className="text-xs font-black text-slate-800 tracking-tight">
                          {activeMockupRole === 'admin' && "Academy Base Command"}
                          {activeMockupRole === 'instructor' && "Flight Endorsements"}
                          {activeMockupRole === 'student' && "Sarah Jenkins Logbook"}
                        </h4>
                        <span className="text-[8px] font-bold text-slate-400">Updates Live</span>
                      </div>

                      {/* View Specific Cards */}
                      {activeMockupRole === 'admin' && (
                        <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-white border border-slate-100">
                              <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Fleet Util.</span>
                              <p className="text-sm font-black text-blue-700 mt-0.5">84.2%</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white border border-slate-100">
                              <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Daily Flights</span>
                              <p className="text-sm font-black text-slate-850 mt-0.5">18 Flights</p>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-rose-50 border border-rose-100/60 flex items-start gap-2">
                            <FiAlertCircle className="text-rose-600 w-3 h-3 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[9px] font-bold text-rose-800">Ground Warning Active</p>
                              <p className="text-[7px] text-slate-500">N172FE auto-grounded due to Squawk #12.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeMockupRole === 'instructor' && (
                        <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                          <div className="p-2 rounded-lg bg-white border border-slate-100 space-y-1.5">
                            <p className="text-[9px] font-bold text-slate-800">Pending Endorsements</p>
                            
                            <div className="flex justify-between items-center text-[8px] p-1 bg-slate-50 rounded">
                              <span className="font-semibold">Sarah J. - Instrument Check</span>
                              <span className="text-blue-700 font-bold">Signoff</span>
                            </div>
                            <div className="flex justify-between items-center text-[8px] p-1 bg-slate-50 rounded">
                              <span className="font-semibold">David M. - Solo XC Route</span>
                              <span className="text-blue-700 font-bold">Signoff</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeMockupRole === 'student' && (
                        <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                          <div className="grid grid-cols-3 gap-1">
                            <div className="p-1.5 bg-white border border-slate-100 rounded text-center">
                              <span className="text-[7px] font-bold text-slate-400 block">Total</span>
                              <p className="text-xs font-black text-slate-850">42.5 hrs</p>
                            </div>
                            <div className="p-1.5 bg-white border border-slate-100 rounded text-center">
                              <span className="text-[7px] font-bold text-slate-400 block">Solo</span>
                              <p className="text-xs font-black text-slate-850">12.0 hrs</p>
                            </div>
                            <div className="p-1.5 bg-white border border-slate-100 rounded text-center">
                              <span className="text-[7px] font-bold text-slate-400 block">Syllabus</span>
                              <p className="text-xs font-black text-emerald-700">80%</p>
                            </div>
                          </div>
                          
                          <div className="p-2 rounded bg-white border border-slate-100 space-y-1">
                            <div className="flex justify-between text-[7px] font-bold">
                              <span>FAA Stage 2 Progress</span>
                              <span className="text-blue-700">80% Complete</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div className="bg-blue-700 h-1 rounded-full" style={{ width: '80%' }} />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Micro Navigation Guidance */}
                    <div className="text-[8px] text-slate-400 text-center pt-2 border-t border-slate-100 font-medium">
                      💡 Click roles in the sidebar to dynamically change dashboard layout!
                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Logo Ticker Section */}
      <section className="py-8 border-y border-slate-100 bg-[#F4F6F9]/40 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            Powering Active Flight Academies & Clubs Across the Country
          </p>
          
          <div className="relative w-full flex overflow-x-hidden">
            <div className="animate-marquee whitespace-nowrap flex gap-12 text-[11px] font-extrabold tracking-widest text-slate-400 opacity-70">
              <span>✈️ APEX FLIGHT SCHOOLS</span>
              <span>⚡ VERTICAL FLIGHT ACADEMY</span>
              <span>🦅 BLUE RIDGE FLYERS</span>
              <span>🌐 COASTAL WINGS</span>
              <span>🏆 SUMMIT FLIGHT SERVICES</span>
              {/* Duplicate for seamless infinite marquee scroll */}
              <span>✈️ APEX FLIGHT SCHOOLS</span>
              <span>⚡ VERTICAL FLIGHT ACADEMY</span>
              <span>🦅 BLUE RIDGE FLYERS</span>
              <span>🌐 COASTAL WINGS</span>
              <span>🏆 SUMMIT FLIGHT SERVICES</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section className="py-20 sm:py-24 bg-white relative z-10 border-b border-slate-100" id="philosophy">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100/60 text-[10px] font-bold uppercase tracking-wider">
            Core Philosophy
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Designed for Efficiency. Built to Elevate the Experience.
          </h3>
          <p className="text-sm sm:text-base text-slate-600 font-semibold leading-relaxed">
            FlightElevate delivers a clean, intuitive experience through a structured, workflow-driven approach to scheduling and operations.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            By simplifying complex processes and removing unnecessary friction, the platform brings consistency to daily workflows—improving efficiency and enabling smoother, more reliable flight operations.
          </p>
        </div>
      </section>

      {/* Interactive Capabilities Showcase (centralized communication, dashboard etc) */}
      <section className="py-20 sm:py-24 relative z-10" id="features-interactive">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Capabilities</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Centralized Workflows & Command
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Explore the three core pillars of our operational approach in real time.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Interactive Side Tabs */}
            <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
              {features.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFeatureTab(idx)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 ${
                    activeFeatureTab === idx 
                      ? 'bg-white border-blue-700/30 shadow-md shadow-blue-700/5'
                      : 'bg-white/60 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeFeatureTab === idx ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                      {item.tag}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Capability Detail Card */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="p-8 rounded-2xl border border-slate-100 bg-white shadow-sm flex-1 flex flex-col justify-between text-left relative overflow-hidden">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100/50 text-[10px] font-bold uppercase tracking-wider">
                    {features[activeFeatureTab].tag}
                  </div>

                  <h4 className="text-xl font-black text-slate-900">{features[activeFeatureTab].description}</h4>
                  
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {features[activeFeatureTab].details}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">FlightElevate Operational Standard</span>
                  <button 
                    onClick={() => navigate('/register')}
                    className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                  >
                    Explore Platform
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Features and Performance Card Grid */}
      <section className="py-20 sm:py-24 bg-[#F8FAFC] relative z-10 border-t border-b border-slate-100" id="features-list">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">At A Glance</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Built to Deliver Results
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Features Card */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-white text-left space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <FiCheck className="w-4 h-4" />
                </div>
                <h4 className="text-lg font-black text-slate-900">Platform Features</h4>
              </div>
              <ul className="space-y-3.5">
                {[
                  "Smart Scheduling",
                  "Operations Analytics",
                  "Integrated Digital Logbook",
                  "Aircraft Management",
                  "Student Progress Tracking (Coming Soon)",
                  "Compliance & Reporting"
                ].map((feat, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-650 font-bold text-xs sm:text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-700 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Performance & Availability Card */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-white text-left space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <FiActivity className="w-4 h-4" />
                </div>
                <h4 className="text-lg font-black text-slate-900">Performance & Availability</h4>
              </div>
              <ul className="space-y-3.5">
                {[
                  "Reduce administrative workload by up to 60%",
                  "99.99% cloud-based reliability",
                  "Accessible on desktop",
                  "Mobile apps coming soon (iOS & Android)"
                ].map((perf, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-655 font-bold text-xs sm:text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-700 flex-shrink-0" />
                    <span>{perf}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ROI Savings Calculator */}
      <section className="py-20 sm:py-24 bg-white border-b border-slate-100 relative z-10" id="calculator">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-5 text-left space-y-6">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">ROI Insights</span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Estimate Your Savings with FlightElevate
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Adjust your fleet size and average monthly flights to instantly view the calculated scheduling hours saved and operational efficiency metrics.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                    <FiCheck className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Digital logbook checkouts eliminate paperwork</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                    <FiCheck className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Prevent dual booking conflicts automatically</span>
                </div>
              </div>
            </div>

            {/* Right Sliders Card */}
            <div className="lg:col-span-7">
              <div className="p-8 rounded-2xl border border-slate-100 bg-[#F8FAFC] space-y-8 shadow-sm">
                
                <div className="space-y-6">
                  {/* Fleet Slider */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Size</label>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-black">
                        {aircraftCount} Aircraft
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={aircraftCount}
                      onChange={(e) => setAircraftCount(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
                    />
                  </div>

                  {/* Monthly Flights Slider */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Flights Logged</label>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-black">
                        {monthlyFlights} Flights
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="500"
                      value={monthlyFlights}
                      onChange={(e) => setMonthlyFlights(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
                    />
                  </div>
                </div>

                {/* Calculation Outputs */}
                <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                  <div className="p-4 rounded-xl bg-white border border-slate-100 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Hours Saved / Mo</span>
                    <p className="text-2xl font-black text-blue-700 mt-1">{hoursSaved} hrs</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-100 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Efficiency Boost</span>
                    <p className="text-2xl font-black text-blue-700 mt-1">+{efficiencyScore}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-100 text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Paper Eliminated</span>
                    <p className="text-2xl font-black text-blue-700 mt-1">{paperSaved} lbs</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Coming Soon: Expanding Capabilities Section */}
      <section className="py-20 sm:py-24 bg-[#F8FAFC] border-t border-b border-slate-100 relative z-10" id="coming-soon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Future Roadmap</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Coming Soon: Expanding Capabilities
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              We are actively developing premium next-level tools to broaden operational horizons.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comingSoonFeatures.map((item, index) => (
              <div key={index} className="p-6 rounded-2xl border border-slate-100 bg-white text-left space-y-3 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-700/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700 flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-bold tracking-wider text-blue-750 uppercase">
                      {item.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 sm:py-24 relative z-10" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Support FAQ</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-100 bg-white overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4.5 flex items-center justify-between text-left text-slate-800 hover:bg-slate-50 transition-colors focus:outline-none"
                >
                  <span className="font-extrabold text-sm sm:text-base">{faq.question}</span>
                  <div className={`p-1 rounded bg-slate-50 text-slate-500 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                    <FiChevronDown className="w-4 h-4" />
                  </div>
                </button>
                
                {openFaq === index && (
                  <div className="px-6 py-4 border-t border-slate-50 bg-[#F8FAFC] text-xs sm:text-sm text-slate-550 leading-relaxed font-semibold">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Simple Modern Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center text-white font-extrabold text-xs">
                FE
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Flight<span className="text-blue-700">Elevate</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-wider">
              <a href="/user-policy" className="text-slate-500 hover:text-blue-700 transition-colors">
                User Policy
              </a>
              <a href="#philosophy" className="text-slate-500 hover:text-blue-700 transition-colors">
                About
              </a>
              <a href="#faq" className="text-slate-500 hover:text-blue-700 transition-colors">
                Contact
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex gap-2">
              <a href="#" className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-700 transition-colors">
                <FiTwitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-700 transition-colors">
                <FiFacebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>© {new Date().getFullYear()} FlightElevate. All rights reserved.</span>
            <span>Premium Aviation Management Software</span>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;