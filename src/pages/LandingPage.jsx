import React, { useState, useEffect } from 'react';
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
  FiArrowRight,
  FiTwitter,
  FiFacebook
} from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(0);
  const [email, setEmail] = useState('');

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription:', email);
    setEmail('');
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
      question: "Is there a free trial?",
      answer: "Yes, we offer a 14-day free trial with no credit card required. You can cancel anytime."
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
      date: "Apr 17, 2023"
    },
    {
      name: "John Smith",
      title: "Marketing Maven",
      quote: "I used to juggle multiple tools, but this platform brought everything under one roof. Now I'm a marketing wizard with time to spare for a coffee break!",
      date: "Apr 17, 2023"
    },
    {
      name: "Sarah Johnson",
      title: "Small Business Owner",
      quote: "As a small business owner, I needed an affordable solution. This SaaS platform delivered beyond my expectations, helping my business compete with the big guys.",
      date: "March 17, 2023"
    },
    {
      name: "Michael Chen",
      title: "E-Commerce Enthusiast",
      quote: "This SaaS platform transformed my online store into a smooth-running operation. Now I have more time to explore new business opportunities!",
      date: "Apr 17, 2023"
    },
    {
      name: "Sophie Williams",
      title: "Creative Designer",
      quote: "Customizable branding features? Sign me up! This platform lets me unleash my creativity and give our brand a unique identity.",
      date: "March 17, 2023"
    },
    {
      name: "Robert Turner",
      title: "CFO of Money Matters Corp.",
      quote: "The advanced reporting and analytics have revolutionized our financial decision-making. Our numbers have never looked better!",
      date: "June 4, 2023"
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

  const pricingPlans = [
    {
      name: "Personal",
      target: "For individual instructors",
      monthlyPrice: 19,
      yearlyPrice: 15,
      description: "Ideal for one-on-one instruction or small private training setups.",
      features: [
        "Smart scheduling for lessons",
        "Digital logbook for students",
        "Student dashboard access",
        "Basic analytics & reports"
      ],
      popular: false
    },
    {
      name: "Pro School",
      target: "Built for growing flight schools",
      monthlyPrice: 39,
      yearlyPrice: 31,
      description: "Built for growing flight schools that need full visibility across instructors, students, and aircraft.",
      features: [
        "Everything in Personal",
        "Unlimited instructors & students",
        "Aircraft management & availability",
        "Advanced reporting & utilization analytics",
        "Automated scheduling rules"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      target: "Multi-base academies",
      monthlyPrice: 79,
      yearlyPrice: 63,
      description: "Designed for large flight academies with multiple campuses, fleets, and training programs.",
      features: [
        "Everything in Pro",
        "Admin-level dashboards & permissions",
        "Custom integrations & API access",
        "Compliance management & audit exports",
        "Dedicated success manager"
      ],
      popular: false
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
    <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-300`}>
      {/* Top Promotional Banner */}
      <div className="bg-orange-500 text-white text-center py-2 text-sm font-medium">
        Limited Time: First 10 customers get 1 year FREE Only a few spots left.
      </div>

      {/* Header */}
      <header className={`${themeClasses.bgSecondary} border-b ${themeClasses.border} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Flight Elevate
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
                Features
              </a>
              <a href="#pricing" className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
                Pricing
              </a>
              <a href="#faq" className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
                FAQ
              </a>
              <a href="#downloads" className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}>
                Downloads
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${themeClasses.bg} ${themeClasses.border} border`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => navigate('/login')}
                className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`py-20 ${themeClasses.bg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 mb-6">
            <FiCheck className="text-green-500 w-5 h-5" />
            <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>
              Built for Flight Schools Schedule Instructors Aircraft Students
            </span>
          </div>
          <h2 className={`text-5xl md:text-6xl font-bold ${themeClasses.text} mb-6 max-w-4xl`}>
            Smart Scheduling & Operations Software for Flight Schools
          </h2>
          <p className={`text-xl ${themeClasses.textSecondary} mb-8 max-w-3xl`}>
            Streamline flight scheduling, instructor management, aircraft tracking, and student training progress — all in one intelligent cloud platform built for modern flight schools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
            >
              Start Free Trial
            </button>
            <button
              className={`px-8 py-4 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-blue-600 border-gray-300'} border rounded-lg font-semibold hover:bg-gray-50 transition-colors text-lg`}
            >
              Book a Demo
            </button>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 rounded-lg overflow-hidden shadow-2xl border border-gray-200">
            <div className={`${themeClasses.bgSecondary} px-4 py-2 flex items-center space-x-2 border-b ${themeClasses.border}`}>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className={`ml-4 text-sm ${themeClasses.textSecondary}`}>app.flightelevate.ai</span>
            </div>
            <div className={`${themeClasses.bg} p-8`}>
              {/* Dashboard content preview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

      {/* Pricing Section */}
      <section className={`py-20 ${themeClasses.bg}`} id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-4xl md:text-5xl font-bold text-center ${themeClasses.text} mb-4`}>
            Transparent, flexible pricing
          </h2>
          <p className={`text-xl text-center ${themeClasses.textSecondary} mb-8`}>
            Choose a plan that fits your flight school today — and upgrade as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className={`inline-flex items-center ${themeClasses.bgSecondary} rounded-lg p-1 border ${themeClasses.border}`}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : themeClasses.textSecondary
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : themeClasses.textSecondary
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`${themeClasses.card} rounded-lg border p-8 relative ${
                  plan.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>{plan.name}</h3>
                <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>{plan.target}</p>
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${themeClasses.text}`}>
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className={themeClasses.textSecondary}> /month</span>
                </div>
                <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <FiCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                      <span className={themeClasses.textSecondary}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : `${themeClasses.bgSecondary} ${themeClasses.text} border ${themeClasses.border} hover:bg-gray-100`
                  }`}
                >
                  Start Free Trial
                </button>
              </div>
            ))}
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
                  <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
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
            Ready to Elevate Your Flight School?
          </h2>
          <p className={`text-xl ${themeClasses.textSecondary} mb-8`}>
            Streamline operations, boost training efficiency, and deliver a better experience for both students and instructors.
          </p>
          <div className="flex justify-center items-center space-x-4 mb-8">
            <div className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg`}>
              PC
            </div>
            <div className={`px-4 py-2 ${themeClasses.bgSecondary} rounded-lg`}>
              Mac
            </div>
            <div className={`px-4 py-2 ${themeClasses.bgSecondary} rounded-lg`}>
              Web
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
            >
              Start Free Trial
            </button>
            <button
              className={`px-8 py-4 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-blue-600 border-gray-300'} border rounded-lg font-semibold hover:bg-gray-50 transition-colors text-lg`}
            >
              Book a Demo
            </button>
          </div>
          <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiCheck className="text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className={`py-16 ${themeClasses.bg}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl md:text-4xl font-bold ${themeClasses.text} mb-4`}>
            Join our Newsletter
          </h2>
          <p className={`text-lg ${themeClasses.textSecondary} mb-8`}>
            Stay in touch with product updates, aviation training tips, and best practices for running a modern flight school.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className={`flex-1 px-4 py-3 rounded-lg border ${themeClasses.border} ${themeClasses.bgSecondary} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <FiArrowRight className="w-5 h-5" />
            </button>
          </form>
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

