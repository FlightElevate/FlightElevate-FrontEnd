import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiCreditCard, FiServer, FiAlertCircle } from 'react-icons/fi';

const UserPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);

  const sections = [
    { id: 'payment', title: 'Payment Processing', icon: FiCreditCard },
    { id: 'wallet', title: 'Digital Wallet', icon: FiCreditCard },
    { id: 'service', title: 'Service Agreement', icon: FiShield },
    { id: 'availability', title: 'Service Availability', icon: FiServer },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-100 hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Service Terms & Policies</h1>
          <p className="text-blue-100">FlightElevate SaaS Service Agreement</p>
          <p className="text-sm text-blue-200 mt-2">Version v2025.11.20 - Last Updated: November 20, 2025</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Quick Navigation</h3>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center px-3 py-2 text-sm rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Icon className="mr-2 w-4 h-4" />
                      {section.title}
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Important Notice */}
              <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-6 rounded-tr-lg rounded-br-lg">
                <div className="flex">
                  <FiAlertCircle className="text-orange-400 w-6 h-6 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">Important Notice</h3>
                    <p className="text-sm text-orange-800">
                      Please read these terms carefully before using FlightElevate. By creating an account or using our services, you agree to be bound by these terms and conditions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* PART 1: Platform Liability and Payment Processing */}
                <section id="payment" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <FiCreditCard className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Payment Processing</h2>
                      <p className="text-sm text-gray-600">Platform liability and Stripe integration</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">1.1 Platform Services</h3>
                      <p className="text-gray-700">
                        FlightElevate provides a digital platform for scheduling, management, and billing services, including payment processing.
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">1.2 Integration via Stripe Connect</h3>
                      <p className="text-gray-700 mb-3">Users agree that:</p>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2 min-w-[60px]">1.2.1</span>
                          <span>FlightElevate shall not be held liable for any disputes arising from the use of the platform.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2 min-w-[60px]">1.2.2</span>
                          <span>All payment processing is facilitated by Stripe Connect. FlightElevate does not store or process card information directly.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2 min-w-[60px]">1.2.3</span>
                          <span>While we assist with transaction issues, it is the responsibility of the user to input accurate billing amounts and review applicable taxes and fees before charging any customer.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2 min-w-[60px]">1.2.4</span>
                          <span>FlightElevate is not responsible for billing errors made by users or third parties. Users bear full responsibility for entering correct charges.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2 min-w-[60px]">1.2.5</span>
                          <span>Users may request refunds through the Stripe portal. Transaction fees associated with refunds will be borne by the user.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2 min-w-[60px]">1.2.6</span>
                          <span>FlightElevate reserves the right to introduce or modify platform service fees. Users will be notified in advance of any changes.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <strong className="text-yellow-900">Development Note:</strong> Billing module is currently under development. Full Stripe integration will be completed after initial platform deployment. Users will be notified once billing is fully operational.
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Credit Card & Transaction Fees</h3>
                      <p className="text-gray-700 mb-2"><strong>3.1</strong> Processing fees are determined by Stripe and may fluctuate based on Stripe's pricing.</p>
                      <p className="text-gray-700"><strong>3.2</strong> FlightElevate reserves the right to adjust platform fees if operational expenses increase.</p>
                    </div>

                    <div className="border-l-4 border-blue-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Card Information Storage</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2">4.1</span>
                          <span>Card details are stored securely using Stripe's PCI-compliant tokenization services.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2">4.2</span>
                          <span>FlightElevate does not directly access stored card data for purposes unrelated to platform operation.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2">4.3</span>
                          <span>Access is strictly for troubleshooting transaction-related issues.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Digital Wallet */}
                <section id="wallet" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <FiCreditCard className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Digital Wallet & Funds</h2>
                      <p className="text-sm text-gray-600">Wallet functionality and fund handling</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-200 pl-6">
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>FlightElevate offers digital wallet functionality for students and end-users.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>All wallet services are powered by Stripe. FlightElevate does not hold or have access to funds.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>Fund transfers and disbursements are managed by Stripe.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>FlightElevate disclaims liability for fund holding, transferring, or disbursement.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Service Agreement */}
                <section id="service" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <FiShield className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Service Agreement</h2>
                      <p className="text-sm text-gray-600">Terms of service and billing authorization</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border-l-4 border-purple-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Introduction</h3>
                      <p className="text-gray-700">
                        This agreement governs the use of FlightElevate by flight schools, operators, instructors, and administrative users. By accessing the Platform, you agree to these terms.
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Services Provided</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start">
                          <span className="text-purple-600 mr-2">✓</span>
                          <span className="text-gray-700">Aircraft & instructor scheduling</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-purple-600 mr-2">✓</span>
                          <span className="text-gray-700">Student billing & payments</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-purple-600 mr-2">✓</span>
                          <span className="text-gray-700">Maintenance tracking</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-purple-600 mr-2">✓</span>
                          <span className="text-gray-700">Employee management</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-purple-600 mr-2">✓</span>
                          <span className="text-gray-700">Customizable access levels</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-purple-600 mr-2">✓</span>
                          <span className="text-gray-700">Future AI integrations</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <strong className="text-blue-900">Early Development Phase:</strong> As a SaaS product in early development, FlightElevate follows a continuous improvement model. We apologize for any inconvenience caused by technical challenges and appreciate your support.
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Responsibilities</h3>
                      <p className="text-gray-700">
                        Customers are responsible for managing user access, ensuring FAA compliance, and maintaining accurate operational records as required by regulatory protocols.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Service Availability */}
                <section id="availability" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                      <FiServer className="w-5 h-5 text-orange-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Service Availability</h2>
                      <p className="text-sm text-gray-600">Uptime, hosting, and data backup policies</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border-l-4 border-orange-200 pl-6">
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2">9.1</span>
                          <span>Platform provided 'as-is' and 'as-available'. No guarantee of uninterrupted service.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2">9.2</span>
                          <span>Hosted on third-party cloud infrastructure. Service may be affected by provider outages.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2">9.3</span>
                          <span>Automated recovery mechanisms in place. Manual restarts performed as needed.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2">9.4</span>
                          <span>FlightElevate not liable for damages from downtime or service interruptions.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2">9.5</span>
                          <span>Users acknowledge temporary outages are inherent to cloud platforms.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">Data Backup Responsibility</h4>
                      <p className="text-sm text-red-800">
                        Users are responsible for maintaining additional backups of operational records required by regulatory agencies. FlightElevate is not liable for data loss from hosting outages beyond our control.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Additional Terms */}
                <section className="border-t border-gray-200 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
                      <p className="text-sm text-gray-700">
                        FlightElevate shall not be liable for indirect, incidental, special, or consequential damages arising from platform use.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Termination</h3>
                      <p className="text-sm text-gray-700">
                        Either party may terminate with 30 days written notice. Fees owed up to termination remain payable.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Governing Law</h3>
                      <p className="text-sm text-gray-700">
                        This agreement is governed by laws of the applicable jurisdiction where FlightElevate operates.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact</h3>
                      <p className="text-sm text-gray-700">
                        Questions? Email us at{' '}
                        <a href="mailto:support@flightelevate.com" className="text-blue-700 hover:text-blue-800 font-semibold">
                          support@flightelevate.com
                        </a>
                      </p>
                    </div>
                  </div>
                </section>

                {/* Footer Actions */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Link
                      to="/login"
                      className="text-blue-700 hover:text-blue-800 font-medium flex items-center"
                    >
                      <FiArrowLeft className="mr-2" />
                      Back to Login
                    </Link>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Print Terms
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPolicy;