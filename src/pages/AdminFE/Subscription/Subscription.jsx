import React, { useState, useEffect, useCallback } from "react";
import { subscriptionPlanService } from "../../../api/services/subscriptionPlanService";
import { aircraftService } from "../../../api/services/aircraftService";
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
  const BASE_PRICE = 13;

  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [showBillingHistory, setShowBillingHistory] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [fleet, setFleet] = useState(6);

  const planPrice = plans.length > 0 ? parseFloat(plans[0].price) : BASE_PRICE;
  const perAc = +(planPrice * (annual ? 0.8 : 1)).toFixed(2);
  const totalCost = Math.round(perAc * fleet);

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
        setPlans(list);
      }
      const subRes = await subscriptionPlanService.getCurrentSubscription();
      if (subRes?.success && subRes.data) setCurrentSubscription(subRes.data);
      const acRes = await aircraftService.getAircraft();
      if (acRes?.success) {
        const acList = acRes.data?.data || (Array.isArray(acRes.data) ? acRes.data : []);
        setFleet(Math.max(1, acList.length));
      }
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
    setSubscribing(planId);
    try {
      const res = await subscriptionPlanService.subscribe(planId, fleet);
      if (res?.success) {
        if (res.data?.checkout_url) {
          showSuccessToast("Redirecting to Stripe checkout…");
          setTimeout(() => { window.location.href = res.data.checkout_url; }, 1200);
        } else {
          showSuccessToast("Successfully subscribed!");
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch (err) {
      showErrorToast(err?.response?.data?.message || "Failed to subscribe");
    } finally {
      setSubscribing(null);
    }
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
    { icon: MdFlight,    text: "Per-aircraft billing — active fleet only" },
    { icon: FiUsers,     text: "Unlimited users & instructors" },
    { icon: FiZap,       text: "Full lessons & reservation management" },
    { icon: FiShield,    text: "Digital logbook with flight tracking" },
    { icon: FiTrendingUp,text: "Aircraft profiles & maintenance records" },
    { icon: FiStar,      text: "Role-based access & permissions" },
    { icon: FiMail,      text: "Announcements & messaging center" },
    { icon: FiClock,     text: "Calendar & scheduling tools" },
  ];

  const faqs = [
    {
      q: "How does per-aircraft pricing work?",
      a: "You're billed based on the number of active aircraft in your fleet. Add or remove aircraft any time — your bill adjusts at the next billing cycle.",
    },
    {
      q: "Can I change my fleet size mid-cycle?",
      a: "Yes. Additions are prorated for the remaining days in the billing period, and removals reflect in the next cycle.",
    },
    {
      q: "Is there a free trial?",
      a: "We offer a 14-day free trial. No credit card required. You'll only be charged if you continue after the trial ends.",
    },
    {
      q: "What does annual billing save me?",
      a: "Annual billing gives you a flat 20% discount on the per-aircraft rate. Toggle above to see the updated pricing instantly.",
    },
  ];

  // ── ACTIVE SUBSCRIPTION VIEW ───────────────────────────────────────────────
  if (currentSubscription) {
    const perAcActive =
      currentSubscription.aircraft_count > 0
        ? (parseFloat(currentSubscription.price) / currentSubscription.aircraft_count).toFixed(0)
        : parseFloat(currentSubscription.price).toFixed(0);
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
              {/* bg decorations */}
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
                    ${perAcActive} / aircraft / month · Auto-renews{" "}
                    <span className="text-white font-semibold">{renewDate}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/10 border border-white/15 rounded-xl px-5 py-3 text-center backdrop-blur-sm">
                    <p className="text-2xl font-bold text-white">{currentSubscription.aircraft_count}</p>
                    <p className="text-xs text-white/60 mt-0.5">Aircraft</p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatPill icon={MdFlight}    label="Fleet Size"   value={`${currentSubscription.aircraft_count} aircraft`} color="blue" />
              <StatPill icon={FiUsers}     label="User Seats"   value={currentSubscription.max_users === 0 ? "Unlimited" : `${currentSubscription.max_users} seats`} color="green" />
              <StatPill icon={FiDollarSign} label="Per Aircraft" value={`$${perAcActive}/mo`} color="purple" />
              <StatPill icon={FiClock}     label="Renews On"    value={new Date(currentSubscription.ends_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })} color="amber" />
            </div>

            {/* ── Included features ── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
                <FiCheck size={14} className="text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-700">Included in your plan</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-gray-100">
                {["Unlimited Flight Logs", "Instructor Oversight", "Fleet Maintenance", "Digital Logbooks", "Student Dashboard", "Role-Based Access"].map((f) => (
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
  const firstPlan = plans[0] || null;
  const sliderPct = ((fleet - 1) / 49) * 100;

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-xl rounded-xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-[#F3F4F6] gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Subscription Plan</h2>
            <p className="text-sm text-gray-400 mt-0.5">Per-aircraft pricing — scale as your fleet grows.</p>
          </div>
          {/* Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                !annual ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                annual ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Annual
              <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
                −20%
              </span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* ── Fleet Calculator ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f2241] to-[#1e4fc2] p-5">
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[100px] opacity-[0.05] pointer-events-none select-none leading-none">✈</span>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="min-w-[120px]">
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-1">Fleet Size</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-white leading-none">{fleet}</span>
                  <span className="text-sm text-white/60">aircraft</span>
                </div>
              </div>

              <div className="flex-1 w-full min-w-[180px]">
                <div className="flex justify-between text-xs text-white/50 mb-2.5 font-medium">
                  <span>1 aircraft</span>
                  <span>50 aircraft</span>
                </div>
                <input
                  type="range" min="1" max="50" value={fleet}
                  onChange={(e) => setFleet(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full outline-none cursor-pointer"
                  style={{
                    appearance: "none",
                    background: `linear-gradient(to right, #93c5fd ${sliderPct}%, rgba(255,255,255,0.15) ${sliderPct}%)`,
                    accentColor: "#93c5fd",
                  }}
                />
                <div className="flex justify-between text-xs text-white/40 mt-1.5">
                  <span>Drag to set fleet size</span>
                  <span>{fleet} × ${perAc} = {fmt(totalCost)}/mo</span>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-white">{fleet}</p>
                  <p className="text-xs text-white/50 mt-0.5">Aircraft</p>
                </div>
                <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-center min-w-[90px]">
                  <p className="text-2xl font-bold text-white">{fmt(totalCost)}</p>
                  <p className="text-xs text-white/50 mt-0.5">Total/mo</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Plan Card + Right Panel ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* LEFT – Plan Card */}
            <div className="lg:col-span-2 flex flex-col rounded-2xl border-2 border-blue-600 overflow-hidden shadow-lg shadow-blue-500/10">
              {/* colored top bar */}
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />

              <div className="flex flex-col flex-1 p-5 gap-4">
                {/* badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                    Standard Plan
                  </span>
                  {annual && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500 text-white">
                      Save 20%
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">Starting from</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-gray-900 leading-none tracking-tight">
                      ${perAc}
                    </span>
                    <div className="ml-1">
                      <p className="text-xs text-gray-500 font-medium leading-tight">per aircraft</p>
                      <p className="text-xs text-gray-400 leading-tight">per month</p>
                    </div>
                  </div>
                </div>

                {/* separator */}
                <div className="w-full h-px bg-gray-100" />

                {/* cost box */}
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Your fleet total</span>
                    <span className="text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-md">
                      {fleet} aircraft
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-blue-600">{fmt(totalCost)}</span>
                    <span className="text-sm text-blue-400 font-medium">/mo</span>
                  </div>
                  {annual && (
                    <p className="text-xs text-green-600 font-medium mt-1.5">
                      💰 Saving {fmt(Math.round(planPrice * fleet * 0.2 * 12))} / year
                    </p>
                  )}
                </div>

                {/* billing row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{annual ? "Billed annually" : "Billed monthly"}</span>
                  <span className="text-gray-400">Cancel any time</span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => firstPlan && handleSubscribe(firstPlan.id)}
                  disabled={subscribing !== null || !firstPlan}
                  className="mt-auto w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {subscribing
                    ? <><FiLoader size={15} className="animate-spin" /> Processing…</>
                    : firstPlan
                    ? <>Get Started — {fmt(totalCost)}/mo</>
                    : "Contact Support"
                  }
                </button>

                <p className="text-center text-xs text-gray-400">
                  🔒 Secure payment via Stripe
                </p>
              </div>
            </div>

            {/* RIGHT – Features + Breakdown stacked */}
            <div className="lg:col-span-3 flex flex-col gap-5">

              {/* Features Grid */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                  <FiStar size={14} className="text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Everything included</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100">
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

              {/* Billing Breakdown */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                  <FiDollarSign size={14} className="text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Billing Breakdown</h4>
                </div>
                <div className="px-5 divide-y divide-gray-50">
                  {[
                    { label: "Price per aircraft", value: `$${perAc}/mo` },
                    { label: "Fleet size", value: `${fleet} aircraft` },
                    { label: "Billing cycle", value: annual ? "Annual" : "Monthly" },
                    { label: "Discount applied", value: annual ? "20% off" : "None", accent: annual },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className={`text-sm font-semibold ${accent ? "text-green-600" : "text-gray-800"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-4">
                    <span className="text-sm font-bold text-gray-900">Total due monthly</span>
                    <span className="text-xl font-extrabold text-blue-600">{fmt(totalCost)}</span>
                  </div>
                </div>
              </div>
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
