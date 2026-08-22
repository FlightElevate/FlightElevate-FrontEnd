import React, { useState, useEffect } from "react";

const Pagination = ({
  page,
  setPage,
  perPage = 10,
  setPerPage,
  totalItems,
  options = [10, 25, 50],
  fullWidth = true,
}) => {
  // The select must never display a value other than the one in effect. Several pages
  // initialise perPage to 5 or 15, which are not in the default options - a <select> whose
  // value matches no <option> silently falls back to rendering the first one. Splice the
  // current value in so the control always reflects reality. (ISSUE-016)
  const selectOptions = React.useMemo(
    () => (options.includes(perPage) ? options : [...options, perPage].sort((a, b) => a - b)),
    [options, perPage]
  );

  if (import.meta.env.DEV && !options.includes(perPage)) {
    console.warn(
      `Pagination: perPage=${perPage} is not in options [${options}] - it has been added to the list.`
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const start = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);

  const [inputVal, setInputVal] = useState(String(page));

  useEffect(() => {
    setInputVal(String(page));
  }, [page]);

  const handlePerPageChange = (e) => {
    const next = Number(e.target.value);
    if (typeof setPerPage === "function") {
      setPerPage(next);
      setPage(1);
    }
  };

  const handleInputSubmit = (e) => {
    if (e.key && e.key !== 'Enter') return;
    let newPage = parseInt(inputVal, 10);
    if (isNaN(newPage) || newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;
    setPage(newPage);
    setInputVal(String(newPage));
  };

  return (
    <div
      className={`flex flex-col lg:flex-row items-center justify-between gap-4 py-3 text-[#6C6C6C] ${
        fullWidth ? "w-full" : "w-auto"
      }`}
    >
      <div className="text-sm">
        Showing <span className="font-semibold text-slate-800">{start}-{end}</span> from{" "}
        <span className="font-semibold text-slate-800">{totalItems}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 transition hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setPage(1)}
          disabled={page === 1}
          title="First Page"
        >
          &laquo;
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 transition hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          title="Previous Page"
        >
          &lsaquo;
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleInputSubmit}
            onBlur={handleInputSubmit}
            className="w-14 h-8 px-2 text-center text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            aria-label="Page number"
          />
          <span className="text-sm">of {totalPages}</span>
        </div>

        <button
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 transition hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          title="Next Page"
        >
          &rsaquo;
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 transition hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          title="Last Page"
        >
          &raquo;
        </button>
      </div>

      {typeof setPerPage === "function" ? (
        <div className="flex items-center gap-2 text-sm">
          <span>Show</span>
          <select
            value={perPage}
            onChange={handlePerPageChange}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:border-blue-500"
            aria-label="Rows per page"
          >
            {selectOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>rows</span>
        </div>
      ) : (
        <div className="hidden lg:block w-32"></div>
      )}
    </div>
  );
};

export default Pagination;
