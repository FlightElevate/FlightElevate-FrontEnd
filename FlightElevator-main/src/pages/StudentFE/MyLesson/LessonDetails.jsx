import React, { useState } from "react";
import { Link } from "react-router-dom";
// import { HiHome } from "react-icons/hi";
import { RiHome6Line } from "react-icons/ri";

const LessonDetails = () => {
  const [activeTab, setActiveTab] = useState("Details");

  const lesson = {
    title: "Smooth Landing",
    status: "Pending",
    description: "Lorem ipsum is a dummy text",
    instructor: "123456",
    date: "Jun 15",
    time: "9 AM",
    specialInstructions:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  };

  const statusColors = {
    Pending: "bg-[#FFF1DA] text-[#C47E0A]",
    Ongoing: "bg-[#EBF0FB] text-[#113B98]",
    Completed: "bg-[#E1FAEA] text-[#016626]",
  };

  return (
    <div className="flex  flex-col px-6 gap-6">
      <div className="flex  text-sm text-gray-500  gap-4 leading-5.5 tracking-[0px] fw6 font-inter">
        <Link to="/" className="flex items-center  ">
          <RiHome6Line className="text-gray-500 w-5 h-5" />
        </Link>
        <span className="w-4 h-4">{">"}</span>
        <Link to="/my-lessons" className="fw4  text-[#7D7D7D]">
          My Lessons
        </Link>
        <span className="w-4 h-4">{">"}</span>
        <span className="text-[#0A090B] font-medium">{lesson.title}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm ">
        <div className=" border-b border-gray-100">
          <div className="flex items-center justify-between py-5 px-4 border-b border-[#F3F4F6]">
            <div className=" flex flex-col gap-2.5">
              <h1 className="text-xl fw6 text-gray-900 flex items-center gap-4 leading-[100%] tracking-[0px] ">
                {lesson.title}
                <span
                  className={`text-xs px-2 py-1 rounded-[5px] align-middle leading-4.5 tracking-[4%] ${
                    statusColors[lesson.status]
                  }`}
                >
                  {lesson.status}
                </span>
              </h1>
              <p className="text-sm fw4 font-inter leading-5 tracking-[-0.05px] text-[#7F7D83] ">
                {lesson.description}
              </p>
            </div>
          </div>

          <div className="flex border-b border-gray-200 py-3 px-4 gap-4 ">
            {["Details", "Feedback"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? " text-[#262628] bg-[#C6E4FF]"
                    : " text-[#8A8A8A] hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Details" && (
          <div className="flex flex-col  text-base fw4  leading-6 tracking-[0%] gap-6 p-4 ">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-3">
              <div className="flex flex-col gap-3">
                <h3 className="fw6 text-[#101828]">Instructor</h3>
                <p className=" text-[#3D3D3D]">{lesson.instructor}</p>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="fw6 text-[#101828]">Date</h3>
                <p className=" text-[#3D3D3D]">{lesson.date}</p>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="fw6 text-[#101828]">Time</h3>
                <p className=" text-[#3D3D3D]">{lesson.time}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <h3 className="text-base text-[#101828] leading-[100%] tracking-[0px] fw6">
                Special Instructions
              </h3>
              <p className="text-[#344054]">{lesson.specialInstructions}</p>
            </div>
          </div>
        )}

        {activeTab === "Feedback" && (
          <div className=" flex flex-col gap-2 p-5 text-sm">
            <h3 className="text-base text-[#101828] leading-[100%] tracking-[0px] fw6">
              Feedback
            </h3>
            <p className="text-[#344054] leading-6 tracking-[0%]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonDetails;
