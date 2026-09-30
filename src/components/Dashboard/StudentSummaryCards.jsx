import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { lessonService } from "../../api/services/lessonService";
import { logbookService } from "../../api/services/logbookService";

const PER_PAGE = 500;
const MAX_PAGES = 1000;
const SINGLE_ENGINE_FIELDS = ["asel_hours", "ases_hours"];
const MULTI_ENGINE_FIELDS = ["amel_hours", "ames_hours"];

const toHours = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getLessons = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.lessons)) return data.lessons;
  if (Array.isArray(response?.lessons)) return response.lessons;
  return [];
};

const getPagination = (response) => {
  const data = response?.data;
  return response?.pagination || response?.meta || data?.pagination || data?.meta || {};
};

const fetchAllPages = async (fetchPage) => {
  const records = [];
  const seenPages = new Set();
  let page = 1;

  while (page <= MAX_PAGES) {
    const response = await fetchPage(page);
    if (response?.success === false) {
      throw new Error(response.message || "Could not load student records.");
    }

    const pageRecords = getLessons(response);
    if (!pageRecords.length) break;

    const signature = pageRecords.map((record) => record?.id ?? `${record?.flight_date}-${record?.lesson_date}`).join("|");
    if (seenPages.has(signature)) break;
    seenPages.add(signature);
    records.push(...pageRecords);

    const pagination = getPagination(response);
    const currentPage = Number(pagination.current_page ?? pagination.page ?? page);
    const lastPage = Number(pagination.last_page ?? pagination.total_pages ?? pagination.lastPage);
    const total = Number(pagination.total ?? pagination.total_count ?? pagination.count);

    if (Number.isFinite(lastPage) && lastPage > 0) {
      if (currentPage >= lastPage) break;
    } else if (Number.isFinite(total) && total >= 0) {
      if (records.length >= total) break;
    } else if (pageRecords.length < PER_PAGE) {
      break;
    }
    page += 1;
  }

  return records;
};

const roundHours = (hours) => Math.round(hours * 10) / 10;

const StudentSummaryCards = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFlightHours: 0,
    totalGroundHours: 0,
    singleEngineHours: 0,
    multiEngineHours: 0,
  });

  useEffect(() => {
    let active = true;
    const studentId = user?.id;

    const fetchStudentStats = async () => {
      if (!studentId) {
        setStats({ totalFlightHours: 0, totalGroundHours: 0, singleEngineHours: 0, multiEngineHours: 0 });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [logbooks, lessons] = await Promise.all([
          fetchAllPages((page) => logbookService.getUserEntries(studentId, { page, per_page: PER_PAGE })),
          fetchAllPages((page) => lessonService.getUserLessons(studentId, { type: "student", page, per_page: PER_PAGE })),
        ]);

        const totals = logbooks.reduce((result, entry) => {
          const totalHours = toHours(entry?.total_hours);
          const singleCategoryHours = SINGLE_ENGINE_FIELDS.reduce((sum, field) => sum + toHours(entry?.[field]), 0);
          const multiCategoryHours = MULTI_ENGINE_FIELDS.reduce((sum, field) => sum + toHours(entry?.[field]), 0);
          const className = `${entry?.aircraft_class || ""} ${entry?.aircraft_category || ""}`.toLowerCase();

          result.totalFlightHours += totalHours;
          if (singleCategoryHours || multiCategoryHours) {
            result.singleEngineHours += singleCategoryHours;
            result.multiEngineHours += multiCategoryHours;
          } else if (className.includes("multi") || className.includes("amel") || className.includes("ames")) {
            result.multiEngineHours += totalHours;
          } else if (className.includes("single") || className.includes("asel") || className.includes("ases")) {
            result.singleEngineHours += totalHours;
          }
          return result;
        }, { totalFlightHours: 0, totalGroundHours: 0, singleEngineHours: 0, multiEngineHours: 0 });

        totals.totalGroundHours = lessons.reduce((sum, lesson) => sum + toHours(lesson?.ground_hours), 0);

        if (active) {
          setStats({
            totalFlightHours: roundHours(totals.totalFlightHours),
            totalGroundHours: roundHours(totals.totalGroundHours),
            singleEngineHours: roundHours(totals.singleEngineHours),
            multiEngineHours: roundHours(totals.multiEngineHours),
          });
        }
      } catch (error) {
        console.error("Error fetching student stats:", error);
        if (active) setStats({ totalFlightHours: 0, totalGroundHours: 0, singleEngineHours: 0, multiEngineHours: 0 });
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStudentStats();
    return () => { active = false; };
  }, [user?.id]);

  const cards = [
    { label: "Total flight time", value: stats.totalFlightHours, detail: "All recorded flight hours", to: "/logbook" },
    { label: "Ground training", value: stats.totalGroundHours, detail: "All recorded ground hours", to: "/my-lessons" },
    { label: "Single engine", value: stats.singleEngineHours, detail: "Single engine flight time", to: "/logbook" },
    { label: "Multi engine", value: stats.multiEngineHours, detail: "Multi engine flight time", to: "/logbook" },
  ];

  return (
    <section aria-labelledby="student-hours-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Training summary</p>
          <h2 id="student-hours-title" className="font-heading mt-1 text-lg font-semibold tracking-tight text-gray-900">Hours overview</h2>
        </div>
        <span className="mb-0.5 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600">All time</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} aria-label={`View ${card.label.toLowerCase()} details`} className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2">
          <article className="h-full rounded-xl border border-[#E8E7E3] bg-[#F7F7F5] px-5 py-4 transition-colors group-hover:border-[#D6D4CE]">
            <p className="font-heading text-sm font-medium text-gray-600">{card.label}</p>
            <p className="font-num mt-4 text-3xl font-semibold leading-none tracking-tight text-gray-950">
              {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-gray-100" /> : card.value}
              {!loading && <span className="ml-1.5 text-sm font-medium text-gray-500">hrs</span>}
            </p>
            <p className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span>{card.detail}</span>
              <span aria-hidden="true" className="text-gray-400 transition-transform group-hover:translate-x-0.5">↗</span>
            </p>
          </article>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default StudentSummaryCards;


