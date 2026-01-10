import React, { useState } from "react";
import arrow_left from "../assets/SVG/arrow_left.svg";
import arrow_right from "../assets/SVG/arrow_right.svg";

const Pagination = ({
  page,
  setPage,
  perPage,
  setPerPage,
  totalItems,
  options = [10, 25, 50],
  fullWidth = true,
}) => {
  const [open, setOpen] = useState(false);
  const totalPages = Math.ceil(totalItems / perPage);

  return (
    <div
      className={`flex flex-col md:flex-row justify-center gap-2 py-3 text-[#6C6C6C] 
        ${fullWidth ? "w-full" : "w-1/2"}`}
    >
      <div className="flex items-center justify-center flex-wrap gap-2 h-auto">

        <button
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg border border-gray-300 transition disabled:opacity-50 hover:bg-gray-50"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          <img src={arrow_left} alt="Prev" className="w-4 h-4 sm:w-5 sm:h-5" style={{ minWidth: '16px', minHeight: '16px' }} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg font-medium text-xs sm:text-sm text-[#4F4D55] transition 
              ${
                num === page
                  ? "border border-[#1751D0] text-[#1751D0] font-semibold"
                  : "border border-transparent hover:border-[#1751D0] hover:bg-[#eaf0fc]"
              }`}
            onClick={() => setPage(num)}
          >
            {num}
          </button>
        ))}

        <button
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg border border-gray-300 transition disabled:opacity-50 hover:bg-gray-50"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
        >
          <img src={arrow_right} alt="Next" className="w-4 h-4 sm:w-5 sm:h-5" style={{ minWidth: '16px', minHeight: '16px' }} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
