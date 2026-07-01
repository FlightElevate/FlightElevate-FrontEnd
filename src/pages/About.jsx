import React from "react";

const styles = `
  .about-page *, .about-page *::before, .about-page *::after {
    box-sizing: border-box;
  }
  .about-page {
    font-family: 'Inter', sans-serif;
    background: #ffffff;
    color: #000000;
    -webkit-font-smoothing: antialiased;
    color-scheme: light;
  }

  /* HERO */
  .about-hero {
    position: relative;
    background: #0F2E5A;
    overflow: hidden;
    padding: 120px 40px 100px;
    text-align: center;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
  }
  .about-runway-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(143,168,200,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(143,168,200,0.07) 1px, transparent 1px);
    background-size: 60px 60px;
    transform: perspective(600px) rotateX(38deg) scaleX(1.4);
    transform-origin: center 80%;
    pointer-events: none;
  }
  .about-runway-center {
    position: absolute;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 3px; height: 100%;
    background: linear-gradient(to top, rgba(143,168,200,0.5), transparent 60%);
    pointer-events: none;
  }
  .about-horizon-glow {
    position: absolute;
    bottom: 20%; left: 50%;
    transform: translateX(-50%);
    width: 500px; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(143,168,200,0.4), transparent);
    filter: blur(2px);
    pointer-events: none;
  }
  .about-hero-content {
    position: relative;
    z-index: 2;
    max-width: 720px;
    margin: 0 auto;
  }
  .about-hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #8FA8C8;
    margin-bottom: 28px;
  }
  .about-hero h1 {
    font-family: 'Georgia', serif;
    font-size: clamp(42px, 6vw, 72px);
    font-weight: 400;
    color: #ffffff;
    line-height: 1.08;
    margin-bottom: 24px;
  }
  .about-hero h1 em {
    font-style: italic;
    color: #C8D9EC;
  }
  .about-hero-sub {
    font-size: 17px;
    font-weight: 400;
    color: #C8D9EC;
    line-height: 1.65;
    max-width: 560px;
    margin: 0 auto;
  }

  /* STATS STRIP */
  .about-mission {
    background: #1B4F9B;
    padding: 56px 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 60px;
    flex-wrap: wrap;
  }
  .about-mission-stat { text-align: center; }
  .about-mission-stat .about-num {
    font-family: 'Georgia', serif;
    font-size: 40px;
    line-height: 1;
    color: #ffffff;
  }
  .about-mission-stat .about-label {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #C8D9EC;
    margin-top: 6px;
  }
  .about-mission-divider {
    width: 1px; height: 48px;
    background: rgba(255,255,255,0.2);
  }

  /* CONTAINER */
  .about-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 40px;
  }

  /* BUILT SECTION */
  .about-built-section { padding: 100px 0 80px; }
  .about-built-single { max-width: 720px; }

  .about-section-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #1B4F9B;
    margin-bottom: 20px;
  }
  .about-section-title {
    font-family: 'Georgia', serif;
    font-size: clamp(30px, 4vw, 46px);
    font-weight: 400;
    color: #000000 !important;
    line-height: 1.18;
    margin-bottom: 28px;
    max-width: 520px;
  }
  .about-section-body {
    font-size: 16px;
    font-weight: 400;
    color: #000000 !important;
    line-height: 1.75;
    max-width: 680px;
  }

  /* CREDENTIALS */
  .about-credentials {
    margin-top: 40px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .about-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border-radius: 40px;
    border: 1px solid rgba(27,79,155,0.2);
    background: #ffffff;
    font-size: 12px;
    font-weight: 500;
    color: #1B4F9B !important;
  }

  /* RULE */
  .about-section-rule {
    border: none;
    border-top: 1px solid rgba(27,79,155,0.15);
    margin: 0;
  }

  /* LEADERSHIP */
  .about-leadership-section { padding: 80px 0 100px; }
  .about-leadership-layout {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 80px;
    align-items: start;
    margin-top: 60px;
  }
  .about-portrait-card {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(27,79,155,0.10);
    border: 1px solid rgba(27,79,155,0.15);
  }
  .about-portrait-bg {
    background: linear-gradient(135deg, #0F2E5A 0%, #1B4F9B 100%);
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .about-portrait-initials {
    width: 88px; height: 88px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: 2px solid rgba(255,255,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Georgia', serif;
    font-size: 32px;
    color: #ffffff;
    position: relative;
    z-index: 1;
  }
  .about-portrait-info { padding: 28px; }
  .about-portrait-name {
    font-family: 'Georgia', serif;
    font-size: 22px;
    color: #000000 !important;
    margin-bottom: 4px;
  }
  .about-portrait-role {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #1B4F9B !important;
    margin-bottom: 20px;
  }
  .about-portrait-firms {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .about-firm-tag {
    font-size: 12px;
    color: #000000 !important;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .about-firm-tag::before {
    content: '';
    display: block;
    width: 20px; height: 1px;
    background: #8FA8C8;
    flex-shrink: 0;
  }
  .about-expertise-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 36px;
  }
  .about-expertise-card {
    padding: 20px;
    border-radius: 12px;
    border: 1px solid rgba(27,79,155,0.15);
    background: #ffffff;
  }
  .about-expertise-icon { font-size: 22px; margin-bottom: 10px; }
  .about-expertise-title {
    font-size: 13px;
    font-weight: 600;
    color: #000000 !important;
    margin-bottom: 4px;
  }
  .about-expertise-desc {
    font-size: 12px;
    color: #000000 !important;
    line-height: 1.55;
  }

  /* CLOSING */
  .about-closing {
    background: #0F2E5A;
    padding: 100px 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .about-closing::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 100%, rgba(27,79,155,0.4), transparent 60%);
    pointer-events: none;
  }
  .about-closing-inner {
    position: relative;
    z-index: 1;
    max-width: 640px;
    margin: 0 auto;
  }
  .about-closing blockquote {
    font-family: 'Georgia', serif;
    font-size: clamp(24px, 3.5vw, 38px);
    font-style: italic;
    color: #ffffff;
    line-height: 1.3;
    margin-bottom: 24px;
  }
  .about-closing-attr {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #8FA8C8;
  }

  /* RESPONSIVE */
  @media (max-width: 860px) {
    .about-leadership-layout { grid-template-columns: 1fr; gap: 48px; }
    .about-mission { gap: 32px; }
    .about-mission-divider { display: none; }
    .about-expertise-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .about-hero { padding: 80px 24px 72px; }
    .about-container { padding: 0 24px; }
    .about-built-section, .about-leadership-section { padding: 64px 0; }
  }
`;

const About = () => {
  return (
    <div className="min-h-screen bg-[#FAFBFD] p-[10px] flex justify-center items-start">
      <div className="about-page w-full rounded-[16px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-slate-200">
        <style>{styles}</style>

        {/* HERO */}
        <section className="about-hero">
          <div className="about-runway-grid"></div>
          <div className="about-runway-center"></div>
          <div className="about-horizon-glow"></div>
          <div className="about-hero-content">
            <div className="about-hero-eyebrow">About FlightElevate</div>
            <h1>Built for the<br /><em>runway ahead</em></h1>
            <p className="about-hero-sub">Modern, purpose-designed software for flight schools and flying clubs — built from real-world experience, not adapted from generic business tools.</p>
          </div>
        </section>

        {/* STATS STRIP */}
        <div className="about-mission gap-[30px] md:gap-[60px]">
          <div className="about-mission-stat">
            <div className="about-num">Part 61</div>
            <div className="about-label">&amp; 141 Ready</div>
          </div>
          <div className="about-mission-divider"></div>
          <div className="about-mission-stat">
            <div className="about-num">ATP</div>
            <div className="about-label">Certified Founders</div>
          </div>
          <div className="about-mission-divider"></div>
          <div className="about-mission-stat">
            <div className="about-num">18+</div>
            <div className="about-label">Months in Development</div>
          </div>
          <div className="about-mission-divider"></div>
          <div className="about-mission-stat">
            <div className="about-num">0</div>
            <div className="about-label">Generic Workarounds</div>
          </div>
        </div>

        {/* BUILT BY AVIATION */}
        <section className="about-built-section">
          <div className="about-container">
            <div className="about-built-single">
              <div className="about-section-label">Our Origin</div>
              <h2 className="about-section-title">Built by aviation professionals, for aviation professionals</h2>
              <p className="about-section-body">
                Flight training has long been underserved by its own software market. The tools that set the standard come with enterprise-level price tags, rigid annual contracts, and commercial obligations that put them out of reach for independent instructors and small flight schools — the very operators who need operational support the most.
                <br /><br />
                FlightElevate was built to close that gap. The platform was developed with the direct insight of an Airline Transport Pilot and former Assistant Chief Flight Instructor who spent years navigating those same constraints firsthand. The goal was straightforward: deliver the scheduling, administrative, and operational capabilities of premium flight training software — without the pricing structures and contractual obligations that have historically excluded smaller operators.
                <br /><br />
                Whether you're an independent CFI managing your own students or a university-affiliated flight program running a structured curriculum, FlightElevate is designed to meet you where you are — with tools built around real administrative pain points and workflows that reflect how flight training actually operates.
              </p>
              <div className="about-credentials">
                <span className="about-badge">✈ ATP Certificate</span>
                <span className="about-badge">🏫 Asst. Chief Flight Instructor</span>
                <span className="about-badge">📋 Part 141 Experience</span>
                <span className="about-badge">⏱ 5+ Years with Legacy Tools</span>
              </div>
            </div>
          </div>
        </section>

        <hr className="about-section-rule" />

        {/* LEADERSHIP */}
        <section className="about-leadership-section">
          <div className="about-container">
            <div className="about-section-label">Leadership</div>
            <h2 className="about-section-title">The team guiding FlightElevate forward</h2>
            <div className="about-leadership-layout">
              <div>
                <div className="about-portrait-card">
                  <div className="about-portrait-bg">
                    <div className="about-portrait-initials">CS</div>
                  </div>
                  <div className="about-portrait-info">
                    <div className="about-portrait-name">Claude Sturla</div>
                    <div className="about-portrait-role">Managing Partner</div>
                    <div className="about-portrait-firms">
                      <span className="about-firm-tag">Fidelity Investments</span>
                      <span className="about-firm-tag">Merrill Lynch</span>
                      <span className="about-firm-tag">Strategic Business Development</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="about-section-body">
                  Claude Sturla brings deep expertise in financial planning, investment advisory, and strategic business development to his role as Managing Partner. His career spans leading institutions including Fidelity Investments and Merrill Lynch, where he developed the strategic and operational perspective that now guides FlightElevate's growth, partnerships, and market positioning.
                  <br /><br />
                  Claude is the public-facing voice of FlightElevate — translating the platform's aviation-rooted vision into business strategy and building the relationships that will carry it forward.
                </p>
                <div className="about-expertise-grid">
                  <div className="about-expertise-card">
                    <div className="about-expertise-icon">📈</div>
                    <div className="about-expertise-title">Financial Planning</div>
                    <div className="about-expertise-desc">Institutional-grade financial expertise applied to sustainable SaaS growth.</div>
                  </div>
                  <div className="about-expertise-card">
                    <div className="about-expertise-icon">🤝</div>
                    <div className="about-expertise-title">Strategic Partnerships</div>
                    <div className="about-expertise-desc">Building the industry relationships that open doors for flight schools.</div>
                  </div>
                  <div className="about-expertise-card">
                    <div className="about-expertise-icon">🧭</div>
                    <div className="about-expertise-title">Business Development</div>
                    <div className="about-expertise-desc">Translating a technical product vision into scalable market strategy.</div>
                  </div>
                  <div className="about-expertise-card">
                    <div className="about-expertise-icon">🏦</div>
                    <div className="about-expertise-title">Investment Advisory</div>
                    <div className="about-expertise-desc">Experience at leading institutions guiding long-term capital decisions.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className="about-closing">
          <div className="about-closing-inner">
            <blockquote>"Premium flight training software shouldn't be a privilege reserved for schools that can afford enterprise contracts. We built FlightElevate to change that."</blockquote>
            <div className="about-closing-attr">The FlightElevate Team</div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
