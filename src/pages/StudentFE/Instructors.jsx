import React, { useState, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { useNavigate } from "react-router-dom"; // ✅ import for navigation
import photo from "../../assets/img/photo.jpg";

const Instructors = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const sortRef = useRef(null);
  const navigate = useNavigate(); // ✅ initialize navigate

  const instructorsData = [
    { id: 1, name: "Jenny Wilson", image: "https://randomuser.me/api/portraits/women/1.jpg" },
    { id: 2, name: "Jenny", image: "https://randomuser.me/api/portraits/women/2.jpg" },
    { id: 3, name: "John Wilson", image: "https://randomuser.me/api/portraits/men/3.jpg" },
    { id: 4, name: "Wilson", image: "https://randomuser.me/api/portraits/men/4.jpg" },
    { id: 5, name: "Micale", image: "https://randomuser.me/api/portraits/men/5.jpg" },
    { id: 6, name: "Jenny Wilson", image: "https://randomuser.me/api/portraits/women/6.jpg" },
    { id: 7, name: "Jenny Wilson", image: "https://randomuser.me/api/portraits/men/7.jpg" },
    { id: 8, name: "Jenny Wilson", image: "https://randomuser.me/api/portraits/women/8.jpg" },
    { id: 9, name: "Jenny Wilson", image: "https://randomuser.me/api/portraits/men/9.jpg" },
    { id: 10, name: "Jenny Wilson", image: photo },
  ];

  // Filter by search
  const filteredInstructors = instructorsData.filter((instructor) =>
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  const handleInstructorClick = (id) => {
  navigate(`/instructors/instructorprofile/${id}`);
};


  return (
    <div className="flex flex-col gap-5">
      <div className="border border-[#F3F4F6] bg-white">
        <div className="flex justify-between gap-3 py-5 px-4 border-b border-[#F3F4F6] flex-wrap">
          <h2 className="text-xl font-semibold">Instructors</h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm grow sm:grow-0 w-full">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">⌘</span>
            </div>


            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700"
              >
                <MdFilterList className="w-5 h-5" />
                <span className="whitespace-nowrap">Sort by</span>
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {["Newest", "Oldest"].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setSortOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === option ? "text-blue-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-6 bg-[#FFFFFF]">
        {filteredInstructors.length > 0 ? (
          filteredInstructors.map((instructor) => (
            <div
              key={instructor.id}
              onClick={() => handleInstructorClick(instructor.id)}
              className="cursor-pointer border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all"
            >
              <img
                src={instructor.image}
                alt={instructor.name}
                className="w-full h-[250px] object-cover"
              />
              <div className="px-3 py-2">
                <p className="text-base fw5 leading-6 tracking-[0%] text-[#3D3D3D]">{instructor.name}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm col-span-full py-10 text-center">
            No instructors found.
          </p>
        )}
      </div>
    </div>
  );
};

export default Instructors;
