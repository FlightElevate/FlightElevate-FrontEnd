Userpolicy · JSX
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiShield,
  FiCreditCard,
  FiServer,
  FiAlertCircle,
  FiUsers,
  FiDollarSign,
  FiHeadphones,
  FiLock,
  FiFileText,
  FiGlobe,
} from 'react-icons/fi';
 
const UserPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
 
  const sections = [
    { id: 'payment', title: 'Payment Processing', icon: FiCreditCard },
    { id: 'wallet', title: 'Digital Wallet', icon: FiDollarSign },
    { id: 'service', title: 'Service Agreement', icon: FiShield },
    { id: 'billing', title: 'Billing Authorization', icon: FiCreditCard },
    { id: 'support', title: 'Support', icon: FiHeadphones },
    { id: 'availability', title: 'Service Availability', icon: FiServer },
    { id: 'compliance', title: 'Data & Compliance', icon: FiUsers },
    { id: 'legal', title: 'Legal Terms', icon: FiFileText },
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
          <p className="text-blue-100">FlightElevate SaaS Service & Payment Terms</p>
          <p className="text-sm text-blue-200 mt-2">Version v2026.06.09 - Last Updated: June 9, 2026</p>
        </div>
      </div>
 
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-5 sticky top-4">
              <h3 className="text-xs font-bold text-gray-900 mb-5 uppercase tracking-widest">Quick Navigation</h3>
              <nav className="space-y-5">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-3 text-gray-800 hover:text-blue-700 transition-colors group"
                    >
                      <span className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 group-hover:border-blue-400 group-hover:text-blue-700 transition-colors flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-base font-medium">{section.title}</span>
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
                          <span>While we assist with transaction issues, including initiating contact with Stripe for billing discrepancies or refund requests, it is the responsibility of the user to input accurate billing amounts and review applicable taxes and fees before charging any customer.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2 min-w-[60px]">1.2.4</span>
                          <span>FlightElevate is not responsible for billing errors made by users or third parties. Users bear full responsibility for entering correct charges.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2 min-w-[60px]">1.2.5</span>
                          <span>Users may request refunds through the Stripe portal integrated within the platform. Any transaction fees associated with refunds or billing disputes will be borne by the user.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2 min-w-[60px]">1.2.6</span>
                          <span>FlightElevate reserves the right to introduce or modify platform service fees in the future, should operational costs increase. Users will be notified in advance of any changes.</span>
                        </li>
                      </ul>
                    </div>
 
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <strong className="text-yellow-900">Development Note:</strong> Billing module is currently under development. Full Stripe integration will be completed after initial platform deployment, as Stripe requires a live or staging environment for activation. Users will be notified once billing is fully operational.
                      </p>
                    </div>
 
                    <div className="border-l-4 border-blue-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Credit Card & Transaction Fees</h3>
                      <p className="text-gray-700"><strong>3.1</strong> Credit card processing fees are determined by Stripe and may fluctuate based on Stripe's pricing or changes to FlightElevate's operational model.</p>
                    </div>
 
                    <div className="border-l-4 border-blue-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Card Information Storage and Access</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2">4.1</span>
                          <span>FlightElevate may store customer card details securely within the platform using Stripe's PCI-compliant tokenization and vaulting services.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2">4.2</span>
                          <span>FlightElevate does not directly access, use, or manipulate stored card data for any purpose unrelated to platform operation.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2">4.3</span>
                          <span>Stored card information may only be accessed by authorized personnel in response to transaction-related issues reported through the platform, such as billing errors or payment disputes.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2">4.4</span>
                          <span>All access is performed strictly for troubleshooting and resolving the specific issue at hand and will be handled in accordance with applicable data protection and privacy laws.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-blue-700 mr-2">4.5</span>
                          <span>Users acknowledge and consent to this limited use of stored payment information as a condition of using the platform's billing services.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
 
                {/* Digital Wallet */}
                <section id="wallet" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <FiDollarSign className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Digital Wallet & Funds Handling</h2>
                      <p className="text-sm text-gray-600">Wallet functionality and fund handling</p>
                    </div>
                  </div>
 
                  <div className="border-l-4 border-green-200 pl-6">
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="font-semibold text-green-700 mr-2 min-w-[36px]">2.1</span>
                        <span>FlightElevate offers digital wallet functionality, including the option to assign individual wallets to students or end-users.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-green-700 mr-2 min-w-[36px]">2.2</span>
                        <span>All digital wallet services are directly powered by Stripe. FlightElevate does not hold, store, or have access to funds at any time.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-green-700 mr-2 min-w-[36px]">2.3</span>
                        <span>Fund transfers, deposits, and disbursements are solely managed by Stripe. By using this feature, users agree to Stripe's terms and conditions.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-green-700 mr-2 min-w-[36px]">2.4</span>
                        <span>FlightElevate disclaims all liability regarding the holding, transferring, or disbursement of funds facilitated through the platform.</span>
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
                      <p className="text-sm text-gray-600">Terms of service, subscription, and responsibilities</p>
                    </div>
                  </div>
 
                  <div className="space-y-6">
                    <div className="border-l-4 border-purple-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h3>
                      <p className="text-gray-700">
                        This Service Agreement governs the use of the FlightElevate platform by flight schools, operators, instructors, and administrative users. By accessing or using the Platform, the Customer agrees to the terms outlined herein.
                      </p>
                    </div>
 
                    <div className="border-l-4 border-purple-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Subscription Plan</h3>
                      <p className="text-gray-700">
                        FlightElevate provides access through subscription plans as outlined in the Pricing Schedule. Access is licensed, not sold, and is granted solely for operational use by the Customer.
                      </p>
                    </div>
 
                    <div className="border-l-4 border-purple-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Customer Responsibilities</h3>
                      <p className="text-gray-700">
                        The Customer (Organization) is responsible for managing user access and permissions, maintaining the confidentiality of login credentials, ensuring compliance with applicable FAA, DGCA, Transport Canada, EASA, or other local regulatory requirements, and maintaining accurate operational, training, maintenance, financial, and safety records as required by applicable regulations and internal procedures. The Customer is responsible for verifying the accuracy of all data entered into the Platform and for ensuring that all scheduling, dispatch, maintenance, and operational decisions are reviewed and approved by appropriately authorized personnel. The Platform is intended as an administrative and operational support tool and does not replace regulatory oversight, operational control, or professional judgment.
                      </p>
                    </div>
 
                    <div className="border-l-4 border-purple-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Services Provided</h3>
                      <p className="text-gray-700 mb-3">
                        FlightElevate is a cloud-based SaaS platform designed for flight schools, aviation training organizations, and related aviation operators. Services may include:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          'Aircraft, simulator, instructor, and resource scheduling with calendar integration',
                          'Student management, training records, billing, payment tracking, and account management',
                          'Aircraft maintenance tracking, utilization monitoring, inspections, and reporting tools',
                          'Employee and personnel management, including instructors, dispatchers, maintenance staff, and administrators',
                          'Role-based access controls and customizable permissions',
                          'Operational dashboards, reporting, notifications, and workflow automation tools',
                          'Document storage, electronic recordkeeping, and administrative management features',
                          'Communication tools, including email, SMS, push notifications, and other messaging capabilities where available',
                          'Third-party integrations with payment processors, calendar services, weather providers, and aviation software',
                          'Future enhancements including AI tools, voice assistants, compliance monitoring, risk assessment, dispatch support, and corporate aviation modules',
                        ].map((item, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-purple-600 mr-2">✓</span>
                            <span className="text-gray-700 text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
 
                    <div className="border-l-4 border-purple-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Platform Updates</h3>
                      <p className="text-gray-700 mb-2">
                        <strong>5.1</strong> FlightElevate follows a continuous improvement and iterative development model. The Platform may receive updates, feature enhancements, bug fixes, security patches, user interface improvements, workflow modifications, integrations, and other changes from time to time. Such updates may be deployed at FlightElevate's discretion and may occur without prior notice.
                      </p>
                      <p className="text-gray-700">
                        <strong>5.2</strong> FlightElevate may add, modify, replace, suspend, or discontinue features and functionality as part of ongoing product development, maintenance, security, regulatory support, and service improvement efforts. FlightElevate may also introduce new modules, services, integrations, or subscription tiers in the future. Access to such future features, products, or services may be subject to separate pricing, subscription plans, licensing terms, or eligibility requirements and are not included unless expressly stated in the Customer's active subscription plan.
                      </p>
                    </div>
 
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <strong className="text-blue-900">Early Development Phase:</strong> As a SaaS product in its early development phase, FlightElevate follows a continuous improvement model and is committed to delivering the best experience possible. We sincerely apologize for any inconvenience caused by early-stage technical challenges and appreciate your support as we grow.
                      </p>
                    </div>
                  </div>
                </section>
 
                {/* Billing Authorization */}
                <section id="billing" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <FiCreditCard className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Billing Authorization</h2>
                      <p className="text-sm text-gray-600">Subscription charges and payment authorization</p>
                    </div>
                  </div>
 
                  <div className="border-l-4 border-blue-200 pl-6">
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="font-semibold text-blue-700 mr-2 min-w-[36px]">6.1</span>
                        <span>The Client authorizes FlightElevate to charge the payment method on file for all subscription fees, applicable taxes, and other charges associated with the selected service plan.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-blue-700 mr-2 min-w-[36px]">6.2</span>
                        <span>Subscription fees will be billed on a recurring monthly basis unless otherwise specified in a separate agreement or subscription plan. The Client is responsible for maintaining valid and current payment information.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-blue-700 mr-2 min-w-[36px]">6.3</span>
                        <span>If a payment is declined, fails, or cannot be processed, FlightElevate may retry the charge, suspend access to the Platform, or terminate services in accordance with this Agreement. The Client remains responsible for all outstanding balances incurred prior to suspension or termination.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-blue-700 mr-2 min-w-[36px]">6.4</span>
                        <span>FlightElevate may modify subscription pricing for future billing periods by providing reasonable notice to the Client. Continued use of the Platform after the effective date of the pricing change constitutes acceptance of the revised pricing.</span>
                      </li>
                    </ul>
                  </div>
                </section>
 
                {/* Support */}
                <section id="support" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <FiHeadphones className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Support</h2>
                      <p className="text-sm text-gray-600">How to reach us and response expectations</p>
                    </div>
                  </div>
 
                  <div className="border-l-4 border-green-200 pl-6">
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="font-semibold text-green-700 mr-2 min-w-[36px]">7.1</span>
                        <span>FlightElevate currently provides customer support through email communication.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-green-700 mr-2 min-w-[36px]">7.2</span>
                        <span>FlightElevate will make reasonable efforts to respond to support inquiries within 1–5 business days. Response times may vary depending on issue severity, support volume, holidays, and other operational factors.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-green-700 mr-2 min-w-[36px]">7.3</span>
                        <span>FlightElevate may modify or expand available support options at its discretion.</span>
                      </li>
                    </ul>
                  </div>
                </section>
 
                {/* Service Availability */}
                <section id="availability" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                      <FiServer className="w-5 h-5 text-orange-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Service Availability, Downtime & Hosting</h2>
                      <p className="text-sm text-gray-600">Uptime, hosting, and platform use disclaimers</p>
                    </div>
                  </div>
 
                  <div className="space-y-6">
                    <div className="border-l-4 border-orange-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Platform Use Disclaimer & Service Commitment</h3>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2 min-w-[36px]">8.1</span>
                          <span>Students and instructors using the platform are considered part of the Client's organization. The Client is solely responsible for its employees' and students' actions on the platform. FlightElevate disclaims all liability for issues arising from their usage, including but not limited to errors, misuse, or negligence.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2 min-w-[36px]">8.2</span>
                          <span>FlightElevate is not responsible for any incidental or consequential damages that may result from the use of the platform. However, if technical issues occur, FlightElevate will make commercially reasonable efforts to resolve them as soon as they are identified. At our discretion, and based on the severity of the issue, we may provide partial or full refunds for the affected billing period.</span>
                        </li>
                      </ul>
                    </div>
 
                    <div className="border-l-4 border-orange-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Availability & Hosting</h3>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2 min-w-[36px]">9.1</span>
                          <span>The Platform is provided on an 'as-is' and 'as-available' basis. FlightElevate does not guarantee uninterrupted, error-free, or continuous availability of the Platform.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2 min-w-[36px]">9.2</span>
                          <span>The Platform is hosted on third-party cloud infrastructure and service providers. Accordingly, service availability may be affected by outages, maintenance activities, network disruptions, or performance issues originating from such providers. FlightElevate is not liable for service interruptions resulting from the failure or unavailability of third-party services outside of FlightElevate's reasonable control.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2 min-w-[36px]">9.3</span>
                          <span>In the event of service interruptions, outages, or other disruptions, FlightElevate will make commercially reasonable efforts to investigate, mitigate, and restore services as promptly as practicable. FlightElevate does not guarantee uninterrupted service availability or immediate restoration following any outage or disruption.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2 min-w-[36px]">9.4</span>
                          <span>FlightElevate shall not be liable for any damages, losses, or operational impacts resulting from downtime, service interruptions, or delays in restoring access.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2 min-w-[36px]">9.5</span>
                          <span>Users acknowledge that temporary outages are inherent to cloud-based platforms and agree to use the Platform at their own discretion.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-orange-700 mr-2 min-w-[36px]">9.6</span>
                          <span>The Customer acknowledges that the Platform may be in an early-release or scaling phase. During this period, occasional service interruptions or performance variations may occur.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
 
                {/* Data & Compliance */}
                <section id="compliance" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                      <FiUsers className="w-5 h-5 text-red-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Data Retention & Regulatory Compliance</h2>
                      <p className="text-sm text-gray-600">Recordkeeping and regulatory responsibility</p>
                    </div>
                  </div>
 
                  <div className="border-l-4 border-red-200 pl-6">
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="font-semibold text-red-700 mr-2 min-w-[36px]">10.1</span>
                        <span>Users are responsible for maintaining any additional backups, records, documents, and operational data required by applicable laws, regulations, accreditation standards, or regulatory authorities.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-red-700 mr-2 min-w-[36px]">10.2</span>
                        <span>FlightElevate is not liable for data loss, service interruptions, or record unavailability resulting from third-party hosting providers, internet service disruptions, force majeure events, or other circumstances beyond FlightElevate's reasonable control.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-red-700 mr-2 min-w-[36px]">10.3</span>
                        <span>The Client and its users remain solely responsible for complying with all applicable aviation regulations, licensing requirements, training standards, maintenance requirements, recordkeeping obligations, and operational rules established by the FAA, DGCA, Transport Canada, EASA, or any other applicable regulatory authority having jurisdiction over their operations.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-red-700 mr-2 min-w-[36px]">10.4</span>
                        <span>Any alerts, reminders, notifications, expiration tracking tools, compliance indicators, reports, dispatch validations, artificial intelligence features, or other compliance-related functionality provided by FlightElevate are supplemental administrative tools. Such tools do not constitute legal, regulatory, operational, maintenance, or aviation compliance advice and must not be relied upon as the sole means of determining regulatory compliance, airworthiness, pilot eligibility, instructor qualifications, dispatch authorization, or operational readiness.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-red-700 mr-2 min-w-[36px]">10.5</span>
                        <span>The Client and its users are responsible for independently verifying compliance with all applicable regulatory requirements before conducting flight operations, training activities, maintenance activities, dispatch functions, or other regulated aviation activities.</span>
                      </li>
                    </ul>
                  </div>
 
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-red-900 mb-2">Data Backup Responsibility</h4>
                    <p className="text-sm text-red-800">
                      Users are responsible for maintaining additional backups of operational records required by regulatory agencies. FlightElevate is not liable for data loss from hosting outages beyond our control.
                    </p>
                  </div>
                </section>
 
                {/* Legal Terms */}
                <section id="legal" className="mb-12 scroll-mt-4">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                      <FiFileText className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Legal Terms</h2>
                      <p className="text-sm text-gray-600">Liability, termination, ownership, privacy, and acceptable use</p>
                    </div>
                  </div>
 
                  <div className="space-y-6">
                    <div className="border-l-4 border-indigo-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Limitation of Liability</h3>
                      <p className="text-gray-700 mb-2"><strong>11.1</strong> To the fullest extent permitted by law, FlightElevate shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages arising from or relating to the use of, or inability to use, the Platform.</p>
                      <p className="text-gray-700"><strong>11.2</strong> To the fullest extent permitted by law, FlightElevate's total aggregate liability arising out of or relating to this Agreement shall not exceed the amount paid by the Client to FlightElevate during the 12 months preceding the event giving rise to the claim.</p>
                    </div>
 
                    <div className="border-l-4 border-indigo-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">12. Termination</h3>
                      <p className="text-gray-700 mb-2"><strong>12.1</strong> This Agreement may be terminated by either party with 30 days' written notice.</p>
                      <p className="text-gray-700 mb-2"><strong>12.2</strong> FlightElevate may suspend or terminate access immediately if the Client violates this Agreement, engages in unlawful activity, compromises platform security, or fails to pay applicable fees.</p>
                      <p className="text-gray-700"><strong>12.3</strong> Any fees owed up to the effective termination date shall remain payable and are non-refundable unless otherwise required by law.</p>
                    </div>
 
                    <div className="border-l-4 border-indigo-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">13. Governing Law</h3>
                      <p className="text-gray-700">
                        This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which FlightElevate's operating entity is organized and conducts business, without regard to conflict of law principles.
                      </p>
                    </div>
 
                    <div className="border-l-4 border-indigo-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">14. Ownership of Data</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">14.1</span><span>The Client retains ownership of all data, records, documents, and information submitted to or stored within the Platform by the Client and its authorized users ("Client Data").</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">14.2</span><span>The Client grants FlightElevate a limited right to host, store, process, transmit, and display Client Data solely for the purpose of operating, maintaining, securing, supporting, and improving the Platform.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">14.3</span><span>The Client is responsible for ensuring that it has all necessary rights and permissions to upload, store, and process Client Data through the Platform.</span></li>
                      </ul>
                    </div>
 
                    <div className="border-l-4 border-indigo-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">15. Intellectual Property Rights</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">15.1</span><span>FlightElevate and its licensors retain all rights, title, and interest in and to the Platform, including all software, source code, object code, user interfaces, designs, documentation, trademarks, logos, workflows, features, enhancements, and related intellectual property.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">15.2</span><span>Except for the limited right to access and use the Platform under this Agreement, no ownership rights, licenses, or intellectual property rights are transferred to the Client.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">15.3</span><span>Any suggestions, feedback, recommendations, or enhancement requests provided by the Client may be used by FlightElevate without restriction or obligation.</span></li>
                      </ul>
                    </div>
 
                    <div className="border-l-4 border-indigo-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FiLock className="w-4 h-4 text-indigo-700" /> 16. Privacy
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">16.1</span><span>FlightElevate collects, stores, and processes information necessary to provide, maintain, secure, and improve the Platform.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">16.2</span><span>The Client represents and warrants that it has obtained all necessary rights, permissions, and consents required to upload, store, and process information through the Platform.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">16.3</span><span>FlightElevate will implement commercially reasonable administrative, technical, and organizational measures designed to protect Client Data from unauthorized access, use, disclosure, or destruction.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">16.4</span><span>FlightElevate may use aggregated, anonymized, or de-identified data for analytics, service improvement, product development, and business operations, provided such data does not identify the Client or any individual user.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">16.5</span><span>Use of the Platform is also subject to FlightElevate's Privacy Policy, which may be updated from time to time.</span></li>
                      </ul>
                    </div>
 
                    <div className="border-l-4 border-indigo-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">17. Acceptable Use</h3>
                      <p className="text-gray-700 mb-2"><strong>17.1</strong> The Client and its authorized users shall use the Platform only for lawful purposes and in accordance with this Agreement.</p>
                      <p className="text-gray-700 mb-2"><strong>17.2</strong> The Client shall not, and shall not permit any user to:</p>
                      <ul className="space-y-2 text-gray-700 ml-4">
                        <li>(a) attempt to gain unauthorized access to the Platform, its systems, networks, or data;</li>
                        <li>(b) interfere with or disrupt the operation, security, or availability of the Platform;</li>
                        <li>(c) upload, transmit, or distribute malicious code, viruses, malware, or other harmful materials;</li>
                        <li>(d) use the Platform in violation of any applicable law, regulation, or third-party rights;</li>
                        <li>(e) copy, modify, reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Platform, except to the extent such restriction is prohibited by applicable law;</li>
                        <li>(f) use the Platform in a manner that could impair, damage, or overburden the Platform or its underlying infrastructure.</li>
                      </ul>
                      <p className="text-gray-700 mt-2"><strong>17.3</strong> FlightElevate may suspend or terminate access to the Platform if it reasonably believes the Client or any user has violated this Section.</p>
                    </div>
 
                    <div className="border-l-4 border-indigo-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FiGlobe className="w-4 h-4 text-indigo-700" /> 18. Electronic Communications
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">18.1</span><span>The Client agrees to receive notices, invoices, service updates, account information, and other communications from FlightElevate electronically, including through email, the Platform, or other electronic means.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">18.2</span><span>The Client is responsible for maintaining accurate and current contact information and for monitoring communications sent by FlightElevate.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">18.3</span><span>Electronic communications from FlightElevate shall satisfy any legal requirement that such communications be provided in writing, to the extent permitted by applicable law.</span></li>
                      </ul>
                    </div>
 
                    <div className="border-l-4 border-indigo-200 pl-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">19. Entire Agreement</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">19.1</span><span>This Agreement constitutes the entire agreement between the parties regarding the Platform and supersedes all prior or contemporaneous discussions, proposals, representations, understandings, and agreements relating to its subject matter.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">19.2</span><span>No waiver, modification, or amendment of this Agreement shall be effective unless made in writing by FlightElevate or otherwise permitted through the Platform.</span></li>
                        <li className="flex items-start"><span className="font-semibold text-indigo-700 mr-2">19.3</span><span>If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</span></li>
                      </ul>
                    </div>
                  </div>
                </section>
 
                {/* Additional Terms / Contact */}
                <section className="border-t border-gray-200 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
 
