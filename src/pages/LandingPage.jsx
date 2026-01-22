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
  FiTwitter,
  FiFacebook,
  FiMenu,
  FiX
} from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const menuRef = useRef(null);

  // Redirect authenticated users to dashboard immediately
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Use replace: true to avoid adding to history and prevent flash
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
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          setMobileMenuOpen(false);
        }
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Show nothing while checking authentication to prevent flash
  // IMPORTANT: All hooks must be called before any conditional returns
  if (authLoading || isAuthenticated) {
    return null;
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "What is Flight Elevate?",
      answer: "Flight Elevate is an all-in-one scheduling and operations platform built specifically for flight schools and aviation training centers."
    },
    {
      question: "Can instructors manage their own schedules?",
      answer: "Yes, instructors have full control over their schedules and can manage their availability, view upcoming lessons, and track student progress."
    },
    {
      question: "Does Flight Elevate track student flight hours automatically?",
      answer: "Yes, our integrated digital logbook automatically records each flight and updates student logbooks with instructor signatures digitally."
    },
    {
      question: "Can I manage multiple aircraft and bases?",
      answer: "Yes, Flight Elevate supports multi-base academies with unlimited aircraft management, availability tracking, and fleet utilization analytics."
    },
    {
      question: "Is my school's data secure?",
      answer: "Absolutely. We provide 99.9% secure cloud uptime with daily backups and compliance with aviation standards for data security."
    },
    {
      question: "Does the platform support ground training?",
      answer: "Yes, Flight Elevate supports both flight and ground training sessions, allowing you to track all types of training activities."
    },
    {
      question: "Can students see their upcoming lessons?",
      answer: "Yes, students have access to a dedicated dashboard where they can view upcoming lessons, track their logbook hours, and monitor their progress."
    },
    {
      question: "Can I export logs for audits?",
      answer: "Yes, you can export detailed logs, reports, and documentation at any time for compliance audits and record-keeping."
    },
    {
      question: "Will Flight Elevate work for small schools?",
      answer: "Absolutely! Flight Elevate is designed to scale with your school, from individual instructors to large multi-base academies."
    }
  ];

  const testimonials = [
    {
      name: "Jane Doe",
      title: "CEO of TechGenius Inc.",
      quote: "Implementing this SaaS platform, our productivity skyrocketed! It's like having a whole team of heroes supporting our business.",
      date: "Apr 17, 2023",
      image: "https://i.pravatar.cc/150?img=1"
    },
    {
      name: "John Smith",
      title: "Marketing Maven",
      quote: "I used to juggle multiple tools, but this platform brought everything under one roof. Now I'm a marketing wizard with time to spare for a coffee break!",
      date: "Apr 17, 2023",
      image: "https://i.pravatar.cc/150?img=12"
    },
    {
      name: "Sarah Johnson",
      title: "Small Business Owner",
      quote: "As a small business owner, I needed an affordable solution. This SaaS platform delivered beyond my expectations, helping my business compete with the big guys.",
      date: "March 17, 2023",
      image: "https://i.pravatar.cc/150?img=9"
    },
    {
      name: "Michael Chen",
      title: "E-Commerce Enthusiast",
      quote: "This SaaS platform transformed my online store into a smooth-running operation. Now I have more time to explore new business opportunities!",
      date: "Apr 17, 2023",
      image: "https://i.pravatar.cc/150?img=33"
    },
    {
      name: "Sophie Williams",
      title: "Creative Designer",
      quote: "Customizable branding features? Sign me up! This platform lets me unleash my creativity and give our brand a unique identity.",
      date: "March 17, 2023",
      image: "https://i.pravatar.cc/150?img=47"
    },
    {
      name: "Robert Turner",
      title: "CFO of Money Matters Corp.",
      quote: "The advanced reporting and analytics have revolutionized our financial decision-making. Our numbers have never looked better!",
      date: "June 4, 2023",
      image: "https://i.pravatar.cc/150?img=68"
    }
  ];

  const features = [
    {
      icon: <FiCalendar className="w-8 h-8" />,
      title: "Smart Scheduling",
      description: "Effortlessly manage flight bookings, instructor availability, aircraft assignments, and training slots with an intelligent real-time scheduler.",
      color: "purple"
    },
    {
      icon: <FiBarChart2 className="w-8 h-8" />,
      title: "Operations Analytics",
      description: "Get complete insights into student activity, instructor utilization, flight hours, revenue, and training progress with detailed analytics dashboards.",
      color: "green"
    },
    {
      icon: <FiBook className="w-8 h-8" />,
      title: "Integrated Digital Logbook",
      description: "Automatically record each flight, update student logbooks, and store instructor signatures digitally — ready for audits at any time.",
      color: "pink"
    },
    {
      icon: <FiNavigation className="w-8 h-8" />,
      title: "Aircraft Management",
      description: "Track aircraft maintenance, flight hours, inspection schedules, and availability to keep your entire fleet safe and operational.",
      color: "orange"
    },
    {
      icon: <FiUser className="w-8 h-8" />,
      title: "Student Progress Tracking",
      description: "Monitor milestones, certifications, logged hours, stage checks, endorsements, and overall training progress in one simple view.",
      color: "blue"
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Compliance & Safety Ready",
      description: "Designed with aviation standards in mind — secure data, detailed records, and documentation that helps you stay compliant as you grow.",
      color: "yellow"
    }
  ];


  const themeClasses = isDarkMode 
    ? {
        bg: 'bg-gray-900',
        bgSecondary: 'bg-gray-800',
        text: 'text-white',
        textSecondary: 'text-gray-300',
        border: 'border-gray-700',
        card: 'bg-gray-800 border-gray-700'
      }
    : {
        bg: 'bg-white',
        bgSecondary: 'bg-gray-50',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        border: 'border-gray-200',
        card: 'bg-white border-gray-200'
      };

  return (
    <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-300 overflow-x-hidden`}>
      {/* Header */}
      <header className="bg-blue-600 border-b border-blue-700 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Logo */}
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Flight Elevate
              </h1>
            </div>

            {/* Center - Navigation (Desktop) */}
            <nav className="hidden md:flex items-center space-x-8 flex-1 justify-center">
              <a href="#features" className="text-white hover:text-blue-100 transition-colors font-medium">
                Features
              </a>
              <a href="#faq" className="text-white hover:text-blue-100 transition-colors font-medium">
                FAQ
              </a>
            </nav>

            {/* Right - Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white hover:text-blue-100 transition-colors p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-blue-700 hover:bg-blue-800 border border-blue-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 md:px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm md:text-base min-h-[44px] shadow-sm whitespace-nowrap border border-blue-200"
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 md:px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm md:text-base min-h-[44px] shadow-sm whitespace-nowrap border border-blue-200"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            ref={menuRef}
            className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
              mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <nav className="py-4 space-y-3 border-t border-blue-700">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-white hover:text-blue-100 hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-white hover:text-blue-100 hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                FAQ
              </a>
              <div className="pt-2 border-t border-blue-700 space-y-2">
                <button
                  onClick={() => {
                    toggleTheme();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:text-blue-100 hover:bg-blue-700 rounded-lg transition-colors font-medium flex items-center gap-2 min-h-[44px]"
                >
                  <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
                  <span>Toggle Theme</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm min-h-[44px] shadow-sm border border-blue-200"
                >
                  Get Started
                </button>
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm min-h-[44px] shadow-sm border border-blue-200"
                >
                  Sign In
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`py-12 sm:py-20 ${themeClasses.bg}`}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <FiCheck className="text-green-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className={`text-xs sm:text-sm font-medium ${themeClasses.textSecondary}`}>
              Built for Flight Schools Schedule Instructors Aircraft Students
            </span>
          </div>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold ${themeClasses.text} mb-4 sm:mb-6 max-w-4xl`}>
            Smart Scheduling & Operations Software for <span className="text-blue-600">Flight Schools</span>
          </h2>
          <p className={`text-base sm:text-lg md:text-xl ${themeClasses.textSecondary} mb-6 sm:mb-8 max-w-3xl`}>
            Streamline flight scheduling, instructor management, aircraft tracking, and student training progress — all in one intelligent cloud platform built for modern flight schools.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-gray-500 mb-6 sm:mb-8">
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>Easy onboarding</span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-8 sm:mt-16 rounded-lg overflow-hidden shadow-2xl border border-gray-200 w-full">
            <div className={`${themeClasses.bgSecondary} px-3 sm:px-4 py-2 flex items-center space-x-2 border-b ${themeClasses.border}`}>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
              <span className={`ml-2 sm:ml-4 text-xs sm:text-sm ${themeClasses.textSecondary} truncate`}>flightelevate.com</span>
            </div>
            <div className={`${themeClasses.bg} p-4 sm:p-8`}>
              {/* Dashboard content preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`${themeClasses.card} p-4 rounded-lg border`}>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-1`}>Upcoming Flight Lessons</p>
                  <p className={`text-2xl font-bold ${themeClasses.text}`}>6</p>
                </div>
                <div className={`${themeClasses.card} p-4 rounded-lg border`}>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-1`}>Total Flights Logged</p>
                  <p className={`text-2xl font-bold ${themeClasses.text}`}>12</p>
                </div>
                <div className={`${themeClasses.card} p-4 rounded-lg border`}>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-1`}>Total Flights Hours</p>
                  <p className={`text-2xl font-bold ${themeClasses.text}`}>12</p>
                </div>
                <div className={`${themeClasses.card} p-4 rounded-lg border`}>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-1`}>Support Tickets</p>
                  <p className={`text-2xl font-bold ${themeClasses.text}`}>--</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student & Instructor Experience Section */}
      <section className={`py-20 ${themeClasses.bgSecondary}`} id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Student & Instructor Experience
            </span>
          </div>
          <h2 className={`text-4xl md:text-5xl font-bold ${themeClasses.text} mb-6`}>
            Built around real flight school workflows
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className={`text-lg ${themeClasses.textSecondary} mb-4`}>
                Flight Elevate connects your students, instructors, and aircraft into one shared workspace, so everyone knows exactly what's next.
              </p>
              <p className={`text-lg ${themeClasses.textSecondary} mb-6`}>
                Students can view upcoming lessons, track their logbook hours, and stay motivated. Instructors get a simple view of lessons, student progress, and aircraft availability.
              </p>
              <ul className="space-y-3">
                <li className={`flex items-start ${themeClasses.textSecondary}`}>
                  <FiCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Student dashboard for schedules, logbooks, and progress tracking.</span>
                </li>
                <li className={`flex items-start ${themeClasses.textSecondary}`}>
                  <FiCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Instructor dashboard for managing lessons and approving flights.</span>
                </li>
                <li className={`flex items-start ${themeClasses.textSecondary}`}>
                  <FiCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Admin views for fleet utilization, training performance, and overall school health.</span>
                </li>
              </ul>
            </div>
            <div className={`${themeClasses.card} rounded-lg border p-6`}>
              {/* Dashboard preview */}
              <div className="space-y-4">
                <h3 className={`text-xl font-semibold ${themeClasses.text}`}>Welcome Back, John</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${themeClasses.bgSecondary} p-4 rounded-lg`}>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Total Training Hours</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>76</p>
                  </div>
                  <div className={`${themeClasses.bgSecondary} p-4 rounded-lg`}>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Upcoming Lessons</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>12</p>
                  </div>
                  <div className={`${themeClasses.bgSecondary} p-4 rounded-lg`}>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Aircraft Available</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>43</p>
                  </div>
                  <div className={`${themeClasses.bgSecondary} p-4 rounded-lg`}>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Students Enrolled</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>22</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 ${themeClasses.bg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-4xl md:text-5xl font-bold text-center ${themeClasses.text} mb-4`}>
            Everything your <span className="text-blue-600">flight school</span> needs
          </h2>
          <p className={`text-xl text-center ${themeClasses.textSecondary} mb-12 max-w-3xl mx-auto`}>
            Powerful features designed to simplify operations and help your flight school soar to new heights.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`${themeClasses.card} p-6 rounded-lg border`}>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  feature.color === 'green' ? 'bg-green-100 text-green-600' :
                  feature.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                  feature.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
                  {feature.title}
                </h3>
                <p className={themeClasses.textSecondary}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className={`py-16 ${themeClasses.bgSecondary}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className={`text-5xl font-bold ${themeClasses.text} mb-2`}>60%</p>
              <p className={themeClasses.textSecondary}>Less admin time spent on scheduling.</p>
            </div>
            <div>
              <p className={`text-5xl font-bold ${themeClasses.text} mb-2`}>99.9%</p>
              <p className={themeClasses.textSecondary}>Secure cloud uptime with daily backups.</p>
            </div>
            <div>
              <p className={`text-5xl font-bold ${themeClasses.text} mb-2`}>1000+</p>
              <p className={themeClasses.textSecondary}>Students tracked across all programs.</p>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className={`py-20 ${themeClasses.bgSecondary}`} id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-4xl md:text-5xl font-bold text-center ${themeClasses.text} mb-4`}>
            Frequently Asked Questions
          </h2>
          <p className={`text-xl text-center ${themeClasses.textSecondary} mb-12`}>
            Got questions? Here are some common answers about Flight Elevate.
          </p>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`${themeClasses.card} rounded-lg border overflow-hidden`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className={`w-full px-6 py-4 flex items-center justify-between ${themeClasses.text} hover:bg-gray-50 transition-colors`}
                >
                  <span className="font-semibold text-left">{faq.question}</span>
                  <FiChevronDown
                    className={`w-5 h-5 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className={`px-6 py-4 ${themeClasses.bgSecondary} border-t ${themeClasses.border}`}>
                    <p className={themeClasses.textSecondary}>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-20 ${themeClasses.bg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-4xl md:text-5xl font-bold text-center ${themeClasses.text} mb-4`}>
            Wall of Love
          </h2>
          <p className={`text-xl text-center ${themeClasses.textSecondary} mb-12`}>
            Discover what our happy users have to say.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`${themeClasses.card} p-6 rounded-lg border`}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full mr-4 overflow-hidden flex-shrink-0 border-2 border-gray-200">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="w-full h-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">${testimonial.name.split(' ').map(n => n[0]).join('')}</div>`;
                      }}
                    />
                  </div>
                  <div>
                    <p className={`font-semibold ${themeClasses.text}`}>{testimonial.name}</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>{testimonial.title}</p>
                  </div>
                </div>
                <p className={`${themeClasses.textSecondary} mb-4`}>"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${themeClasses.textSecondary}`}>{testimonial.date}</span>
                  <div className="flex space-x-2">
                    <FiTwitter className="w-4 h-4 text-gray-400" />
                    <FiFacebook className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 ${themeClasses.bgSecondary}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-4xl md:text-5xl font-bold ${themeClasses.text} mb-4`}>
            Available on Multiple Platforms
          </h2>
          <p className={`text-xl ${themeClasses.textSecondary} mb-8`}>
            Access FlightElevate from any device - Desktop, Mobile, or Web Browser.
          </p>
          <div className="flex justify-center items-center gap-4 sm:gap-6 mb-8 flex-wrap">
            <div className={`px-6 py-3 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg border ${themeClasses.border} shadow-sm`}>
              <p className={`font-semibold ${themeClasses.text}`}>💻 PC</p>
            </div>
            <div className={`px-6 py-3 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg border ${themeClasses.border} shadow-sm`}>
              <p className={`font-semibold ${themeClasses.text}`}>🍎 Mac</p>
            </div>
            <div className={`px-6 py-3 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg border ${themeClasses.border} shadow-sm`}>
              <p className={`font-semibold ${themeClasses.text}`}>🌐 Web</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>Cross-platform compatibility</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>Cloud-based access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${themeClasses.bgSecondary} border-t ${themeClasses.border} py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              Flight Elevate
            </h3>
            <p className={themeClasses.textSecondary}>
              Professional Flight Training Management System
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <a href="/user-policy" className={`text-sm ${themeClasses.textSecondary} hover:text-blue-600 transition-colors`}>
                User Policy
              </a>
            </div>
            <p className={`mt-4 text-sm ${themeClasses.textSecondary}`}>
              © {new Date().getFullYear()} Flight Elevate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;