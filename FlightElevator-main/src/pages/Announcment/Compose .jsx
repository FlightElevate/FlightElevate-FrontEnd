import React from 'react'

const Compose = () => {
  return (
    
      <div className=" sm:flex-row items-start  justify-between border-b border-gray-100 ">
        <div className="bg-white  shadow-xs  mt-3 px-4 py-5">
         <h2 className="text-xl font-semibold text-gray-800 mt-2 mb-2 ">Add Announcements</h2>
      </div> 
    <div className="bg-white  shadow-xs  mt-1 px-4 py-2">
       
      <div className="md:mb-4">
        <label className="block text-gray-700 font-inter text-sm mt-2 mb-3">
          Announcment Title
        </label>
        <input  name="title "  placeholder="Enter..."
        className="w-lg border border-gray-300 rounded-md p-2 focus:outline-none "/>
      </div>

        <div className="md:mb-4">
          <label  className="block text-gray-700 font-inter text-sm mt-3 mb-2">
            Description
          </label>
          <input    name="description"  placeholder="Enter..."
          className="w-full  border border-gray-300 rounded-md px-2 pt-2 pb-26 focus:outline-none "/>
        </div>

      <div className="flex space-x-8">
 
        <button className="flex items-center space-x-2 px-4 py-2 border border-[#D0D5DD] text-black rounded-lg ">
          <input  type="checkbox"
           className="w-4 h-4 appearance-none border bg-[#FFFFFF] border-black rounded-full checked:bg-blue-700"
          />
          <span>In App</span>
        </button>

        <button className="flex items-center space-x-2 px-4 py-2 border border-[#D0D5DD] text-black rounded-lg ">
          <input type="checkbox"
           className="w-4 h-4 appearance-none border bg-[#FFFFFF] border-black rounded-full checked:bg-blue-700"
          />
          <span>Email</span>
       </button>

        <button className="flex items-center space-x-2 px-4 py-2 border  border-[#D0D5DD] text-black rounded-lg">
          <input  type="checkbox"
           className="w-4 h-4 appearance-none border border-black bg-[#FFFFFF] rounded-full checked:bg-[#1376CD]"
         />
          <span>Both</span>
        </button>
      </div>
      <div className='flex justify-end space-x-2'>
        <button className=" space-x-2 px-4 py-2 bg-[#F6F6F6] text-black rounded-lg "> 
          Cancle</button>
        <button className=" space-x-2 px-4 py-2 bg-[#1376CD]  text-black rounded-lg ">
          Save</button>
      </div>
    </div> 

    </div>
  );
};

export default Compose 