import React from 'react';
import { SiteNav, SiteFooter, AtisRibbon, useScrollTop } from './SiteChrome';
import './flightelevate.css';

/* ==================================================================
   FlightElevate — user policy / service & payment terms
   ================================================================== */

const UserPolicy = () => {
  useScrollTop();

  return (
  <div className="fe">
    <AtisRibbon />
    <SiteNav />

    <header className="fe-hero fe-about-hero" style={{paddingBottom: '48px'}}>
      <div className="fe-hero-veil"></div>
      <div className="fe-wrap" style={{position: 'relative', zIndex: '2'}}>
        <span className="fe-eyebrow">Service &amp; payment terms</span>
        <h1>User <em>policy</em></h1>
        <p className="fe-mono" style={{color: 'var(--fe-text-dim)', marginTop: '14px'}}>Version v2026.06.09 · Last updated 9 June 2026</p>
      </div>
    </header>

    <section className="fe-section" style={{paddingTop: '0'}}>
      <div className="fe-wrap fe-policy">
        <nav className="fe-toc">
          <a href="#c1">01 · Platform liability</a>
          <a href="#c2">02 · Stored payment data</a>
          <a href="#c3">03 · Wallets &amp; funds</a>
          <a href="#c4">04 · Subscription &amp; billing</a>
          <a href="#c5">05 · Support</a>
        </nav>

        <div>
          <article className="fe-clause" id="c1">
            <span className="fe-mono">Clause 01</span>
            <h3>Platform liability and Stripe integration</h3>
            <ul>
              <li>FlightElevate shall not be held liable for disputes arising from use of the platform.</li>
              <li>Payment processing is facilitated by Stripe Connect. FlightElevate does not store or process card information directly.</li>
              <li>We assist with transaction issues, including contacting Stripe for billing discrepancies or refund requests. Users remain responsible for entering accurate billing amounts and reviewing applicable taxes and fees before charging a customer.</li>
              <li>Users may request refunds through the Stripe portal integrated within the platform. Transaction fees associated with refunds or disputes are borne by the user.</li>
              <li>FlightElevate reserves the right to introduce or modify platform service fees should operational costs increase. Users will be notified in advance.</li>
            </ul>
          </article>

          <article className="fe-clause" id="c2">
            <span className="fe-mono">Clause 02</span>
            <h3>Stored payment information</h3>
            <ul>
              <li>Customer card details may be stored securely using Stripe's PCI-compliant tokenisation and vaulting services.</li>
              <li>FlightElevate does not access, use or manipulate stored card data for any purpose unrelated to platform operation.</li>
              <li>Access is limited to authorised personnel responding to transaction-related issues reported through the platform, strictly for resolving the specific issue and in accordance with applicable data protection law.</li>
            </ul>
          </article>

          <article className="fe-clause" id="c3">
            <span className="fe-mono">Clause 03</span>
            <h3>Wallet functionality and fund handling</h3>
            <ul>
              <li>Digital wallets, including individual wallets for students or end-users, are powered directly by Stripe.</li>
              <li>FlightElevate does not hold, store or access funds at any time. Transfers, deposits and disbursements are managed solely by Stripe.</li>
              <li>Use of this feature constitutes agreement to Stripe's terms and conditions.</li>
            </ul>
          </article>

          <article className="fe-clause" id="c4">
            <span className="fe-mono">Clause 04</span>
            <h3>Subscription charges and payment authorisation</h3>
            <ul>
              <li>The Client authorises FlightElevate to charge the payment method on file for subscription fees, applicable taxes and other charges associated with the selected plan.</li>
              <li>Fees are billed monthly unless otherwise specified. The Client maintains valid and current payment information.</li>
              <li>If a payment fails, FlightElevate may retry the charge, suspend access or terminate services. The Client remains responsible for balances incurred prior to suspension.</li>
              <li>Pricing may be modified for future billing periods with reasonable notice. Continued use after the effective date constitutes acceptance.</li>
            </ul>
          </article>

          <article className="fe-clause" id="c5">
            <span className="fe-mono">Clause 05</span>
            <h3>Support and response expectations</h3>
            <ul>
              <li>Support is currently provided through email communication.</li>
              <li>We make reasonable efforts to respond within 1–5 business days. Response times vary with issue severity, volume and holidays.</li>
              <li>Available support options may be modified or expanded at our discretion.</li>
            </ul>
          </article>
        </div>
      </div>
    </section>



    <SiteFooter />
  </div>
  );
};

export default UserPolicy;
