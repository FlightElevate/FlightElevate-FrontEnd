import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './flightelevate.css';

/* ------------------------------------------------------------------
   Shared site chrome: ATIS ribbon, primary nav, footer.
   Imported by LandingPage, About and UserPolicy so the three pages
   stay in sync.
   ------------------------------------------------------------------ */

/* Scrolling ATIS ribbon. `hi` renders in G1000 cyan, `go` in status green. */
const ATIS = [
  { label: 'KFLY ', hi: 'ATIS INFO KILO' },
  { label: '1755Z' },
  { label: 'WIND ', hi: '240/08' },
  { label: 'VIS ', hi: '10SM' },
  { label: 'CEIL ', hi: '4,500 SCT' },
  { label: 'ALT ', hi: '30.02' },
  { go: 'VFR' },
  { label: 'RWY ', hi: '24 IN USE' },
  { label: '12 AIRCRAFT ON SCHEDULE' },
  { label: '3 AIRBORNE' },
];

export const BrandMark = ({ className = 'fe-brand-mark' }) => (
  <svg className={className} viewBox="0 0 34 34" fill="none" aria-hidden="true">
    <rect x=".5" y=".5" width="33" height="33" rx="8" stroke="#17364F" />
    <path d="M7 22.5 L17 8 L27 22.5" stroke="#FFAD1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.5 22.5 L17 14.5 L22.5 22.5" stroke="#6FD3F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".75" />
    <path d="M9 26.5 H25" stroke="#17364F" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const AtisRibbon = () => {
  const group = (hidden) => (
    <div className="fe-atis-group" aria-hidden={hidden ? 'true' : undefined}>
      {ATIS.map((item, i) => (
        <span key={i}>
          {item.label}
          {item.hi ? <b>{item.hi}</b> : null}
          {item.go ? <i>{item.go}</i> : null}
        </span>
      ))}
    </div>
  );
  return (
    <div className="fe-atis">
      <div className="fe-atis-track">{group(false)}{group(true)}</div>
    </div>
  );
};

const NAV_LINKS = [
  { href: '/#loop', label: 'Operations' },
  { href: '/#roles', label: 'Platform' },
  { href: '/#fleet', label: 'Fleet' },
  { href: '/#roi', label: 'ROI' },
  { href: '/#roadmap', label: 'Roadmap' },
];

export const SiteNav = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fe-nav">
      <div className="fe-wrap fe-nav-in">
        <Link className="fe-brand" to="/">
          <BrandMark />
          <span className="fe-brand-text">Flight<em>Elevate</em></span>
        </Link>

        <div className="fe-nav-links">
          {NAV_LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          <Link to="/about">About</Link>
        </div>

        <div className="fe-nav-cta">
          <button className="fe-btn fe-btn-ghost fe-btn-sm fe-hide-sm" onClick={() => navigate('/login')}>
            Sign in
          </button>
          <button className="fe-btn fe-btn-primary fe-btn-sm" onClick={() => navigate('/register')}>
            Book a demo
          </button>
          <button
            className="fe-burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M0 1h16M0 6h16M0 11h16" stroke="#E8F1F7" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className={open ? 'fe-mobile open' : 'fe-mobile'}>
        <div className="fe-wrap">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <Link to="/about" onClick={() => setOpen(false)}>About</Link>
          <Link to="/user-policy" onClick={() => setOpen(false)}>User policy</Link>
          <div className="fe-mobile-cta">
            <button className="fe-btn fe-btn-ghost fe-btn-sm" onClick={() => { setOpen(false); navigate('/login'); }}>
              Sign in
            </button>
            <button className="fe-btn fe-btn-primary fe-btn-sm" onClick={() => { setOpen(false); navigate('/register'); }}>
              Book a demo
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export const SiteFooter = () => (
  <footer className="fe-foot">
    <div className="fe-wrap">
      <div className="fe-foot-grid">
        <div>
          <Link className="fe-brand" to="/">
            <BrandMark />
            <span className="fe-brand-text">Flight<em>Elevate</em></span>
          </Link>
          <p className="fe-foot-blurb">
            Flight school and flying club operations on one board. Built by aviation
            people, priced for the operators who actually need it.
          </p>
        </div>
        <div>
          <h5>Platform</h5>
          <ul>
            <li><a href="/#roles">Scheduling</a></li>
            <li><a href="/#fleet">Fleet &amp; maintenance</a></li>
            <li><a href="/#capabilities">Logbook</a></li>
            <li><a href="/#capabilities">Billing</a></li>
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><a href="/#roadmap">Roadmap</a></li>
            <li><a href="/#faq">FAQ</a></li>
            <li><a href="/#cta">Contact</a></li>
          </ul>
        </div>
        <div>
          <h5>Legal</h5>
          <ul>
            <li><Link to="/user-policy">User policy</Link></li>
            <li><Link to="/user-policy">Payment terms</Link></li>
            <li><Link to="/user-policy">Support SLA</Link></li>
          </ul>
        </div>
      </div>
      <div className="fe-foot-bottom">
        <span>&copy; {new Date().getFullYear()} FlightElevate &middot; All rights reserved</span>
        <span>Aviation operations software</span>
      </div>
    </div>
  </footer>
);

/* Adds the scroll-reveal class to any .fe-reveal element that enters view. */
export const useReveal = () => {
  React.useEffect(() => {
    const els = Array.from(document.querySelectorAll('.fe-reveal:not(.in)'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};
