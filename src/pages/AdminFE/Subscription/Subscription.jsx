import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { subscriptionPlanService } from "../../../api/services/subscriptionPlanService";
import { showSuccessToast, showErrorToast } from "../../../utils/notifications";
import {
  FiCheck, FiDollarSign, FiDownload, FiX, FiLoader,
  FiMail, FiChevronDown, FiChevronRight, FiZap,
  FiShield, FiClock, FiUsers, FiTrendingUp, FiStar,
} from "react-icons/fi";
import { MdFlight } from "react-icons/md";

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n >= 1000) return "$" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return "$" + n.toLocaleString();
};

// ─── FAQ Item ──────────────────────────────────────────────────────────────
const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      className={`border rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
        open
          ? "border-blue-200 bg-blue-50/40 shadow-sm"
          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50/50"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <span className="text-sm font-semibold text-gray-800">{question}</span>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            open ? "bg-blue-100 text-blue-600 rotate-180" : "bg-gray-100 text-gray-400"
          }`}
        >
          <FiChevronDown size={13} />
        </div>
      </div>
      {open && (
        <div className="px-5 pb-4">
          <div className="w-full h-px bg-blue-100 mb-3" />
          <p className="text-sm text-gray-500 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

// ─── Billing Modal ─────────────────────────────────────────────────────────
const BillingModal = ({ invoices, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-xl w-full overflow-hidden">
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <FiDownload size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Billing History</h3>
            <p className="text-xs text-gray-500 mt-0.5">Your past subscription invoices</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <FiX size={16} />
        </button>
      </div>

      <div className="p-6">
        {invoices.length > 0 ? (
          <div className="space-y-2">
            {invoices.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <FiDollarSign size={13} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.number}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{item.amount}</span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      item.status?.toLowerCase() === "paid"
                        ? "bg-[#E1FAEA] text-[#016626]"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {item.status}
                  </span>
                  {item.pdf_url && item.pdf_url !== "#" ? (
                    <a
                      href={item.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <FiDownload size={14} />
                    </a>
                  ) : (
                    <button
                      onClick={() => showSuccessToast(`${item.number} downloaded!`)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <FiDownload size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FiDownload size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600">No billing history</p>
            <p className="text-xs text-gray-400 mt-1">Your invoices will appear here after billing.</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// ─── Stat Pill ─────────────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-[#E1FAEA] text-[#016626] border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
        <Icon size={17} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-base font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const Subscription = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [showBillingHistory, setShowBillingHistory] = useState(false);

  const initData = useCallback(async () => {
    setLoading(true);
    try {
      const planRes = await subscriptionPlanService.getSubscriptionPlans();
      if (planRes?.success) {
        const list = Array.isArray(planRes.data)
          ? planRes.data
          : Array.isArray(planRes.data?.data)
          ? planRes.data.data
          : [];
        setPlans(list.filter(p => p.status === 'active'));
      }
      const subRes = await subscriptionPlanService.getCurrentSubscription();
      if (subRes?.success && subRes.data) setCurrentSubscription(subRes.data);
      const billRes = await subscriptionPlanService.getBillingHistory();
      if (billRes?.success) setInvoices(billRes.data || []);
    } catch (err) {
      console.error("Subscription init:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { initData(); }, [initData]);

  const handleSubscribe = async (planId) => {
    navigate(`/checkout/${planId}`);
  };

  const handleBillingHistory = async () => {
    try {
      const res = await subscriptionPlanService.getBillingPortal();
      if (res?.success && res.data?.url) {
        showSuccessToast("Redirecting to Stripe Billing Portal…");
        setTimeout(() => { window.location.href = res.data.url; }, 1200);
        return;
      }
    } catch { /* fallthrough */ }
    try {
      const billRes = await subscriptionPlanService.getBillingHistory();
      if (billRes?.success) setInvoices(billRes.data || []);
    } catch { /* ignore */ }
    setShowBillingHistory(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-48">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600" />
          <p className="text-sm text-gray-400">Loading subscription…</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: MdFlight,     text: "Unlimited aircraft in your fleet" },
    { icon: FiUsers,      text: "Unlimited users & instructors" },
    { icon: FiZap,        text: "Full lessons & reservation management" },
    { icon: FiShield,     text: "Digital logbook with flight tracking" },
    { icon: FiTrendingUp, text: "Aircraft profiles & maintenance records" },
    { icon: FiStar,       text: "Role-based access & permissions" },
    { icon: FiMail,       text: "Announcements & messaging center" },
    { icon: FiClock,      text: "Calendar & scheduling tools" },
  ];

  const faqs = [
    {
      q: "What is included in my plan?",
      a: "Your plan gives you access to all FlightElevate features — reservations, logbooks, maintenance, student management, and more — with no limits on aircraft or users.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes! Every new account gets a 14-day free trial. No credit card required. You'll only be charged if you subscribe after the trial ends.",
    },
    {
      q: "Can I add unlimited aircraft?",
      a: "Absolutely. Your flat monthly fee covers your entire organization regardless of fleet size. Add as many aircraft as you need.",
    },
    {
      q: "How do I cancel?",
      a: "You can cancel at any time. Your access continues until the end of the current billing period. No hidden fees or penalties.",
    },
  ];

  // ── ACTIVE SUBSCRIPTION VIEW ───────────────────────────────────────────────
  if (currentSubscription) {
    const planPrice = parseFloat(currentSubscription.price || 0).toFixed(2);
    const renewDate = currentSubscription.ends_at
      ? new Date(currentSubscription.ends_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "—";

    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
              <p className="text-sm text-gray-400 mt-0.5">Manage your active plan</p>
            </div>
            <button
              onClick={handleBillingHistory}
              className="flex items-center gap-2 border border-gray-200 bg-white px-3.5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            >
              <FiDownload size={14} />
              Billing History
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* ── Banner ── */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a3a6e] to-[#2563eb] p-6">
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
              <div className="absolute -right-2 -bottom-10 w-28 h-28 rounded-full bg-white/5" />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[100px] opacity-[0.06] pointer-events-none select-none leading-none">✈</span>

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Active Plan
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {currentSubscription.plan_title}
                  </h3>
                  <p className="text-sm text-white/70">
                    ${planPrice}/month · Auto-renews{" "}
                    <span className="text-white font-semibold">{renewDate}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/10 border border-white/15 rounded-xl px-5 py-3 text-center backdrop-blur-sm">
                    <p className="text-2xl font-bold text-white">${planPrice}</p>
                    <p className="text-xs text-white/60 mt-0.5">Per Month</p>
                  </div>
                  <div className="bg-white/10 border border-white/15 rounded-xl px-5 py-3 text-center backdrop-blur-sm">
                    <p className="text-2xl font-bold text-white">
                      {currentSubscription.max_users === 0 ? "∞" : currentSubscription.max_users}
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">Seats</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stat pills ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatPill icon={FiDollarSign} label="Monthly Fee"  value={`$${planPrice}/mo`}      color="blue" />
              <StatPill icon={FiUsers}      label="User Seats"   value={currentSubscription.max_users === 0 ? "Unlimited" : `${currentSubscription.max_users} seats`} color="green" />
              <StatPill icon={FiClock}      label="Renews On"    value={new Date(currentSubscription.ends_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} color="amber" />
            </div>

            {/* ── Included features ── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
                <FiCheck size={14} className="text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-700">Included in your plan</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-gray-100">
                {["Unlimited Flight Logs", "Unlimited Aircraft", "Instructor Oversight", "Fleet Maintenance", "Digital Logbooks", "Student Dashboard", "Role-Based Access", "Calendar & Scheduling", "Announcements"].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 px-5 py-3 bg-white">
                    <span className="w-5 h-5 rounded-full bg-[#E1FAEA] flex items-center justify-center flex-shrink-0">
                      <FiCheck size={10} className="text-[#016626]" />
                    </span>
                    <span className="text-sm text-gray-700 font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {showBillingHistory && (
          <BillingModal invoices={invoices} onClose={() => setShowBillingHistory(false)} />
        )}
      </div>
    );
  }

  // ── NO SUBSCRIPTION – PLAN SELECTION ─────────────────────────────────────
  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-xl rounded-xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-[#F3F4F6] gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Choose a Plan</h2>
            <p className="text-sm text-gray-400 mt-0.5">Flat monthly fee — unlimited aircraft, unlimited growth.</p>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* ── Plan Cards Grid ── */}
          {plans.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-base font-medium">No active plans available.</p>
              <p className="text-sm mt-1">Please contact support to get access.</p>
            </div>
          ) : (
            <div className={`grid gap-5 ${plans.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : plans.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {plans.map((plan, idx) => {
                const isPopular = plans.length > 1 && idx === Math.floor(plans.length / 2);
                const planFeatures = plan.para
                  ? plan.para.split(/[|\n]/).map(f => f.trim()).filter(Boolean)
                  : [];
                const isLoading = subscribing === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                      isPopular
                        ? 'border-blue-600 shadow-lg shadow-blue-500/15'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    {isPopular && (
                      <div className="bg-blue-600 text-center py-1.5">
                        <span className="text-xs font-bold text-white tracking-wide flex items-center justify-center gap-1.5">
                          <FiStar size={10} /> MOST POPULAR
                        </span>
                      </div>
                    )}
                    <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />

                    <div className="flex flex-col flex-1 p-5 gap-4">
                      {/* Title */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{plan.title}</h3>
                        {plan.description && (
                          <p className="text-sm text-gray-400 mt-1 leading-relaxed">{plan.description}</p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                        <p className="text-xs text-gray-400 font-medium mb-1">Monthly fee</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-blue-600 leading-none">
                            ${parseFloat(plan.price).toFixed(2)}
                          </span>
                          <span className="text-sm text-blue-400 font-medium">/month</span>
                        </div>
                        {plan.setup_fee > 0 && (
                          <p className="text-xs text-gray-400 mt-1.5">
                            + ${parseFloat(plan.setup_fee).toFixed(2)} one-time setup fee
                          </p>
                        )}
                      </div>

                      {/* Limits */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                          <MdFlight size={12} />
                          {plan.max_aircraft === 0 ? 'Unlimited aircraft' : `Up to ${plan.max_aircraft} aircraft`}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                          <FiUsers size={11} />
                          {plan.max_users === 0 ? 'Unlimited users' : `Up to ${plan.max_users} users`}
                        </span>
                      </div>

                      {/* Features from DB */}
                      {planFeatures.length > 0 && (
                        <ul className="space-y-2">
                          {planFeatures.map((feat, fi) => (
                            <li key={fi} className="flex items-start gap-2.5 text-sm text-gray-600">
                              <span className="w-4 h-4 rounded-full bg-[#E1FAEA] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <FiCheck size={9} className="text-[#016626]" />
                              </span>
                              {feat}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* CTA */}
                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isLoading}
                        className={`mt-auto w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          isPopular
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                      >
                        {isLoading
                          ? <><FiLoader size={15} className="animate-spin" /> Processing…</>
                          : <><FiZap size={14} /> Get Started — ${parseFloat(plan.price).toFixed(2)}/mo</>
                        }
                      </button>
                      <p className="text-center text-xs text-gray-400">🔒 Secure payment via Stripe</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Features ── */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <FiStar size={14} className="text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-800">Everything included in every plan</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-gray-100">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50/70 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-blue-600" />
                  </span>
                  <span className="text-sm text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-[#F3F4F6]" />

          {/* ── FAQ ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 rounded-full bg-blue-600" />
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Frequently Asked</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {faqs.map(({ q, a }) => <FaqItem key={q} question={q} answer={a} />)}
            </div>
          </div>

          {/* ── Help Banner ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a3a6e] to-[#2563eb] p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="absolute -right-6 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 text-xl">
              💬
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-base font-bold text-white">Have questions about your plan?</p>
              <p className="text-sm text-white/65 mt-0.5">Our aviation specialists are ready to help you get started.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/15 border border-white/25 text-white text-sm font-semibold rounded-xl hover:bg-white/25 transition-colors whitespace-nowrap flex-shrink-0">
              <FiMail size={14} />
              Send a Message
            </button>
          </div>

        </div>
      </div>

      {showBillingHistory && (
        <BillingModal invoices={invoices} onClose={() => setShowBillingHistory(false)} />
      )}
    </div>
  );
};

export default Subscription;


