import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheck, FiFileText, FiCamera, FiUpload } from "react-icons/fi";
import { showErrorToast } from "../../utils/notifications";
import { getImageUrl } from "../../utils/imageUtils";

// ═════════════════════════════════════════════════════════════════════════════
// DOCUMENT TEMPLATES, EXPIRY LOGIC & REMINDERS
// ═════════════════════════════════════════════════════════════════════════════

// Rows turn amber when a document expires within this many days.
const DOC_REMINDER_DAYS = 60;

// BACKEND HOOK: flip to true once the backend accepts/stores these extra
// multipart fields (template_key, medical_class, exam_date, base_date,
// date_of_birth). Until then they are NOT sent, so nothing can break.
export const SEND_TEMPLATE_META = false;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

// expiry types:
//   none     -> no expiry field
//   manual   -> optional manual expiry date
//   optional -> optional manual expiry date (e.g. passport)
//   months   -> base date + N months (endOfMonth: last day of the Nth calendar month)
//   medical  -> class + exam date (+ optional DOB) -> FAA medical validity
const DOCUMENT_TEMPLATES = [
  {
    key: 'pilot_certificate',
    title: 'Pilot Certificate',
    expiry: 'none',
    hint: "Pilot certificates don't expire. Put the certificate number and ratings in the notes.",
  },
  { key: 'medical', title: 'Medical Certificate', expiry: 'medical' },
  { key: 'drivers_license', title: "Driver's License", expiry: 'manual' },
  {
    key: 'cfi_certificate',
    title: 'CFI Certificate',
    expiry: 'months',
    months: 24,
    endOfMonth: true,
    dateLabel: 'Date recent experience was last met',
    resultLabel: 'Recent experience ends',
    hint: 'CFI certificates no longer expire. Instructors must meet recent-experience requirements every 24 calendar months (for example a FIRC). Enter the date you last met them.',
  },
  {
    key: 'tsa_training',
    title: 'TSA Security Training',
    expiry: 'months',
    months: 12,
    endOfMonth: false,
    dateLabel: 'Training certificate date',
    resultLabel: 'Training expires',
    hint: 'Valid for 12 months from the training certificate date.',
  },
  {
    key: 'ftsp',
    title: 'FTSP Clearance (Alien)',
    expiry: 'manual',
    hint: 'Alien flight training security clearance / authorization. Enter the expiry shown on the TSA approval.',
  },
  {
    key: 'citizenship',
    title: 'Proof of U.S. Citizenship',
    expiry: 'optional',
    hint: 'Birth certificate, passport or naturalization certificate. Only add an expiry date if the proof is a passport.',
  },
  {
    key: 'flight_review',
    title: 'Flight Review',
    expiry: 'months',
    months: 24,
    endOfMonth: true,
    dateLabel: 'Flight review date',
    resultLabel: 'Next flight review due',
  },
  { key: 'custom', title: 'Other / Custom', expiry: 'manual' },
];

const getTemplate = (key) => DOCUMENT_TEMPLATES.find((t) => t.key === key) || DOCUMENT_TEMPLATES[DOCUMENT_TEMPLATES.length - 1];

const MEDICAL_CLASSES = ['Class 1', 'Class 2', 'Class 3'];
const COMPUTE_KEYS = ['template_key', 'medical_class', 'exam_date', 'base_date', 'date_of_birth'];

const pad2 = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseISO = (s) => {
  if (!s) return null;
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const fmtDate = (d) => d.toLocaleDateString('en-US');

// Last day of the Nth calendar month after the given date (e.g. exam 10/15 + 24 -> 10/31 two years later)
const endOfCalendarMonth = (date, n) => new Date(date.getFullYear(), date.getMonth() + n + 1, 0);

// Same day N months later (clamped to the last day of the target month)
const addMonthsExact = (date, n) => {
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(date.getDate(), lastDay));
  return d;
};

const ageOn = (dob, on) => {
  let age = on.getFullYear() - dob.getFullYear();
  const m = on.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < dob.getDate())) age--;
  return age;
};

// FAA medical validity (14 CFR 61.23). Age is the age on the exam date.
// Primary expiry = end of the privileges level the certificate is held for:
//   Class 1: <40 -> 12 mo, 40+ -> 6 mo   Class 2: 12 mo   Class 3: <40 -> 60 mo, 40+ -> 24 mo
// If DOB is missing, 40+ is assumed (shorter, safer interval).
const computeMedical = (cls, examISO, dobISO) => {
  const exam = parseISO(examISO);
  if (!cls || !exam) return null;
  const dob = parseISO(dobISO);
  const age = dob ? ageOn(dob, exam) : null;
  const over40 = age === null ? true : age >= 40;
  const eom = (n) => endOfCalendarMonth(exam, n);
  const thirdN = over40 ? 24 : 60;

  const lines = [
    `${cls} exam: ${fmtDate(exam)}`,
    age === null ? 'Age assumed 40+' : `Age: ${age}`,
  ];
  let primaryN;
  if (cls === 'Class 1') {
    primaryN = over40 ? 6 : 12;
    lines.push(`First class medical exp: ${fmtDate(eom(primaryN))}`);
    if (over40) lines.push(`Second class medical exp: ${fmtDate(eom(12))}`);
    lines.push(`Third class medical exp: ${fmtDate(eom(thirdN))}`);
  } else if (cls === 'Class 2') {
    primaryN = 12;
    lines.push(`Second class medical exp: ${fmtDate(eom(12))}`);
    lines.push(`Third class medical exp: ${fmtDate(eom(thirdN))}`);
  } else {
    primaryN = thirdN;
    lines.push(`Third class medical exp: ${fmtDate(eom(thirdN))}`);
  }
  return { expiry: eom(primaryN), lines, assumedAge: age === null };
};

const computeTemplateExpiry = (tpl, form) => {
  if (tpl.expiry === 'medical') return computeMedical(form.medical_class, form.exam_date, form.date_of_birth);
  if (tpl.expiry === 'months') {
    const base = parseISO(form.base_date);
    if (!base) return null;
    const expiry = tpl.endOfMonth ? endOfCalendarMonth(base, tpl.months) : addMonthsExact(base, tpl.months);
    return {
      expiry,
      lines: [`${tpl.dateLabel}: ${fmtDate(base)}`, `${tpl.resultLabel}: ${fmtDate(expiry)}`],
      assumedAge: false,
    };
  }
  return null;
};

// Reminder status for a document row
export const getDocStatus = (doc) => {
  const exp = parseISO(doc?.expiry_date);
  if (!exp) {
    if (doc?.is_expired) return { key: 'expired', label: 'Expired', badge: 'bg-red-100 text-red-700' };
    return { key: 'none', label: 'No expiry', badge: 'bg-gray-100 text-gray-600' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { key: 'expired', label: `Expired ${-days} day${-days === 1 ? '' : 's'} ago`, badge: 'bg-red-100 text-red-700' };
  if (days === 0) return { key: 'soon', label: 'Expires today', badge: 'bg-amber-100 text-amber-800' };
  if (days <= DOC_REMINDER_DAYS) return { key: 'soon', label: `Expires in ${days} day${days === 1 ? '' : 's'}`, badge: 'bg-amber-100 text-amber-800' };
  return { key: 'valid', label: `Valid · ${days} days left`, badge: 'bg-green-100 text-green-700' };
};

const detailsToText = (d) => (Array.isArray(d) ? d.join('\n') : (d || ''));
export const getDetailLines = (doc) => {
  if (Array.isArray(doc?.details)) return doc.details.map((x) => String(x));
  if (doc?.details) return String(doc.details).split('\n').filter(Boolean);
  return [];
};

// The documents API field name for the stored file isn't confirmed; try the likely ones.
export const getDocFileUrl = (doc) => {
  const raw = doc?.file_url || doc?.file_path || doc?.path || doc?.url || null;
  if (!raw) return null;
  return getImageUrl(raw) || null;
};
const isImageUrl = (url) => !!url && /\.(jpe?g|png|gif|webp|bmp|heic)$/i.test(String(url).split('?')[0]);

const getMedicalClassNumber = (medicalClass, details) => {
  const fromSelection = String(medicalClass || '').match(/([123])/);
  if (fromSelection) return Number(fromSelection[1]);
  const fromDetails = String(details || '').match(/Class\s*([123])(?:\s*(?:medical|exam|privileges))?/i);
  return fromDetails ? Number(fromDetails[1]) : null;
};

const mergeComputedDetails = (details, tpl, computed) => {
  const lines = detailsToText(details).split('\n').map((line) => line.trim()).filter(Boolean);
  const isMedical = tpl.expiry === 'medical';
  const isMonths = tpl.expiry === 'months';
  const categoryFor = (line) => {
    const lower = line.toLowerCase();
    if (isMedical) {
      if (/^(?:class\s*[123]\s*(?:medical,\s*)?exam:|class\s*[123]\s*medical,\s*exam\b)/i.test(line)) return 'exam';
      if (/^(?:age:|age at exam:|age assumed|age at exam not provided)/i.test(line)) return 'age';
      const tier = lower.match(/^(?:class\s*([123]) privileges until|(?:first|second|third) class medical exp):/i);
      if (tier) return `tier-${tier[1] || ({ first: 1, second: 2, third: 3 }[lower.split(' ')[0]])}`;
      if (/^first class medical exp:/i.test(line)) return 'tier-1';
      if (/^second class medical exp:/i.test(line)) return 'tier-2';
      if (/^third class medical exp:/i.test(line)) return 'tier-3';
    }
    if (isMonths) {
      if (lower.startsWith(`${String(tpl.dateLabel).toLowerCase()}:`)) return 'base';
      if (lower.startsWith(`${String(tpl.resultLabel).toLowerCase()}:`)) return 'result';
    }
    return null;
  };

  computed.lines.forEach((computedLine) => {
    const category = categoryFor(computedLine);
    if (!category) return;
    const index = lines.findIndex((line) => categoryFor(line) === category);
    if (index >= 0) lines[index] = computedLine;
    else lines.push(computedLine);
  });
  return lines.join('\n');
};

const updatePrimaryExpiryDetail = (details, tpl, medicalClass, expiryISO) => {
  const expiry = parseISO(expiryISO);
  if (!expiry) return details;
  const date = fmtDate(expiry);
  const lines = detailsToText(details).split('\n');

  if (tpl.expiry === 'medical') {
    const classNumber = getMedicalClassNumber(medicalClass, details);
    if (!classNumber) return details;
    const tierNames = { 1: 'First', 2: 'Second', 3: 'Third' };
    const canonical = `${tierNames[classNumber]} class medical exp: ${date}`;
    const tierPatterns = {
      1: /^(?:Class\s*1 privileges until|First class medical exp):/i,
      2: /^(?:Class\s*2 privileges until|Second class medical exp):/i,
      3: /^(?:Class\s*3 privileges until|Third class medical exp):/i,
    };
    const index = lines.findIndex((line) => tierPatterns[classNumber].test(line.trim()));
    if (index >= 0) lines[index] = canonical;
    else if (lines.length > 0) lines.push(canonical);
  } else if (tpl.expiry === 'months') {
    const label = String(tpl.resultLabel || 'Expires');
    const index = lines.findIndex((line) => line.trim().toLowerCase().startsWith(`${label.toLowerCase()}:`));
    if (index >= 0) lines[index] = `${label}: ${date}`;
  }
  return lines.filter((line) => line.trim()).join('\n');
};

const inferTemplateKey = (doc) => {
  if (!doc) return 'custom';
  if (doc.template_key && DOCUMENT_TEMPLATES.some((t) => t.key === doc.template_key)) return doc.template_key;
  const title = String(doc.title || '').trim().toLowerCase();
  const hit = DOCUMENT_TEMPLATES.find((t) => t.key !== 'custom' && t.title.toLowerCase() === title);
  return hit ? hit.key : 'custom';
};

// Small thumbnail on each document row
export const DocThumb = ({ url }) => {
  const [failed, setFailed] = useState(false);
  const showImage = url && isImageUrl(url) && !failed;
  const box = "w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden";
  if (!url) {
    return <div className={box}><FiFileText className="text-gray-300" size={20} /></div>;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${box} hover:border-blue-400 transition`} title="Open file">
      {showImage
        ? <img src={url} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
        : <FiFileText className="text-blue-500" size={20} />}
    </a>
  );
};

// ── Add / Edit document modal (shared) ───────────────────────────────────────
const DocumentFormModal = ({ mode, doc, saving, userDob, onClose, onSubmit }) => {
  const [form, setForm] = useState(() => ({
    template_key: mode === 'edit' ? inferTemplateKey(doc) : 'custom',
    title: doc?.title || '',
    expiry_date: doc?.expiry_date ? String(doc.expiry_date).slice(0, 10) : '',
    details: detailsToText(doc?.details),
    medical_class: doc?.medical_class || '',
    exam_date: doc?.exam_date ? String(doc.exam_date).slice(0, 10) : '',
    base_date: doc?.base_date ? String(doc.base_date).slice(0, 10) : '',
    date_of_birth: doc?.date_of_birth ? String(doc.date_of_birth).slice(0, 10) : (userDob ? String(userDob).slice(0, 10) : ''),
  }));
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  const detailsTouched = useRef(mode === 'edit' && detailsToText(doc?.details).length > 0);

  const tpl = getTemplate(form.template_key);
  const computed = computeTemplateExpiry(tpl, form);
  const existingUrl = doc ? getDocFileUrl(doc) : null;

  useEffect(() => {
    if (file && file.type && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const update = (patch) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      const t = getTemplate(next.template_key);
      if (t.expiry === 'none') next.expiry_date = '';
      if (Object.keys(patch).some((k) => COMPUTE_KEYS.includes(k))) {
        const c = computeTemplateExpiry(t, next);
        if (c) {
          next.expiry_date = toISO(c.expiry);
          next.details = detailsTouched.current
            ? mergeComputedDetails(next.details, t, c)
            : c.lines.join('\n');
        }
      } else if (Object.prototype.hasOwnProperty.call(patch, 'expiry_date') && patch.expiry_date) {
        next.details = updatePrimaryExpiryDetail(next.details, t, next.medical_class, patch.expiry_date);
      }
      return next;
    });
  };

  const pickTemplate = (key) => {
    const t = getTemplate(key);
    const prevT = getTemplate(form.template_key);
    const shouldRetitle = !form.title.trim() || form.title === prevT.title;
    update({
      template_key: key,
      ...(shouldRetitle ? { title: key === 'custom' ? '' : t.title } : {}),
    });
  };

  const handlePick = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      showErrorToast('File must be 10MB or smaller');
      return;
    }
    setFile(f);
    setRemoveExistingFile(false);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showErrorToast('Please enter document title');
      return;
    }
    if (tpl.expiry === 'medical' && !form.expiry_date) {
      showErrorToast('Select the medical class and enter the exam date');
      return;
    }
    if (tpl.expiry === 'months' && !form.expiry_date) {
      showErrorToast(`Please enter the ${tpl.dateLabel.toLowerCase()}`);
      return;
    }
    onSubmit({ ...form, file, remove_file: removeExistingFile });
  };

  const inputCls = "w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs font-medium text-gray-700 mb-1";
  const isImageFile = file && file.type && file.type.startsWith('image/');

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">{mode === 'edit' ? 'Edit Document' : 'Add New Document'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none" disabled={saving}>
              <FiX size={24} />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Template picker */}
          <div className="md:col-span-2">
            <label className={labelCls}>Document type</label>
            <select
              value={form.template_key}
              onChange={(e) => pickTemplate(e.target.value)}
              className={inputCls}
            >
              {DOCUMENT_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.title}</option>)}
            </select>
            {tpl.hint && <p className="mt-1 text-xs text-gray-500">{tpl.hint}</p>}
          </div>

          <div>
            <label className={labelCls}>Document Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              className={inputCls}
              placeholder="e.g., Medical Certificate"
            />
          </div>

          {/* Medical inputs */}
          {tpl.expiry === 'medical' && (
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/40 border border-blue-100 rounded-xl p-3">
              <div>
                <label className={labelCls}>Medical class</label>
                <div className="flex gap-2">
                  {MEDICAL_CLASSES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update({ medical_class: c })}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                        form.medical_class === c
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2">
                <div>
                  <label className={labelCls}>Date of exam</label>
                  <input type="date" value={form.exam_date} onChange={(e) => update({ exam_date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date of birth (optional)</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => update({ date_of_birth: e.target.value })} className={inputCls} />
                </div>
              </div>
              <p className="text-xs text-gray-500 sm:col-span-3">
                DOB is used to apply the under-40 / 40-and-over rules. If left blank, 40 or over is assumed (shorter validity).
              </p>
            </div>
          )}

          {/* Months-based inputs (CFI recent experience, TSA training, Flight review) */}
          {tpl.expiry === 'months' && (
            <div>
              <label className={labelCls}>{tpl.dateLabel}</label>
              <input type="date" value={form.base_date} onChange={(e) => update({ base_date: e.target.value })} className={inputCls} />
            </div>
          )}

          {/* Expiry date */}
          {tpl.expiry !== 'none' && (
            <div>
              <label className={labelCls}>
                {tpl.expiry === 'medical' || tpl.expiry === 'months'
                  ? 'Expires (auto-calculated, you can adjust)'
                  : 'Expiry Date (Optional)'}
              </label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => update({ expiry_date: e.target.value })}
                className={inputCls}
              />
            </div>
          )}

          {/* Computed preview */}
          {computed && (
            <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-sm font-semibold text-green-800 mb-1">Expires {fmtDate(computed.expiry)}</p>
              <ul className="text-xs text-green-800/90 space-y-0.5">
                {computed.lines.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
              {computed.assumedAge && (
                <p className="mt-2 text-xs text-amber-700">Add a date of birth for an exact expiry.</p>
              )}
            </div>
          )}

          <div className="md:col-span-2">
            <label className={labelCls}>Description / Details (Optional)</label>
            <textarea
              value={form.details}
              onChange={(e) => { detailsTouched.current = true; update({ details: e.target.value }); }}
              rows="2"
              className={inputCls}
              placeholder="Enter any additional details..."
            />
          </div>

          {/* File / image */}
          <div className="md:col-span-2">
            <label className={labelCls}>Document File {mode === 'edit' && <span className="text-gray-400 font-normal">(leave empty to keep current file)</span>}</label>

            {(previewUrl || (!file && existingUrl && !removeExistingFile)) && (
              <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-2 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded object-contain" />
                ) : isImageUrl(existingUrl) ? (
                  <a href={existingUrl} target="_blank" rel="noopener noreferrer">
                    <img src={existingUrl} alt="Current file" className="max-h-48 rounded object-contain" />
                  </a>
                ) : (
                  <a href={existingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline py-3">
                    <FiFileText size={16} /> View current file
                  </a>
                )}
              </div>
            )}

            {mode === 'edit' && existingUrl && !removeExistingFile && !file && (
              <button
                type="button"
                onClick={() => setRemoveExistingFile(true)}
                className="mb-3 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remove current photo/file
              </button>
            )}
            {removeExistingFile && (
              <p className="mb-3 text-sm text-amber-700">The current photo/file will be removed when you save.</p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition">
                <FiUpload size={15} /> Choose file
                <input type="file" className="sr-only" onChange={handlePick} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,image/*" />
              </label>
              <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition">
                <FiCamera size={15} /> Take photo
                <input type="file" className="sr-only" onChange={handlePick} accept="image/*" capture="environment" />
              </label>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB</p>

            {file && (
              <p className="mt-2 text-sm text-green-600 flex items-center">
                <FiCheck className="mr-1" /> {file.name}
                {isImageFile ? '' : ''}
                <button type="button" onClick={() => setFile(null)} className="ml-2 text-gray-400 hover:text-gray-600"><FiX size={14} /></button>
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {saving ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update Document' : 'Add Document')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DocumentFormModal;

