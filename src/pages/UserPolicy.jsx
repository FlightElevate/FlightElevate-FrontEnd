import React from 'react';
import { SiteNav, SiteFooter, AtisRibbon } from './SiteChrome';
import './flightelevate.css';

/* ==================================================================
   FlightElevate — user policy / service & payment terms
   Full 24-clause text carried over verbatim from the live version,
   restyled into the Night Ramp clause/TOC system.
   ================================================================== */

const Note = ({ label, color = 'var(--fe-amber)', children }) => (
  <div className="fe-panel" style={{ borderLeft: `3px solid ${color}`, marginTop: '18px' }}>
    <span className="fe-mono" style={{ display: 'block', fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color, marginBottom: '8px' }}>
      {label}
    </span>
    <p style={{ fontSize: '14px', color: 'var(--fe-text-mid)', lineHeight: 1.65 }}>{children}</p>
  </div>
);

const Clause = ({ no, id, title, children }) => (
  <article className="fe-clause" id={id}>
    <span className="fe-mono">Clause {no}</span>
    <h3>{title}</h3>
    {children}
  </article>
);

const UserPolicy = () => (
  <div className="fe">
    <AtisRibbon />
    <SiteNav />

    <header className="fe-hero fe-about-hero" style={{ paddingBottom: '48px' }}>
      <div className="fe-hero-veil"></div>
      <div className="fe-wrap" style={{ position: 'relative', zIndex: '2' }}>
        <span className="fe-eyebrow">Service &amp; payment terms</span>
        <h1>User <em>policy</em></h1>
        <p className="fe-mono" style={{ color: 'var(--fe-text-dim)', marginTop: '14px' }}>
          Version v2026.06.09 · Last updated 9 June 2026
        </p>
      </div>
    </header>

    <section className="fe-section" style={{ paddingTop: '0' }}>
      <div className="fe-wrap fe-policy">
        <nav className="fe-toc">
          <a href="#payment">01 · Payment processing</a>
          <a href="#wallet">02 · Digital wallet</a>
          <a href="#service">03 · Service agreement</a>
          <a href="#billing">04 · Billing authorization</a>
          <a href="#support">05 · Support</a>
          <a href="#availability">06 · Service availability</a>
          <a href="#compliance">07 · Data &amp; compliance</a>
          <a href="#legal">08 · Legal terms</a>
        </nav>

        <div>
          <Note label="Important notice" color="var(--fe-warn)">
            Please read these terms carefully before using FlightElevate. By creating an account or using our
            services, you agree to be bound by these terms and conditions.
          </Note>

          {/* ---- 1. Payment Processing group (clauses 1-4) ---- */}
          <Clause no="01" id="payment" title="Platform services">
            <p style={{ color: 'var(--fe-text-mid)', fontSize: '15px', lineHeight: 1.68 }}>
              FlightElevate provides a digital platform for scheduling, management, and billing services,
              including payment processing.
            </p>
          </Clause>

          <Clause no="02" title="Integration via Stripe Connect">
            <p style={{ color: 'var(--fe-text-mid)', fontSize: '15px', marginBottom: '10px' }}>Users agree that:</p>
            <ul>
              <li><strong>2.1</strong> FlightElevate shall not be held liable for any disputes arising from the use of the platform.</li>
              <li><strong>2.2</strong> All payment processing is facilitated by Stripe Connect. FlightElevate does not store or process card information directly.</li>
              <li><strong>2.3</strong> While we assist with transaction issues, including initiating contact with Stripe for billing discrepancies or refund requests, it is the responsibility of the user to input accurate billing amounts and review applicable taxes and fees before charging any customer.</li>
              <li><strong>2.4</strong> FlightElevate is not responsible for billing errors made by users or third parties. Users bear full responsibility for entering correct charges.</li>
              <li><strong>2.5</strong> Users may request refunds through the Stripe portal integrated within the platform. Any transaction fees associated with refunds or billing disputes will be borne by the user.</li>
              <li><strong>2.6</strong> FlightElevate reserves the right to introduce or modify platform service fees in the future, should operational costs increase. Users will be notified in advance of any changes.</li>
            </ul>
            <Note label="Development note" color="var(--fe-amber)">
              Billing module is currently under development. Full Stripe integration will be completed after
              initial platform deployment, as Stripe requires a live or staging environment for activation. Users
              will be notified once billing is fully operational.
            </Note>
          </Clause>

          <Clause no="03" title="Credit card &amp; transaction fees">
            <ul>
              <li><strong>3.1</strong> Credit card processing fees are determined by Stripe and may fluctuate based on Stripe's pricing or changes to FlightElevate's operational model.</li>
            </ul>
          </Clause>

          <Clause no="04" title="Card information storage and access">
            <ul>
              <li><strong>4.1</strong> FlightElevate may store customer card details securely within the platform using Stripe's PCI-compliant tokenization and vaulting services.</li>
              <li><strong>4.2</strong> FlightElevate does not directly access, use, or manipulate stored card data for any purpose unrelated to platform operation.</li>
              <li><strong>4.3</strong> Stored card information may only be accessed by authorized personnel in response to transaction-related issues reported through the platform, such as billing errors or payment disputes.</li>
              <li><strong>4.4</strong> All access is performed strictly for troubleshooting and resolving the specific issue at hand and will be handled in accordance with applicable data protection and privacy laws.</li>
              <li><strong>4.5</strong> Users acknowledge and consent to this limited use of stored payment information as a condition of using the platform's billing services.</li>
            </ul>
          </Clause>

          {/* ---- 2. Digital Wallet ---- */}
          <Clause no="05" id="wallet" title="Digital wallet &amp; funds handling">
            <ul>
              <li><strong>5.1</strong> FlightElevate offers digital wallet functionality, including the option to assign individual wallets to students or end-users.</li>
              <li><strong>5.2</strong> All digital wallet services are directly powered by Stripe. FlightElevate does not hold, store, or have access to funds at any time.</li>
              <li><strong>5.3</strong> Fund transfers, deposits, and disbursements are solely managed by Stripe. By using this feature, users agree to Stripe's terms and conditions.</li>
              <li><strong>5.4</strong> FlightElevate disclaims all liability regarding the holding, transferring, or disbursement of funds facilitated through the platform.</li>
            </ul>
          </Clause>

          {/* ---- 3. Service Agreement group (clauses 6-10) ---- */}
          <Clause no="06" id="service" title="Introduction">
            <p style={{ color: 'var(--fe-text-mid)', fontSize: '15px', lineHeight: 1.68 }}>
              This Service Agreement governs the use of the FlightElevate platform by flight schools, operators,
              instructors, and administrative users. By accessing or using the Platform, the Customer agrees to the
              terms outlined herein.
            </p>
          </Clause>

          <Clause no="07" title="Subscription plan">
            <p style={{ color: 'var(--fe-text-mid)', fontSize: '15px', lineHeight: 1.68 }}>
              FlightElevate provides access through subscription plans as outlined in the Pricing Schedule. Access
              is licensed, not sold, and is granted solely for operational use by the Customer.
            </p>
          </Clause>

          <Clause no="08" title="Customer responsibilities">
            <p style={{ color: 'var(--fe-text-mid)', fontSize: '15px', lineHeight: 1.68 }}>
              The Customer (Organization) is responsible for managing user access and permissions, maintaining the
              confidentiality of login credentials, ensuring compliance with applicable FAA, DGCA, Transport
              Canada, EASA, or other local regulatory requirements, and maintaining accurate operational, training,
              maintenance, financial, and safety records as required by applicable regulations and internal
              procedures. The Customer is responsible for verifying the accuracy of all data entered into the
              Platform and for ensuring that all scheduling, dispatch, maintenance, and operational decisions are
              reviewed and approved by appropriately authorized personnel. The Platform is intended as an
              administrative and operational support tool and does not replace regulatory oversight, operational
              control, or professional judgment.
            </p>
          </Clause>

          <Clause no="09" title="Services provided">
            <p style={{ color: 'var(--fe-text-mid)', fontSize: '15px', marginBottom: '10px' }}>
              FlightElevate is a cloud-based SaaS platform designed for flight schools, aviation training
              organizations, and related aviation operators. Services may include:
            </p>
            <ul>
              <li>Aircraft, simulator, instructor, and resource scheduling with calendar integration</li>
              <li>Student management, training records, billing, payment tracking, and account management</li>
              <li>Aircraft maintenance tracking, utilization monitoring, inspections, and reporting tools</li>
              <li>Employee and personnel management, including instructors, dispatchers, maintenance staff, and administrators</li>
              <li>Role-based access controls and customizable permissions</li>
              <li>Operational dashboards, reporting, notifications, and workflow automation tools</li>
              <li>Document storage, electronic recordkeeping, and administrative management features</li>
              <li>Communication tools, including email, SMS, push notifications, and other messaging capabilities where available</li>
              <li>Third-party integrations with payment processors, calendar services, weather providers, and aviation software</li>
              <li>Future enhancements including AI tools, voice assistants, compliance monitoring, risk assessment, dispatch support, and corporate aviation modules</li>
            </ul>
          </Clause>

          <Clause no="10" title="Platform updates">
            <ul>
              <li><strong>10.1</strong> FlightElevate follows a continuous improvement and iterative development model. The Platform may receive updates, feature enhancements, bug fixes, security patches, user interface improvements, workflow modifications, integrations, and other changes from time to time. Such updates may be deployed at FlightElevate's discretion and may occur without prior notice.</li>
              <li><strong>10.2</strong> FlightElevate may add, modify, replace, suspend, or discontinue features and functionality as part of ongoing product development, maintenance, security, regulatory support, and service improvement efforts. FlightElevate may also introduce new modules, services, integrations, or subscription tiers in the future. Access to such future features, products, or services may be subject to separate pricing, subscription plans, licensing terms, or eligibility requirements and are not included unless expressly stated in the Customer's active subscription plan.</li>
            </ul>
            <Note label="Early development phase" color="var(--fe-nav)">
              As a SaaS product in its early development phase, FlightElevate follows a continuous improvement
              model and is committed to delivering the best experience possible. We sincerely apologize for any
              inconvenience caused by early-stage technical challenges and appreciate your support as we grow.
            </Note>
          </Clause>

          {/* ---- 4. Billing Authorization ---- */}
          <Clause no="11" id="billing" title="Billing authorization">
            <ul>
              <li><strong>11.1</strong> The Client authorizes FlightElevate to charge the payment method on file for all subscription fees, applicable taxes, and other charges associated with the selected service plan.</li>
              <li><strong>11.2</strong> Subscription fees will be billed on a recurring monthly basis unless otherwise specified in a separate agreement or subscription plan. The Client is responsible for maintaining valid and current payment information.</li>
              <li><strong>11.3</strong> If a payment is declined, fails, or cannot be processed, FlightElevate may retry the charge, suspend access to the Platform, or terminate services in accordance with this Agreement. The Client remains responsible for all outstanding balances incurred prior to suspension or termination.</li>
              <li><strong>11.4</strong> FlightElevate may modify subscription pricing for future billing periods by providing reasonable notice to the Client. Continued use of the Platform after the effective date of the pricing change constitutes acceptance of the revised pricing.</li>
            </ul>
          </Clause>

          {/* ---- 5. Support ---- */}
          <Clause no="12" id="support" title="Support">
            <ul>
              <li><strong>12.1</strong> FlightElevate currently provides customer support through email communication.</li>
              <li><strong>12.2</strong> FlightElevate will make reasonable efforts to respond to support inquiries within 1–5 business days. Response times may vary depending on issue severity, support volume, holidays, and other operational factors.</li>
              <li><strong>12.3</strong> FlightElevate may modify or expand available support options at its discretion.</li>
            </ul>
          </Clause>

          {/* ---- 6. Service Availability group (clauses 13-14) ---- */}
          <Clause no="13" id="availability" title="Platform use disclaimer &amp; service commitment">
            <ul>
              <li><strong>13.1</strong> Students and instructors using the platform are considered part of the Client's organization. The Client is solely responsible for its employees' and students' actions on the platform. FlightElevate disclaims all liability for issues arising from their usage, including but not limited to errors, misuse, or negligence.</li>
              <li><strong>13.2</strong> FlightElevate is not responsible for any incidental or consequential damages that may result from the use of the platform. However, if technical issues occur, FlightElevate will make commercially reasonable efforts to resolve them as soon as they are identified. At our discretion, and based on the severity of the issue, we may provide partial or full refunds for the affected billing period.</li>
            </ul>
          </Clause>

          <Clause no="14" title="Availability &amp; hosting">
            <ul>
              <li><strong>14.1</strong> The Platform is provided on an "as-is" and "as-available" basis. FlightElevate does not guarantee uninterrupted, error-free, or continuous availability of the Platform.</li>
              <li><strong>14.2</strong> The Platform is hosted on third-party cloud infrastructure and service providers. Accordingly, service availability may be affected by outages, maintenance activities, network disruptions, or performance issues originating from such providers. FlightElevate is not liable for service interruptions resulting from the failure or unavailability of third-party services outside of FlightElevate's reasonable control.</li>
              <li><strong>14.3</strong> In the event of service interruptions, outages, or other disruptions, FlightElevate will make commercially reasonable efforts to investigate, mitigate, and restore services as promptly as practicable. FlightElevate does not guarantee uninterrupted service availability or immediate restoration following any outage or disruption.</li>
              <li><strong>14.4</strong> FlightElevate shall not be liable for any damages, losses, or operational impacts resulting from downtime, service interruptions, or delays in restoring access.</li>
              <li><strong>14.5</strong> Users acknowledge that temporary outages are inherent to cloud-based platforms and agree to use the Platform at their own discretion.</li>
              <li><strong>14.6</strong> The Customer acknowledges that the Platform may be in an early-release or scaling phase. During this period, occasional service interruptions or performance variations may occur.</li>
            </ul>
          </Clause>

          {/* ---- 7. Data & Compliance ---- */}
          <Clause no="15" id="compliance" title="Data retention &amp; regulatory compliance">
            <ul>
              <li><strong>15.1</strong> Users are responsible for maintaining any additional backups, records, documents, and operational data required by applicable laws, regulations, accreditation standards, or regulatory authorities.</li>
              <li><strong>15.2</strong> FlightElevate is not liable for data loss, service interruptions, or record unavailability resulting from third-party hosting providers, internet service disruptions, force majeure events, or other circumstances beyond FlightElevate's reasonable control.</li>
              <li><strong>15.3</strong> The Client and its users remain solely responsible for complying with all applicable aviation regulations, licensing requirements, training standards, maintenance requirements, recordkeeping obligations, and operational rules established by the FAA, DGCA, Transport Canada, EASA, or any other applicable regulatory authority having jurisdiction over their operations.</li>
              <li><strong>15.4</strong> Any alerts, reminders, notifications, expiration tracking tools, compliance indicators, reports, dispatch validations, artificial intelligence features, or other compliance-related functionality provided by FlightElevate are supplemental administrative tools. Such tools do not constitute legal, regulatory, operational, maintenance, or aviation compliance advice and must not be relied upon as the sole means of determining regulatory compliance, airworthiness, pilot eligibility, instructor qualifications, dispatch authorization, or operational readiness.</li>
              <li><strong>15.5</strong> The Client and its users are responsible for independently verifying compliance with all applicable regulatory requirements before conducting flight operations, training activities, maintenance activities, dispatch functions, or other regulated aviation activities.</li>
            </ul>
            <Note label="Data backup responsibility" color="var(--fe-warn)">
              Users are responsible for maintaining additional backups of operational records required by
              regulatory agencies. FlightElevate is not liable for data loss from hosting outages beyond our
              control.
            </Note>
          </Clause>

          {/* ---- 8. Legal Terms group (clauses 16-24) ---- */}
          <Clause no="16" id="legal" title="Limitation of liability">
            <ul>
              <li><strong>16.1</strong> To the fullest extent permitted by law, FlightElevate shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages arising from or relating to the use of, or inability to use, the Platform.</li>
              <li><strong>16.2</strong> To the fullest extent permitted by law, FlightElevate's total aggregate liability arising out of or relating to this Agreement shall not exceed the amount paid by the Client to FlightElevate during the 12 months preceding the event giving rise to the claim.</li>
            </ul>
          </Clause>

          <Clause no="17" title="Termination">
            <ul>
              <li><strong>17.1</strong> This Agreement may be terminated by either party with 30 days' written notice.</li>
              <li><strong>17.2</strong> FlightElevate may suspend or terminate access immediately if the Client violates this Agreement, engages in unlawful activity, compromises platform security, or fails to pay applicable fees.</li>
              <li><strong>17.3</strong> Any fees owed up to the effective termination date shall remain payable and are non-refundable unless otherwise required by law.</li>
            </ul>
          </Clause>

          <Clause no="18" title="Governing law">
            <p style={{ color: 'var(--fe-text-mid)', fontSize: '15px', lineHeight: 1.68 }}>
              This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in
              which FlightElevate's operating entity is organized and conducts business, without regard to
              conflict of law principles.
            </p>
          </Clause>

          <Clause no="19" title="Ownership of data">
            <ul>
              <li><strong>19.1</strong> The Client retains ownership of all data, records, documents, and information submitted to or stored within the Platform by the Client and its authorized users ("Client Data").</li>
              <li><strong>19.2</strong> The Client grants FlightElevate a limited right to host, store, process, transmit, and display Client Data solely for the purpose of operating, maintaining, securing, supporting, and improving the Platform.</li>
              <li><strong>19.3</strong> The Client is responsible for ensuring that it has all necessary rights and permissions to upload, store, and process Client Data through the Platform.</li>
            </ul>
          </Clause>

          <Clause no="20" title="Intellectual property rights">
            <ul>
              <li><strong>20.1</strong> FlightElevate and its licensors retain all rights, title, and interest in and to the Platform, including all software, source code, object code, user interfaces, designs, documentation, trademarks, logos, workflows, features, enhancements, and related intellectual property.</li>
              <li><strong>20.2</strong> Except for the limited right to access and use the Platform under this Agreement, no ownership rights, licenses, or intellectual property rights are transferred to the Client.</li>
              <li><strong>20.3</strong> Any suggestions, feedback, recommendations, or enhancement requests provided by the Client may be used by FlightElevate without restriction or obligation.</li>
            </ul>
          </Clause>

          <Clause no="21" title="Privacy">
            <ul>
              <li><strong>21.1</strong> FlightElevate collects, stores, and processes information necessary to provide, maintain, secure, and improve the Platform.</li>
              <li><strong>21.2</strong> The Client represents and warrants that it has obtained all necessary rights, permissions, and consents required to upload, store, and process information through the Platform.</li>
              <li><strong>21.3</strong> FlightElevate will implement commercially reasonable administrative, technical, and organizational measures designed to protect Client Data from unauthorized access, use, disclosure, or destruction.</li>
              <li><strong>21.4</strong> FlightElevate may use aggregated, anonymized, or de-identified data for analytics, service improvement, product development, and business operations, provided such data does not identify the Client or any individual user.</li>
              <li><strong>21.5</strong> Use of the Platform is also subject to FlightElevate's Privacy Policy, which may be updated from time to time.</li>
            </ul>
          </Clause>

          <Clause no="22" title="Acceptable use">
            <ul>
              <li><strong>22.1</strong> The Client and its authorized users shall use the Platform only for lawful purposes and in accordance with this Agreement.</li>
              <li><strong>22.2</strong> The Client shall not, and shall not permit any user to: (a) attempt to gain unauthorized access to the Platform, its systems, networks, or data; (b) interfere with or disrupt the operation, security, or availability of the Platform; (c) upload, transmit, or distribute malicious code, viruses, malware, or other harmful materials; (d) use the Platform in violation of any applicable law, regulation, or third-party rights; (e) copy, modify, reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Platform, except to the extent such restriction is prohibited by applicable law; (f) use the Platform in a manner that could impair, damage, or overburden the Platform or its underlying infrastructure.</li>
              <li><strong>22.3</strong> FlightElevate may suspend or terminate access to the Platform if it reasonably believes the Client or any user has violated this Section.</li>
            </ul>
          </Clause>

          <Clause no="23" title="Electronic communications">
            <ul>
              <li><strong>23.1</strong> The Client agrees to receive notices, invoices, service updates, account information, and other communications from FlightElevate electronically, including through email, the Platform, or other electronic means.</li>
              <li><strong>23.2</strong> The Client is responsible for maintaining accurate and current contact information and for monitoring communications sent by FlightElevate.</li>
              <li><strong>23.3</strong> Electronic communications from FlightElevate shall satisfy any legal requirement that such communications be provided in writing, to the extent permitted by applicable law.</li>
            </ul>
          </Clause>

          <Clause no="24" title="Entire agreement">
            <ul>
              <li><strong>24.1</strong> This Agreement constitutes the entire agreement between the parties regarding the Platform and supersedes all prior or contemporaneous discussions, proposals, representations, understandings, and agreements relating to its subject matter.</li>
              <li><strong>24.2</strong> No waiver, modification, or amendment of this Agreement shall be effective unless made in writing by FlightElevate or otherwise permitted through the Platform.</li>
              <li><strong>24.3</strong> If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</li>
            </ul>
          </Clause>

          {/* ---- Contact ---- */}
          <div style={{ paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <p className="fe-mono" style={{ fontSize: '13px', color: 'var(--fe-text-mid)' }}>
              Questions? Email{' '}
              <a href="mailto:support@flightelevate.com" style={{ color: 'var(--fe-amber)' }}>
                support@flightelevate.com
              </a>
            </p>
            <button
              onClick={() => window.print()}
              className="fe-btn fe-btn-ghost fe-btn-sm"
            >
              Print terms
            </button>
          </div>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default UserPolicy;
