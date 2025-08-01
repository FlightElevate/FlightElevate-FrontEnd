import React, { useState } from "react";
import { HiDotsVertical } from "react-icons/hi"; 
import { Link } from "react-router-dom";

const Announcements = () => {
  const announcements = [
    { date: "Jan 6, 2022", time: "05:51 am", announcement: "Loremipsum is a dummy text" },
    { date: "Jan 6, 2022", time: "02:02 am", announcement: "Loremipsum is a dummy text" },
    { date: "Jan 6, 2022", time: "02:10 pm", announcement: "Loremipsum is a dummy text" },
    { date: "Jan 6, 2022", time: "04:15 am", announcement: "Loremipsum is a dummy text" },
    { date: "Jan 6, 2022", time: "07:40 am", announcement: "Loremipsum is a dummy text" },
  ];

  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white  shadow-xs rounded-lg ">
        
      <div className=" sm:flex-row items-start  justify-between  p-4">
        <div className="bg-white  shadow-xs  ">
            <div className="flex flex-col sm:flex-row items-start   justify-between  px-4 py-5">
               <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
               <Link to="/announcements/compose" className="mt-2 sm:mt-0 px-4 py-2 bg-[#1376CD] text-white rounded-lg hover:bg-blue-700 transition">
                 <button>Compose Announcment</button>
               </Link>
            </div>
        </div>


        <div className="bg-[#FFFFFF] inset-shadow-sm shadow-sm rounded-xl  mt-3 ">
          
        <div className="overflow-x-auto  border-gray-200">

          <table className="table-auto w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-sm sm:text-base">Date</th>
                <th className="px-6 py-3 text-sm sm:text-base text-[#475467]">Time</th>
                <th className="px-6 py-3 text-sm sm:text-base text-[#475467]">Announcement</th>
                <th className="w-10 text-right px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 relative text-[#475467]">
                  <td className="px-3 py-4 text-sm sm:text-base">{item.date}</td>
                  <td className="px-3 py-4 text-sm sm:text-base">{item.time}</td>
                  <td className="px-3 py-4 text-sm sm:text-base">{item.announcement}</td>
                  <td className="px-4 py-4 text-right relative">
                    <button
                      onClick={() => toggleMenu(index)}
                      className="p-2 rounded-full hover:bg-gray-200"
                    >
                      <HiDotsVertical className="w-5 h-5 text-gray-500" />
                    </button>

                    {openMenu === index && (
                      <div className="absolute right-4 mt-1 mr-4 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => alert(`Edit announcement on ${item.date}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full text-left px-4 py-1 text-sm text-red-600 hover:bg-gray-100"
                          onClick={() => alert(`Delete announcement on ${item.date}`)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                
              ))}
              <tr>
                <td colSpan="3" className="h-15"></td>
              </tr>
            </tbody>
          </table>
          
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

export default Announcements;
