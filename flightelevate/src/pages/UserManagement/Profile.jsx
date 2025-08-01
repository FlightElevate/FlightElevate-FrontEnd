import React from "react";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";
import gear_filler from "../../assets/SVG/gear-filled.svg";
import profile from "../../assets/img/profile.jpg";

import usersData from "../../data/user";
const Profile = () => {
  const { id } = useParams();

  const allUsers = usersData.flatMap((roleGroup) => roleGroup.data);

  const user = allUsers.find((user) => user.id == id);

  console.log("user", user);

  const profileData = [
    { label: "Name", value: user.name },
    { label: "Certificates", value: ["CFI", "CFII", "MEI"] },

    { label: "Location", value: user.company },
    { label: "Phone", value: user.phone },
    { label: "Email", value: user.email },
    { label: "Username", value: user.username },
    { label: "Balance", value: user.balance },
    { label: "Company", value: user.company },
    { label: "Created", value: user.created },
    { label: "Last Flight", value: user.lastLogin },
    { label: "Last Login", value: user.lastLogin },
  ];

  const certificateColors = {
    CFI: "bg-blue-100 text-blue-700",
    CFII: "bg-red-100 text-red-700",
    MEI: "bg-yellow-100 text-yellow-700",
  };

  const [activeTab, setActiveTab] = useState("profile");

  const data = [
    {
      date: "Jun 15",
      time: "9 AM",
      instructor: "Guy Hawkins",
      status: "Ongoing",
      flightType: "Loremipsum is a dummy text",
    },
    {
      date: "Jun 15",
      time: "9 AM",
      instructor: "Guy Hawkins",
      status: "Ongoing",
      flightType: "Loremipsum is a dummy text",
    },
    {
      date: "Jun 15",
      time: "9 AM",
      instructor: "Guy Hawkins",
      status: "Ongoing",
      flightType: "Loremipsum is a dummy text",
    },
  ];

  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  const documents = [
    {
      title: "User Profile",
      details: ["Expires at: 28/10/2012"],
    },
    {
      title: "Emergency Contact Number",
      details: [],
    },
    {
      title: "Medical Certificate/BasicMed (FFA)",
      details: [
        "1st Class Expired: 28/10/2012",
        "2nd Class Expired: 28/10/2012",
        "3rd Class Expires at: 28/10/2012",
      ],
    },
    {
      title: "Flight Instructor Certificate (FAA)",
      details: ["Expires at: 28/10/2012"],
    },
  ];
  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-xs rounded-lg ">
        <div className=" rounded-b-[8px] shadow-[0px_1px_2px_#0000000D] ">
          <div className="px-3.5 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100">
            <div className="flex items-start gap-4">
              <img
                src={profile}
                alt="User Avatar"
                className="w-12 h-12 rounded-full "
              />
              <div className="flex flex-col">
                <h1 className="text-xl font-bold">Esther Howard</h1>
                <p className="text-gray-600">Esther@example.com</p>
              </div>
            </div>
            <button className="mt-4 sm:mt-0 w-[137px] h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-[#FEEBEB] text-[#F53535] rounded-lg  transition">
              <img src={gear_filler} alt="" className="w-4 h-4" />
              <span className="text-sm font-medium">Block User</span>
            </button>
          </div>
        </div>

        <div className=" bg-white ">
          <div className="px-4 py-3 flex border-b border-gray-200 rouded-xl">
            <button
              className={`text-sm font-medium px-4 py-3 rounded-md transition-colors duration-200 ${
                activeTab === "profile"
                  ? "text-blue-700 bg-blue-100"
                  : "text-gray-700 bg-white hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile Details
            </button>
            <button
              className={`text-sm font-medium px-4 py-2 ml-4 rounded-md transition-colors duration-200 ${
                activeTab === "documents"
                  ? "text-blue-700 bg-blue-100"
                  : "text-gray-700 bg-white hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("documents")}
            >
              Documents
            </button>
          </div>
          {activeTab === "profile" ? (
            <div className="px-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-[20px] gap-y-[20px] text-sm text-gray-700">
                {profileData.map((item, index) => (
                  <div
                    key={index}
                    className="h-[75px] flex flex-col justify-start"
                  >
                    <p className="text-[#8A8A8A] fw6 text-sm mb-[10px]">
                      {item.label}
                    </p>
                    {Array.isArray(item.value) ? (
                      <div className="flex flex-wrap gap-2">
                        {item.value.map((cert, certIndex) => (
                          <span
                            key={certIndex}
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              certificateColors[cert] ||
                              "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#344054] fw4 text-sm">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-7 ">
                <h2 className="text-xl font-inter font-semibold text-[#101828]">
                  Flight Logs
                </h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm flex-grow sm:flex-grow-0 sm:w-[250px]">
                    <FiSearch className="text-gray-400 mr-2" size={16} />
                    <input
                      type="text"
                      placeholder="Search"
                      className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
                    />
                    <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
                      ⌘
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr>
                      <th colSpan={6} className="">
                        <div className="flex items-center h-[40px] text-sm font-medium font-inter text-gray-700 bg-[#F4F4FF] rounded-[10px] px-4">
                          <div className="w-1/6">Date</div>
                          <div className="w-1/6">Time</div>
                          <div className="w-1/6">Instructor</div>
                          <div className="w-1/6">Status</div>
                          <div className="w-2/7">Flight Type</div>
                          <div className="flex justify-center">Action</div>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.map((log, index) => (
                      <tr key={index} className="group">
                        <td colSpan={6} className="py-2">
                          <div className="flex items-center h-[54px] px-4 rounded-[10px] border border-[#DFDFDF] bg-white shadow-sm">
                            <div className="w-1/6">{log.date}</div>
                            <div className="w-1/6">{log.time}</div>
                            <div className="w-1/6">{log.instructor}</div>
                            <div className="w-1/6">
                              <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                                {log.status}
                              </span>
                            </div>
                            <div className="w-2/7 ">{log.flightType}</div>
                            <div className="relative flex justify-end">
                              <FiMoreVertical
                                className="text-gray-500 cursor-pointer"
                                onClick={() => toggleMenu(index)}
                              />
                              {openMenu === index && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                    onClick={() =>
                                      alert(`Edit announcement on ${log.date}`)
                                    }
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    onClick={() =>
                                      alert(
                                        `Delete announcement on ${log.date}`
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="6" className="h-20"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-gray-600 text-sm space-y-4 p-4">
              {documents.map((section, index) => (
                <div
                  key={index}
                  className="border border-[#DFDFDF] rounded-[10px] bg-white shadow-sm px-4 py-3"
                >
                  <div className="flex items-center justify-between flex-wrap">
                    <div className="w-1/6 font-medium whitespace-nowrap">
                      {section.title}
                    </div>

                    {/* Centered details */}
                    <div className="flex-1 flex flex-col items-center">
                      {section.details.map((item, idx) => (
                        <div
                          key={idx}
                          className={`text-center mb-1 ${
                            section.title.includes("Medical") && idx < 2
                              ? "text-red-500"
                              : ""
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    {/* Menu button centered vertically */}
                    <div className="relative w-1/12 flex justify-end items-center">
                      <FiMoreVertical
                        className="text-gray-500 cursor-pointer"
                        onClick={() => toggleMenu(index)}
                      />
                      {openMenu === index && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => alert(`Edit: ${section.title}`)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            onClick={() => alert(`Delete: ${section.title}`)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
