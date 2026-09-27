import React from 'react';
import { SiteNav, SiteFooter, AtisRibbon, useReveal } from './SiteChrome';
import './flightelevate.css';

/* ==================================================================
   FlightElevate — about page
   ================================================================== */

const About = () => {
  useReveal();

  return (
    <div className="fe">
      <AtisRibbon />
      <SiteNav />

      <header className="fe-hero fe-about-hero">
        <div className="fe-hero-photo" style={{backgroundImage: 'url(\'https://images.unsplash.com/photo-1691394045643-aafd8e17deab?auto=format&fit=crop&w=2000&q=70\')'}}></div>
        <div className="fe-hero-veil"></div>
        <div className="fe-wrap" style={{position: 'relative', zIndex: '2'}}>
          <span className="fe-eyebrow">About FlightElevate</span>
          <h1>Built for the <em>runway ahead</em></h1>
          <p className="fe-lede">
            Purpose-designed software for flight schools and flying clubs — built from
            the operational experience of running them, not adapted from a generic
            business tool.
          </p>
        </div>
      </header>

      <section className="fe-stats">
        <div className="fe-wrap fe-stats-in">
          <div className="fe-stat"><b>61 <i>/</i> 141</b><span>Part-ready</span></div>
          <div className="fe-stat"><b>ATP</b><span>Certified founding pilot</span></div>
          <div className="fe-stat"><b>18<i>+</i></b><span>Months in development</span></div>
          <div className="fe-stat"><b>0</b><span>Generic workarounds</span></div>
        </div>
      </section>

      <section className="fe-section paper">
        <div className="fe-wrap fe-origin">
          <div className="fe-reveal">
            <span className="fe-eyebrow on-paper">Our origin</span>
            <h2 className="fe-h2" style={{margin: '18px 0 0'}}>Built by aviation people, for aviation people</h2>
          </div>
          <div className="fe-prose fe-reveal">
            <p>Flight training has long been underserved by its own software market. The tools that set the standard arrive with enterprise price tags, rigid annual contracts and commercial obligations that put them out of reach of independent instructors and small schools — the operators who need the operational support most.</p>
            <p>FlightElevate was built to close that gap. The platform was developed with the direct insight of an Airline Transport Pilot and former Assistant Chief Flight Instructor who spent years working around exactly those constraints. The goal was straightforward: deliver the scheduling, administrative and operational capability of premium flight training software, without the pricing and contractual structures that have historically excluded smaller operators.</p>
            <p>Whether you're an independent CFI managing your own students or a university-affiliated program running a structured curriculum, FlightElevate is designed to meet you where you are — built around real administrative pain points and workflows that reflect how flight training actually operates.</p>
            <div className="fe-badges">
              <span className="fe-badge">ATP certificate</span>
              <span className="fe-badge">Asst. chief flight instructor</span>
              <span className="fe-badge">Part 141 experience</span>
              <span className="fe-badge">5+ years on legacy tools</span>
            </div>
          </div>
        </div>
      </section>

      <section className="fe-section">
        <div className="fe-wrap">
          <div className="fe-head fe-reveal">
            <span className="fe-eyebrow">Leadership</span>
            <h2 className="fe-h2">The team guiding FlightElevate forward</h2>
          </div>

          <div className="fe-leader fe-reveal">
            <div className="fe-portrait">
              <div className="fe-portrait-face"><span>CS</span></div>
              <div className="fe-portrait-info">
                <b>Claude Sturla</b>
                <em>Managing partner</em>
                <div className="fe-badges" style={{marginTop: '16px'}}>
                  <span className="fe-badge dark">Fidelity Investments</span>
                  <span className="fe-badge dark">Merrill Lynch</span>
                </div>
              </div>
            </div>

            <div>
              <div className="fe-prose dark">
                <p>Claude Sturla brings financial planning, investment advisory and strategic business development experience to his role as Managing Partner. His career spans leading institutions including Fidelity Investments and Merrill Lynch, where he developed the strategic and operational perspective that now guides FlightElevate's growth, partnerships and market positioning.</p>
              </div>
              <div className="fe-expertise">
                <div className="fe-exp"><b>Financial planning</b><p>Institutional-grade financial discipline applied to sustainable SaaS growth.</p></div>
                <div className="fe-exp"><b>Strategic partnerships</b><p>Building the industry relationships that open doors for flight schools.</p></div>
                <div className="fe-exp"><b>Business development</b><p>Translating a technical product vision into a scalable market strategy.</p></div>
                <div className="fe-exp"><b>Investment advisory</b><p>Experience at leading institutions guiding long-term capital decisions.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fe-quote">
        <div className="fe-quote-photo" style={{backgroundImage: 'url(\'https://images.unsplash.com/photo-1678116984484-5d1032b75951?auto=format&fit=crop&w=2000&q=70\')'}}></div>
        <div className="fe-quote-veil"></div>
        <div className="fe-wrap fe-quote-in">
          <blockquote>We build the tool we wanted when we were <em>running the desk.</em></blockquote>
          <cite>The FlightElevate team</cite>
        </div>
      </section>




      <SiteFooter />
    </div>
  );
};

export default About;

