import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SiteNav, SiteFooter, AtisRibbon, useReveal, useScrollTop } from './SiteChrome';
import './flightelevate.css';

/* ==================================================================
   FlightElevate — landing page
   Design system lives in flightelevate.css ("Night Ramp").
   Site chrome (ATIS ribbon, nav, footer) lives in SiteChrome.jsx.
   ================================================================== */

/* ---- role-based view data -------------------------------------- */
const ROLES = [
  {
    key: 'admin',
    eyebrow: 'Owner / Chief CFI',
    name: 'Base command',
    blurb: 'Utilisation, revenue, squawks and instructor load across the whole operation.',
    title: 'Base command \u00b7 all aircraft',
    kpis: [
      { label: 'Flights this month', value: '128', tone: 'k-amber' },
      { label: 'Booked next 7 days', value: '24', tone: 'k-nav' },
      { label: 'Aircraft available', value: '8', unit: '/ 9', tone: 'k-go' },
      { label: 'Open squawks', value: '3', tone: 'k-warn' },
    ],
    rows: [
      ['Fleet utilisation', 'Trailing 30 days \u00b7 target 70%', '68.4%'],
      ['Revenue per airframe', 'Trailing 30 days \u00b7 median', '$11,240'],
      ['Instructor load balance', '6 CFIs \u00b7 spread', '\u00b19%'],
      ['Cancellations', 'Weather 61% \u00b7 maintenance 22%', '14'],
    ],
  },
  {
    key: 'cfi',
    eyebrow: 'Instructor',
    name: "Today's line-up",
    blurb: "Your flights, your students, your logged hours \u2014 and what you're owed.",
    title: "Instructor \u00b7 today's line-up",
    kpis: [
      { label: 'Dual given', value: '450.5', unit: 'h', tone: 'k-amber' },
      { label: 'Ground', value: '85.0', unit: 'h', tone: 'k-nav' },
      { label: 'Flights today', value: '4', tone: 'k-go' },
      { label: 'Pending sign-offs', value: '2', tone: 'k-warn' },
    ],
    rows: [
      ['S. Jenkins \u00b7 N172FE', 'IFR cross-country \u00b7 stage 3', '1420Z'],
      ['D. Okafor \u00b7 N4501P', 'Solo pattern supervision', '1730Z'],
      ['M. Whitfield \u00b7 N88TE', 'ME checkride prep', '1915Z'],
      ['A. Bhatt \u00b7 N219FE', 'Discovery flight', '2000Z'],
    ],
  },
  {
    key: 'student',
    eyebrow: 'Student',
    name: 'Training file',
    blurb: 'Next lesson, stage progress, hours toward the certificate, wallet balance.',
    title: 'Student \u00b7 training file',
    kpis: [
      { label: 'Total time', value: '38.6', unit: 'h', tone: 'k-amber' },
      { label: 'Solo', value: '7.2', unit: 'h', tone: 'k-nav' },
      { label: 'To PPL minimum', value: '61', unit: '%', tone: 'k-go' },
      { label: 'Wallet balance', value: '$820', tone: 'k-warn' },
    ],
    rows: [
      ['Next lesson \u00b7 N4501P', 'Solo pattern \u00b7 CFI Ramirez', 'Tue 1730Z'],
      ['Stage 2 progress', '7 of 9 lessons complete', '78%'],
      ['Night requirement', '2.1 of 3.0 hours logged', '70%'],
      ['Cross-country', '4.0 of 5.0 hours logged', '80%'],
    ],
  },
];

const FAQS = [
  {
    q: 'Who is FlightElevate built for?',
    a: 'Part 61 and Part 141 flight schools first, plus flying clubs running shared aircraft. Part 91 operations and university-affiliated programs are on the published roadmap.',
  },
  {
    q: 'Can it replace our current scheduling system?',
    a: 'Yes. Scheduling, dispatch, logbooks, maintenance tracking and billing are one platform, so replacing the scheduler usually retires two or three other tools at the same time. We migrate your existing schedule and aircraft records as part of onboarding.',
  },
  {
    q: 'How does billing and payment work?',
    a: 'Payments run through Stripe Connect, including student wallets. Card data is tokenised by Stripe and funds are held and disbursed by Stripe \u2014 FlightElevate never holds your money or stores raw card details.',
  },
  {
    q: 'Does it support compliance and reporting?',
    a: "Training records, aircraft times, inspection intervals and instructor currency are tracked continuously and exportable, so an audit or a Part 141 record request doesn't turn into a week of spreadsheet work.",
  },
  {
    q: 'Can we configure it to our workflow?',
    a: "Aircraft types, rate structures, syllabus stages, roles and permissions are all configurable. What isn't configurable is the underlying record \u2014 one flight, one record, so the numbers always reconcile.",
  },
  {
    q: 'Is there a mobile app?',
    a: "The platform runs in any modern browser on desktop and tablet today. Native iOS and Android apps are in development; we'd rather ship them right than early.",
  },
];

const pad2 = (n) => String(n).padStart(2, '0');

/* Mirrors the redirect logic in Login.jsx / Register.jsx so an
   already-authenticated visitor lands in the right place — not just
   /dashboard, but /subscription if their org's trial has lapsed. */
const getRedirectPath = (userData) => {
  if (!userData) return '/dashboard';

  const isSuperAdmin = userData.roles?.some((r) => {
    const n = (typeof r === 'string' ? r : r?.name || '').toLowerCase();
    return n === 'super admin' || n === 'super-admin' || n === 'superadmin';
  });
  if (isSuperAdmin) return '/dashboard';

  if (userData.organization_id) {
    const hasActiveSub = !!userData.has_active_subscription;
    const backendTrial = !!userData.is_trial_active;
    const safeDateStr = userData.trial_ends_at
      ? (userData.trial_ends_at.includes('T') ? userData.trial_ends_at : userData.trial_ends_at.replace(' ', 'T') + 'Z')
      : null;
    const clientTrial = safeDateStr ? new Date(safeDateStr) > new Date() : false;
    const isExpired = !hasActiveSub && !backendTrial && !clientTrial;

    if (isExpired) return '/subscription';
  }

  return '/dashboard';
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  useReveal();
  useScrollTop();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      navigate(getRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const [activeRole, setActiveRole] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [aircraft, setAircraft] = useState(8);
  const [flights, setFlights] = useState(180);

  const role = ROLES[activeRole];

  /* ROI readout */
  const adminHours = Math.round(aircraft * 6 + flights * 0.45);
  const conflicts = Math.round(flights * 0.11 + aircraft * 0.6);
  const paperForms = (flights * 12).toLocaleString();
  const dialOffset = Math.round(214 - 214 * Math.min(1, adminHours / 280));
  const tapeHeight = Math.max(6, Math.min(64, conflicts * 1.5));

  if (authLoading || isAuthenticated) return null;

  return (
    <div className="fe">
      <AtisRibbon />
      <SiteNav />

      {/* ══════════ HERO ══════════ */}
      <header className="fe-hero">
        <div className="fe-hero-photo" style={{backgroundImage: 'url(\'https://images.unsplash.com/photo-1672277438853-43ffaeab2b41?auto=format&fit=crop&w=1200&q=55\')'}}></div>
        <div className="fe-hero-veil"></div>
        <div className="fe-hero-grid"></div>

        <div className="fe-wrap fe-hero-in">
          <div className="fe-hero-copy">
            <span className="fe-eyebrow">Part 61 · Part 141 · Flying clubs</span>
            <h1>Every aircraft, instructor and student on <em>one board.</em></h1>
            <p className="fe-hero-sub">
              FlightElevate replaces the whiteboard, the spreadsheet and the three apps that
              never talk to each other. Scheduling, dispatch, logbooks, maintenance and billing
              run as a single operational loop.
            </p>
            <div className="fe-hero-actions">
              <button className="fe-btn fe-btn-primary" onClick={() => navigate('/register')}>
                Book a demo
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h11M8.5 1.5 12 5 8.5 8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <a className="fe-btn fe-btn-ghost" href="#roles">See the platform</a>
            </div>
            <div className="fe-hero-note">
              <span>No setup fee</span>
              <span>No annual lock-in</span>
              <span>Migrate your schedule in a day</span>
            </div>
          </div>

          {/* SIGNATURE : dispatch strip board */}
          <div className="fe-board">
            <div className="fe-board-head">
              <span className="fe-mono">Dispatch board · KFLY</span>
              <span className="fe-live">Live</span>
            </div>
            <div className="fe-strips" id="stripBoard">
              <div className="fe-strip is-air">
                <div><div className="fe-tail">N172FE</div><div className="fe-type">C172S · G1000</div></div>
                <div><div className="fe-who">S. Jenkins</div><div className="fe-what">IFR XC · CFI Ramirez</div></div>
                <div className="fe-time">1420–1710Z</div>
                <div className="fe-tag">AIRBORNE</div>
              </div>
              <div className="fe-strip is-taxi">
                <div><div className="fe-tail">N4501P</div><div className="fe-type">PA-28 · Steam</div></div>
                <div><div className="fe-who">D. Okafor</div><div className="fe-what">Solo pattern · Stage 2</div></div>
                <div className="fe-time">1730–1900Z</div>
                <div className="fe-tag">TAXI</div>
              </div>
              <div className="fe-strip is-sched">
                <div><div className="fe-tail">N88TE</div><div className="fe-type">DA42 · Multi</div></div>
                <div><div className="fe-who">M. Whitfield</div><div className="fe-what">ME checkride prep</div></div>
                <div className="fe-time">1915–2145Z</div>
                <div className="fe-tag">SCHED</div>
              </div>
              <div className="fe-strip is-sched">
                <div><div className="fe-tail">N219FE</div><div className="fe-type">C152 · Steam</div></div>
                <div><div className="fe-who">A. Bhatt</div><div className="fe-what">Discovery flight</div></div>
                <div className="fe-time">2000–2115Z</div>
                <div className="fe-tag">SCHED</div>
              </div>
              <div className="fe-strip is-mx">
                <div><div className="fe-tail">N603FE</div><div className="fe-type">C172N · Steam</div></div>
                <div><div className="fe-who">100-hr inspection</div><div className="fe-what">Squawk · alternator</div></div>
                <div className="fe-time">DUE 4.2 h</div>
                <div className="fe-tag">GROUNDED</div>
              </div>
            </div>
            <div className="fe-board-foot">
              <span>Conflicts resolved automatically · <b>0 double-bookings</b></span>
              <span>Auto-refresh 30 s</span>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════ STATS ══════════ */}
      <section className="fe-stats">
        <div className="fe-wrap fe-stats-in">
          <div className="fe-stat"><b>61 <i>/</i> 141</b><span>Part-ready from day one</span></div>
          <div className="fe-stat"><b>99.99<i>%</i></b><span>Platform availability</span></div>
          <div className="fe-stat"><b>ATP</b><span>Certified founding pilot</span></div>
          <div className="fe-stat"><b>$0</b><span>Setup &amp; migration fee</span></div>
        </div>
      </section>

      {/* ══════════ OPS LOOP ══════════ */}
      <section className="fe-section paper" id="loop">
        <div className="fe-wrap">
          <div className="fe-head fe-reveal">
            <span className="fe-eyebrow on-paper">The operational loop</span>
            <h2 className="fe-h2">Six steps. One system.<br />Not six systems.</h2>
            <p className="fe-lede on-paper">
              A training flight touches scheduling, dispatch, the aircraft record, the logbook,
              the invoice and the compliance file. Most schools run that on four tools and a
              clipboard. FlightElevate runs it once — each step writes to the next.
            </p>
          </div>

          <div className="fe-loop-grid">
            <div className="fe-loop-list fe-reveal">
              <div className="fe-loop-item">
                <div className="fe-no">01</div>
                <div><h4>Book</h4><p>Students and instructors book against live aircraft availability. Currency, endorsements and maintenance holds are checked before the slot is confirmed.</p></div>
              </div>
              <div className="fe-loop-item">
                <div className="fe-no">02</div>
                <div><h4>Dispatch</h4><p>Digital checkout replaces the clipboard. Hobbs and tach out, fuel state, squawks and weather minimums captured at the desk.</p></div>
              </div>
              <div className="fe-loop-item">
                <div className="fe-no">03</div>
                <div><h4>Fly*</h4><p>The board updates as aircraft go airborne. Everyone from the front desk to the chief instructor sees the same picture.</p></div>
              </div>
              <div className="fe-loop-item">
                <div className="fe-no">04</div>
                <div><h4>Log</h4><p>Times flow straight into student and instructor logbooks. Lesson notes and stage progress attach to the flight, not to a filing cabinet.</p></div>
              </div>
              <div className="fe-loop-item">
                <div className="fe-no">05</div>
                <div><h4>Bill</h4><p>Aircraft time, instruction and ground are invoiced from the same record. Wallets and cards are handled through Stripe.</p></div>
              </div>
              <div className="fe-loop-item">
                <div className="fe-no">06</div>
                <div><h4>Comply</h4><p>Training records, aircraft times and inspection intervals stay audit-ready. Export what an inspector asks for in minutes.</p></div>
              </div>
            </div>

            {/* infographic : the loop */}
            <div className="fe-reveal">
              <svg viewBox="0 0 460 460" width="100%" role="img" aria-label="Diagram of the six-step flight operations loop">
                <circle cx="230" cy="230" r="176" fill="none" stroke="#C8D6E0" strokeWidth="1" />
                <circle cx="230" cy="230" r="176" fill="none" stroke="#B0761A" strokeWidth="2" strokeDasharray="9 9" opacity=".55" />
                <circle cx="230" cy="230" r="140" fill="none" stroke="#C8D6E0" strokeWidth="1" strokeDasharray="3 7" />
                <circle cx="230" cy="230" r="104" fill="#FFFFFF" stroke="#C8D6E0" />

                {/* clockwise arrowheads, set between the fixes */}
                <g fill="#B0761A">
                  <path d="M0 -8 L10 0 L0 8 Z" transform="translate(230 230) rotate(0)   translate(176 0) rotate(90)" />
                  <path d="M0 -8 L10 0 L0 8 Z" transform="translate(230 230) rotate(60)  translate(176 0) rotate(90)" />
                  <path d="M0 -8 L10 0 L0 8 Z" transform="translate(230 230) rotate(120) translate(176 0) rotate(90)" />
                  <path d="M0 -8 L10 0 L0 8 Z" transform="translate(230 230) rotate(180) translate(176 0) rotate(90)" />
                  <path d="M0 -8 L10 0 L0 8 Z" transform="translate(230 230) rotate(240) translate(176 0) rotate(90)" />
                  <path d="M0 -8 L10 0 L0 8 Z" transform="translate(230 230) rotate(300) translate(176 0) rotate(90)" />
                </g>

                {/* centre */}
                <text x="230" y="215" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="3" fill="#46617A">ONE RECORD</text>
                <text x="230" y="248" textAnchor="middle" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="30" letterSpacing="-1" fill="#0A1E31">Per flight</text>
                <text x="230" y="272" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fill="#46617A">written once, read everywhere</text>

                {/* nodes */}
                <g fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2" fill="#B0761A">
                  <g><circle cx="230" cy="54" r="30" fill="#0A1E31" /><text x="230" y="51" textAnchor="middle" fill="#2F8FE0">01</text><text x="230" y="64" textAnchor="middle" fill="#E8F1F7" fontSize="8.5">BOOK</text></g>
                  <g><circle cx="382" cy="142" r="30" fill="#0A1E31" /><text x="382" y="139" textAnchor="middle" fill="#2F8FE0">02</text><text x="382" y="152" textAnchor="middle" fill="#E8F1F7" fontSize="8">DISPATCH</text></g>
                  <g><circle cx="382" cy="318" r="30" fill="#0A1E31" /><text x="382" y="315" textAnchor="middle" fill="#2F8FE0">03</text><text x="382" y="328" textAnchor="middle" fill="#E8F1F7" fontSize="8.5">FLY</text></g>
                  <g><circle cx="230" cy="406" r="30" fill="#0A1E31" /><text x="230" y="403" textAnchor="middle" fill="#2F8FE0">04</text><text x="230" y="416" textAnchor="middle" fill="#E8F1F7" fontSize="8.5">LOG</text></g>
                  <g><circle cx="78" cy="318" r="30" fill="#0A1E31" /><text x="78" y="315" textAnchor="middle" fill="#2F8FE0">05</text><text x="78" y="328" textAnchor="middle" fill="#E8F1F7" fontSize="8.5">BILL</text></g>
                  <g><circle cx="78" cy="142" r="30" fill="#0A1E31" /><text x="78" y="139" textAnchor="middle" fill="#2F8FE0">06</text><text x="78" y="152" textAnchor="middle" fill="#E8F1F7" fontSize="8">COMPLY</text></g>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ROLE VIEWS ══════════ */}
      <section className="fe-section" id="roles">
        <div className="fe-wrap">
          <div className="fe-head fe-reveal">
            <span className="fe-eyebrow">Role-based views</span>
            <h2 className="fe-h2">Three jobs. Three screens.<br />Same data.</h2>
            <p className="fe-lede">
              The owner needs utilisation. The instructor needs today. The student needs to know
              what&apos;s next and what it costs. Everyone gets the view their job requires — nobody
              gets a settings page they&apos;ll never open.
            </p>
          </div>

          <div className="fe-roles">
            <div className="fe-role-tabs" role="tablist" aria-label="Role-based views">
              {ROLES.map((r, i) => (
                <button
                  key={r.key}
                  type="button"
                  role="tab"
                  aria-selected={activeRole === i}
                  className={activeRole === i ? 'fe-role-tab active' : 'fe-role-tab'}
                  onClick={() => setActiveRole(i)}
                >
                  <span className="fe-mono">{r.eyebrow}</span>
                  <strong>{r.name}</strong>
                  <em>{r.blurb}</em>
                </button>
              ))}
            </div>

            <div className="fe-role-panel">
              <div className="fe-role-bar">
                <span className="fe-mono">{role.title}</span>
                <span className="fe-live">Live</span>
              </div>
              <div className="fe-role-body">
                <div className="fe-kpis">
                  {role.kpis.map((k) => (
                    <div className={`fe-kpi ${k.tone}`} key={k.label}>
                      <span>{k.label}</span>
                      <b>{k.value}{k.unit ? <u>{k.unit}</u> : null}</b>
                    </div>
                  ))}
                </div>
                <div className="fe-rows">
                  {role.rows.map(([title, sub, right]) => (
                    <div className="fe-row" key={title}>
                      <div>
                        <div className="fe-row-t">{title}</div>
                        <div className="fe-row-s">{sub}</div>
                      </div>
                      <div className="fe-row-r">{right}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CAPABILITIES ══════════ */}
      <section className="fe-section paper" id="capabilities">
        <div className="fe-wrap">
          <div className="fe-head center fe-reveal">
            <span className="fe-eyebrow on-paper">What's in the box</span>
            <h2 className="fe-h2">Built for how a flight school actually runs</h2>
          </div>

          <div className="fe-caps fe-reveal">
            <div className="fe-cap">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <rect x="2" y="5" width="26" height="23" rx="3" stroke="#0A1E31" strokeWidth="1.6" />
                <path d="M2 12h26M9 2v6M21 2v6" stroke="#0A1E31" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="6" y="16" width="7" height="4" rx="1" fill="#2F8FE0" />
                <rect x="16" y="16" width="8" height="4" rx="1" fill="#0A1E31" opacity=".2" />
                <rect x="6" y="22" width="10" height="3" rx="1" fill="#0A1E31" opacity=".2" />
              </svg>
              <h4>Smart scheduling</h4>
              <p>Aircraft, instructors and rooms on one grid. Conflicts, currency lapses and maintenance holds are blocked before a booking is confirmed.</p>
              <span className="fe-mono">Live now</span>
            </div>

            <div className="fe-cap">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <path d="M15 3 L27 21 H3 Z" stroke="#0A1E31" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M6 26h18" stroke="#0A1E31" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="15" cy="15" r="3" fill="#2F8FE0" />
              </svg>
              <h4>Aircraft &amp; maintenance</h4>
              <p>Hobbs and tach tracked per flight. Inspection intervals, AD compliance and open squawks surface on the board before they ground you.</p>
              <span className="fe-mono">Live now</span>
            </div>

            <div className="fe-cap">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <rect x="4" y="3" width="22" height="24" rx="2.5" stroke="#0A1E31" strokeWidth="1.6" />
                <path d="M9 3v24" stroke="#0A1E31" strokeWidth="1.6" />
                <path d="M13 10h9M13 15h9M13 20h5" stroke="#0A1E31" strokeWidth="1.6" strokeLinecap="round" opacity=".45" />
                <circle cx="6.5" cy="9" r="1.3" fill="#2F8FE0" />
                <circle cx="6.5" cy="15" r="1.3" fill="#2F8FE0" />
              </svg>
              <h4>Digital logbook</h4>
              <p>Flight times, endorsements and lesson notes recorded once and readable by student, instructor and chief instructor. Export any time.</p>
              <span className="fe-mono">Live now</span>
            </div>

            <div className="fe-cap">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <rect x="2.5" y="7" width="25" height="17" rx="3" stroke="#0A1E31" strokeWidth="1.6" />
                <path d="M2.5 13h25" stroke="#0A1E31" strokeWidth="1.6" />
                <rect x="18" y="17" width="7" height="3" rx="1.5" fill="#2F8FE0" />
              </svg>
              <h4>Billing &amp; wallets</h4>
              <p>Charge aircraft time, instruction and ground from the same flight record. Student wallets, cards and payouts run on Stripe — funds never touch us.</p>
              <span className="fe-mono">Live now</span>
            </div>

            <div className="fe-cap">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <path d="M15 2.5 26 7v9c0 6.6-4.5 10.6-11 12.5C8.5 26.6 4 22.6 4 16V7Z" stroke="#0A1E31" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M10.5 15.5 13.5 18.5 20 12" stroke="#2F8FE0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h4>Compliance &amp; reporting</h4>
              <p>Training records, currency and aircraft times stay inspection-ready. Pull a Part 141 record or a utilisation report without a spreadsheet.</p>
              <span className="fe-mono">Live now</span>
            </div>

            <div className="fe-cap">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <path d="M4 6.5h22a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5H12l-6 5v-5H4a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 4 6.5Z" stroke="#0A1E31" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="10" cy="13.5" r="1.6" fill="#2F8FE0" />
                <circle cx="15" cy="13.5" r="1.6" fill="#0A1E31" opacity=".3" />
                <circle cx="20" cy="13.5" r="1.6" fill="#0A1E31" opacity=".3" />
              </svg>
              <h4>Connected messaging</h4>
              <p>Cancellations, weather calls and lesson notes go to the people affected, attached to the flight they concern. Nothing lives in a group text.</p>
              <span className="fe-mono">Live now</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FLEET ══════════ */}
      <section className="fe-section" id="fleet">
        <div className="fe-wrap fe-fleet">
          <div className="fe-reveal">
            <span className="fe-eyebrow">Fleet utilisation</span>
            <h2 className="fe-h2" style={{margin: '18px 0 16px'}}>See where the hours actually go</h2>
            <p className="fe-lede">
              Most schools discover an under-flown aircraft at annual review. FlightElevate shows
              you monthly — utilisation, revenue per airframe, and the inspection that's about to
              take a trainer off the line.
            </p>
            <div className="fe-hero-note" style={{marginTop: '28px'}}>
              <span>Revenue per airframe</span>
              <span>Inspection countdown</span>
              <span>Instructor load balance</span>
            </div>
          </div>

          <div className="fe-fleet-table fe-reveal">
            <div className="fe-fleet-head"><span>Tail</span><span>Utilisation · trailing 30 days</span><span>Rate</span></div>
            <div className="fe-fleet-row"><div className="fe-tail">N172FE<em>C172S G1000</em></div><div className="fe-bar"><i style={{width: '86%'}}></i></div><div className="fe-pct">86%</div></div>
            <div className="fe-fleet-row"><div className="fe-tail">N4501P<em>PA-28-161</em></div><div className="fe-bar"><i style={{width: '74%'}}></i></div><div className="fe-pct">74%</div></div>
            <div className="fe-fleet-row"><div className="fe-tail">N219FE<em>C152</em></div><div className="fe-bar"><i style={{width: '61%'}}></i></div><div className="fe-pct">61%</div></div>
            <div className="fe-fleet-row"><div className="fe-tail">N88TE<em>DA42 Twin</em></div><div className="fe-bar"><i style={{width: '48%'}}></i></div><div className="fe-pct">48%</div></div>
            <div className="fe-fleet-row"><div className="fe-tail">N603FE<em>C172N · MX</em></div><div className="fe-bar mx"><i style={{width: '19%'}}></i></div><div className="fe-pct" style={{color: '#FF7A5C'}}>19%</div></div>
            <div className="fe-board-foot">
              <span>N603FE grounded — 100-hr due in <b>4.2 h</b></span>
              <span>Sep 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ROI CLUSTER ══════════ */}
      <section className="fe-section paper" id="roi">
        <div className="fe-wrap fe-roi">
          <div className="fe-reveal">
            <span className="fe-eyebrow on-paper">Operating readout</span>
            <h2 className="fe-h2" style={{ margin: '18px 0 16px' }}>
              What the admin hours are costing you
            </h2>
            <p className="fe-lede on-paper">
              Set your fleet size and monthly flights. The readout estimates the front-desk time
              FlightElevate takes back, based on schools running comparable operations on
              spreadsheets and paper dispatch.
            </p>
            <div className="fe-badges">
              <span className="fe-badge">Digital checkout ends paper dispatch</span>
              <span className="fe-badge">Conflicts blocked at booking</span>
              <span className="fe-badge">Invoices raised from the flight record</span>
            </div>
          </div>

          <div className="fe-panel fe-reveal">
            <div className="fe-slider">
              <div className="fe-slider-top">
                <label htmlFor="feFleet">Aircraft in fleet</label>
                <output htmlFor="feFleet">{aircraft}</output>
              </div>
              <input
                type="range" id="feFleet" min="1" max="30" value={aircraft}
                onChange={(e) => setAircraft(parseInt(e.target.value, 10))}
              />
              <div className="fe-slider-scale"><span>1</span><span>30</span></div>
            </div>

            <div className="fe-slider">
              <div className="fe-slider-top">
                <label htmlFor="feFlights">Flights logged per month</label>
                <output htmlFor="feFlights">{flights}</output>
              </div>
              <input
                type="range" id="feFlights" min="20" max="500" step="10" value={flights}
                onChange={(e) => setFlights(parseInt(e.target.value, 10))}
              />
              <div className="fe-slider-scale"><span>20</span><span>500</span></div>
            </div>

            <div className="fe-cluster">
              {/* dial : admin hours returned */}
              <div className="fe-gauge">
                <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
                  <circle cx="43" cy="43" r="34" fill="none" stroke="#17364F" strokeWidth="7" />
                  <circle
                    cx="43" cy="43" r="34" fill="none" stroke="#2F8FE0" strokeWidth="7"
                    strokeLinecap="round" strokeDasharray="214" strokeDashoffset={dialOffset}
                    transform="rotate(-90 43 43)"
                  />
                  <circle cx="43" cy="43" r="3" fill="#6FD3F2" />
                </svg>
                <b>{adminHours}</b>
                <span>Admin hrs / month</span>
              </div>

              {/* tape : conflicts avoided */}
              <div className="fe-gauge">
                <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
                  <rect x="26" y="10" width="34" height="66" rx="4" fill="none" stroke="#17364F" strokeWidth="1.5" />
                  <g stroke="#17364F" strokeWidth="1.5">
                    <path d="M26 22h9M26 32h9M26 42h9M26 52h9M26 62h9" />
                  </g>
                  <rect x="27" y={75 - tapeHeight} width="32" height={tapeHeight} rx="3" fill="#6FD3F2" opacity=".22" />
                  <path d="M20 43h46" stroke="#2F8FE0" strokeWidth="2" />
                </svg>
                <b>{conflicts}</b>
                <span>Conflicts avoided</span>
              </div>

              {/* counter : paper retired */}
              <div className="fe-gauge">
                <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
                  <rect x="20" y="16" width="46" height="54" rx="4" fill="none" stroke="#17364F" strokeWidth="1.5" />
                  <path d="M28 30h30M28 40h30M28 50h20" stroke="#17364F" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M24 66 62 20" stroke="#FF7A5C" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <b>{paperForms}</b>
                <span>Paper forms / year</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ROADMAP ══════════ */}
      <section className="fe-section" id="roadmap">
        <div className="fe-wrap">
          <div className="fe-head fe-reveal">
            <span className="fe-eyebrow">Filed flight plan</span>
            <h2 className="fe-h2">Where the platform is heading</h2>
            <p className="fe-lede">
              Published like a route, because that&apos;s how we build it — in order, with each fix
              earned. Nothing here is sold as shipped.
            </p>
          </div>

          {/* route line */}
          <svg viewBox="0 0 1200 60" className="fe-reveal fe-route-line" aria-hidden="true">
            <path d="M0 42 L1200 42" stroke="#17364F" strokeWidth="1" />
            <path d="M0 42 L740 42" stroke="#E45DA8" strokeWidth="2" strokeDasharray="10 6" />
            <g fill="#E45DA8">
              <path d="M120 42 l7 -12 7 12 -7 6 z" /><path d="M320 42 l7 -12 7 12 -7 6 z" />
              <path d="M520 42 l7 -12 7 12 -7 6 z" /><path d="M720 42 l7 -12 7 12 -7 6 z" />
            </g>
            <g fill="#17364F"><path d="M920 42 l7 -12 7 12 -7 6 z" /><path d="M1120 42 l7 -12 7 12 -7 6 z" /></g>
            <g fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2" fill="#6C8AA5">
              <text x="127" y="22" textAnchor="middle">PILOT</text><text x="327" y="22" textAnchor="middle">DISPCH</text>
              <text x="527" y="22" textAnchor="middle">WXNOW</text><text x="727" y="22" textAnchor="middle">PT91</text>
              <text x="927" y="22" textAnchor="middle">SRSYS</text><text x="1127" y="22" textAnchor="middle">PRDCT</text>
            </g>
          </svg>

          <div className="fe-route-grid fe-reveal">
            <div className="fe-fix">
              <div className="fe-fix-top"><span className="fe-fix-id">PILOT</span><span className="fe-fix-eta">In build</span></div>
              <h4>Pilot AI</h4>
              <p>An assistant built by a pilot, for pilots — scheduling suggestions, briefing prep and operational questions answered in plain language.</p>
              <span className="fe-fix-cat">AI &amp; assistance</span>
            </div>
            <div className="fe-fix">
              <div className="fe-fix-top"><span className="fe-fix-id">DISPCH</span><span className="fe-fix-eta">In build</span></div>
              <h4>Integrated dispatch with W&amp;B</h4>
              <p>Weight and balance computed at checkout against the actual airframe, crew and fuel state — signed off before the aircraft moves.</p>
              <span className="fe-fix-cat">Dispatch &amp; ops</span>
            </div>
            <div className="fe-fix">
              <div className="fe-fix-top"><span className="fe-fix-id">WXNOW</span><span className="fe-fix-eta">Next</span></div>
              <h4>Weather on the go</h4>
              <p>METARs, TAFs and school minimums surfaced inside the booking, so a no-go call happens before the student drives to the field.</p>
              <span className="fe-fix-cat">Dispatch &amp; ops</span>
            </div>
            <div className="fe-fix">
              <div className="fe-fix-top"><span className="fe-fix-id">PT91</span><span className="fe-fix-eta">Next</span></div>
              <h4>Part 91 operations</h4>
              <p>Support for flying clubs, corporate flight departments and shared-ownership groups running outside a training syllabus.</p>
              <span className="fe-fix-cat">Operational expansion</span>
            </div>
            <div className="fe-fix">
              <div className="fe-fix-top"><span className="fe-fix-id">SRSYS</span><span className="fe-fix-eta">Planned</span></div>
              <h4>Smart Recovery System</h4>
              <p>More details as we get closer to release.</p>
              <span className="fe-fix-cat">System intelligence</span>
            </div>
            <div className="fe-fix">
              <div className="fe-fix-top"><span className="fe-fix-id">PRDCT</span><span className="fe-fix-eta">Planned</span></div>
              <h4>Predictive analytics</h4>
              <p>Forecast demand, instructor capacity and airframe availability far enough ahead to hire, buy or schedule against it.</p>
              <span className="fe-fix-cat">Data &amp; insight</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ QUOTE ══════════ */}
      <section className="fe-quote">
        <div className="fe-quote-photo" style={{backgroundImage: 'url(\'https://images.unsplash.com/photo-1652610050513-aee5fa596bdc?auto=format&fit=crop&w=1200&q=55\')'}}></div>
        <div className="fe-quote-veil"></div>
        <div className="fe-wrap fe-quote-in">
          <span className="fe-eyebrow">Why we built it</span>
          <blockquote style={{marginTop: '24px'}}>
            Premium flight training software shouldn&apos;t be a privilege reserved for schools that can
            afford <em>enterprise contracts.</em>
          </blockquote>
          <cite>The FlightElevate team</cite>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="fe-section" id="faq">
        <div className="fe-wrap">
          <div className="fe-head center fe-reveal">
            <span className="fe-eyebrow">Before you ask</span>
            <h2 className="fe-h2">Straight answers</h2>
          </div>

          <div className="fe-faq">
            {FAQS.map((f, i) => (
              <div className={openFaq === i ? 'fe-faq-item open' : 'fe-faq-item'} key={f.q}>
                <button
                  type="button"
                  className="fe-faq-q"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="fe-mono">{pad2(i + 1)}</span>
                  <strong>{f.q}</strong>
                  <i aria-hidden="true">+</i>
                </button>
                <div className="fe-faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="fe-cta" id="cta">
        <div className="fe-cta-threshold"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div className="fe-wrap fe-cta-in">
          <div>
            <span className="fe-mono">Cleared for takeoff</span>
            <h2 style={{marginTop: '14px'}}>See it running your schedule</h2>
            <p>Thirty minutes, your aircraft, your instructors. We&apos;ll load a week of your real schedule and show you the board.</p>
          </div>
          <div className="fe-cta-btns">
            <button className="fe-btn fe-btn-dark" onClick={() => navigate('/register')}>
              Book a demo
            </button>
            <a className="fe-btn fe-btn-outline-dark" href="mailto:contact@flightelevate.com">
              Talk to a pilot
            </a>
          </div>
        </div>
      </section>

      <p className="fe-mono" style={{ textAlign: 'center', color: 'var(--fe-text-dim)', padding: '0 24px 40px' }}>
        * Real-time flight tracking is in active development and will be available in an upcoming release.
      </p>

      <SiteFooter />
    </div>
  );
};

export default LandingPage;
