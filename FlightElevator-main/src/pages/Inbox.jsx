import React, { useState, useRef, useEffect } from "react";
import {
  FiSearch,
  FiMoreHorizontal,
  FiVideo,
  FiPaperclip,
  FiImage,
  FiPhone,
} from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Chat_pro from "../assets/img/Chat_pro.png";
import EmojiPicker from "emoji-picker-react";
import { MdFilterList } from "react-icons/md";

const Inbox = () => {
  const [chats] = useState([
    {
      id: 1,
      name: "Katherine Moss",
      username: "@kathy-Support",
      lastSeen: "Online",
      lastMessage:
        "You: Sure thing, I’ll have a look today. They’re looking great!",
      time: "20min ago",
      avatar: Chat_pro,
      online: true,
      messages: [
        {
          id: 1,
          sender: "Katherine Moss",
          message:
            "Thanks Olivia! Almost there. I’ll work on making those changes you suggested and will shoot it over.",
          time: "10:16 AM",
          date: "Thursday",
          type: "received",
        },
        {
          id: 2,
          sender: "Katherine Moss",
          message:
            "Hey Olivia, I’ve finished with the requirements doc! I made some notes in the gdoc as well for Phoenix to look over.",
          time: "11:40 AM",
          date: "Thursday",
          type: "received",
        },
        {
          id: 3,
          sender: "You",
          message: "Awesome! Thanks. I’ll look at this today.",
          time: "11:41 AM",
          date: "Thursday",
          type: "sent",
        },
      ],
    },
  ]);

  const [selectedChat, setSelectedChat] = useState(chats[0]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);

  const callMenuRef = useRef(null);
  const chatBodyRef = useRef(null);
  const emojiRef = useRef(null);
  const menuRef = useRef(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [selectedChat]);

  const addMessage = (content, contentType = "text") => {
    const newMsg = {
      id: Date.now(),
      sender: "You",
      message: content,
      type: "sent",
      contentType,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: "Today",
    };

    setSelectedChat((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));
  };

  const handleSend = () => {
    if (!input.trim()) return;
    addMessage(input, "text");
    setInput("");
  };

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileURL = URL.createObjectURL(file);
    if (type === "image") addMessage(fileURL, "image");
    else if (type === "video") addMessage(fileURL, "video");
    else if (type === "audio") addMessage(fileURL, "audio");
    else addMessage(file.name, "file");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        (!emojiRef.current || !emojiRef.current.contains(e.target)) &&
        (!menuRef.current || !menuRef.current.contains(e.target))
      ) {
        setShowEmojiPicker(false);
        setShowActionMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (type) => {
    if (type === "file") fileInputRef.current.click();
    else if (type === "image") imageInputRef.current.click();
    else if (type === "video") videoInputRef.current.click();
    else if (type === "audio") audioInputRef.current.click();
    setShowActionMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (callMenuRef.current && !callMenuRef.current.contains(event.target)) {
        setShowCallMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="p-2 bg-[#F9FAFB] font-sans justify-center items-center">
      <div className="flex h-[calc(90vh-50px)] bg-white rounded-lg shadow border border-[#E5E7EB]">
        <div className="w-[348px] border-r border-[#E5E7EB] flex flex-col">
          <div className="px-6 py-6 border-b border-[#E5E7EB] flex gap-2 items-center">
            <h2 className="text-xl fw6 text-[#101828]">Messages</h2>
            <span className="text-xs border border-[#E6E6E6] text-[#4F4D55] px-2 py-1 rounded-sm shadow shadow-[#0A090B12]">
              {chats.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`flex items-start gap-3 px-5 py-4 cursor-pointer border-b border-[#EAECF0] ${
                  selectedChat.id === chat.id
                    ? "bg-[#E9F5FF]" 
                    : "bg-white hover:bg-[#F9FAFB]"
                }`}
              >
                <div className="relative">
                  <img
                    src={chat.avatar}
                    alt="profile"
                    className="w-10 h-10 rounded-full  bg-[#A2A8CD] object-cover"
                  />
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#12B76A] border-[1.5px] border-[#FFFFFF] rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center fw4 font-inter">
                    <p className="text-sm fw6 text-[#344054] truncate">
                      {chat.name}
                    </p>
                    <p className="text-sm text-[#475467]">{chat.time}</p>
                  </div>
                  <p className="text-sm text-[#475467]">{chat.username}</p>
                  <p className="text-sm text-[#475467] truncate mt-0.5">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col border-l border-[#E5E7EB]">
          <div className="flex justify-between items-center px-6 py-2.5  border-b border-[#E5E7EB] bg-white">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={selectedChat.avatar}
                  alt="profile"
                  className="w-14 h-14 bg-[#A2A8CD] rounded-full"
                />
                {selectedChat.online && (
                  <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 bg-[#12B76A] border-[1.5px] border-[#FFFFFF] rounded-full"></span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-inter fw6 leading-7  tracking-[0%] text-[#101828]">
                  {selectedChat.name}
                </h3>
                <p className="text-sm text-gray-500">@kathy-Support</p>
              </div>
            </div>

            <div className="relative" ref={callMenuRef}>
              <button
                onClick={() => setShowCallMenu((prev) => !prev)}
                className="flex items-center gap-2 bg-[#FFFFFF] text-[#1376CD] px-3 py-1.5 rounded-md hover:bg-blue-200 border border-[#ECECED]"
              >
                <MdFilterList className="w-[20px] h-[20px]" />
                <span className="text-sm font-medium">Call</span>
              </button>

              {showCallMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-md z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCallMenu(false);
                      alert("Starting voice call...");
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-200 text-gray-700"
                  >
                    <FiPhone className="text-blue-500" />
                    Voice Call
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCallMenu(false);
                      alert("Starting video call...");
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-200 text-gray-700"
                  >
                    <FiVideo className="text-blue-500" />
                    Video Call
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            ref={chatBodyRef}
            className="flex-1 overflow-y-auto px-6 py-4 bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          >
            {selectedChat.messages.map((msg) => {
              const isReceived = msg.type === "received";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 py-1.5 ${
                    isReceived ? "justify-start" : "justify-end"
                  }`}
                >
                  {isReceived && (
                    <div className="relative w-8 h-8">
                      <img
                        src={selectedChat.avatar}
                        alt="receiver"
                        className="w-8 h-8 rounded-full object-cover bg-[#A2A8CD]"
                      />
                      {selectedChat.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#12B76A] border-[1.5px] border-[#FFFFFF] rounded-full"></span>
                      )}
                    </div>
                  )}

                  <div className="max-w-[70%] flex flex-col">
                    <div
                      className={`flex items-center justify-between mb-1 ${
                        isReceived ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          isReceived ? "text-[#344054]" : "text-[#344054]"
                        }`}
                      >
                        {isReceived ? selectedChat.name : "You"}
                      </p>
                      <p
                        className={`text-xs ${
                          isReceived ? "text-[#475467]" : "text-[#475467]"
                        }`}
                      >
                        {msg.date} {msg.time}
                      </p>
                    </div>

                    {msg.contentType === "image" ? (
                      <img
                        src={msg.message}
                        alt="sent"
                        className="rounded-lg max-w-[200px]"
                      />
                    ) : msg.contentType === "video" ? (
                      <video
                        src={msg.message}
                        controls
                        className="rounded-lg max-w-[250px]"
                      />
                    ) : msg.contentType === "audio" ? (
                      <audio controls src={msg.message} className="w-full" />
                    ) : msg.contentType === "file" ? (
                      <a
                        href="#"
                        className="text-sm text-blue-600 underline break-all"
                      >
                        {msg.message}
                      </a>
                    ) : (
                      <div
                        className={`px-4 py-2 text-sm rounded-lg ${
                          isReceived
                            ? "bg-[#F2F4F7] text-[#101828]"
                            : "bg-[#1376CD] text-white"
                        }`}
                      >
                        {msg.message}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col w-[638px] h-26 gap-3 px-6 py-3 border border-[#E5E7EB] rounded-lg bg-white ml-auto mr-2 mb-2">
            <input
              type="text"
              placeholder="Send a message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="w-full text-sm font-inter text-[#667085] outline-none border-none focus:ring-0"
            />

            <div className="flex ml-auto gap-2">
              <div className="flex items-center gap-1">
                <div className="relative" ref={emojiRef}>
                  <BsEmojiSmile
                    className="text-gray-500 text-xl cursor-pointer"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                  />
                  {showEmojiPicker && (
                    <div className="absolute bottom-10 left-0 z-50">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                </div>

                <div className="relative" ref={menuRef}>
                  <FiMoreHorizontal
                    className="text-gray-500 text-xl cursor-pointer hover:text-blue-500"
                    onClick={() => setShowActionMenu((prev) => !prev)}
                  />

                  {showActionMenu && (
                    <div className="absolute bottom-10 left-0 w-36 bg-white border border-gray-200 rounded-lg shadow-md z-50">
                      {[
                        {
                          icon: <FiPaperclip />,
                          label: "Attach File",
                          type: "file",
                        },
                        {
                          icon: <FiImage />,
                          label: "Send Image",
                          type: "image",
                        },
                        {
                          icon: <FiVideo />,
                          label: "Send Video",
                          type: "video",
                        },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMenuClick(item.type);
                          }}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSend}
                className="bg-[#1376CD] text-white px-4 py-2.5 rounded-lg font-inter fw6 text-sm leading-5 border border-[#1376CD] shadow-[0_1px_2px_#1018280D]"
              >
                Send
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e, "file")}
              className="hidden"
            />

            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              onChange={(e) => handleFileUpload(e, "image")}
              className="hidden"
            />
            <input
              type="file"
              accept="video/*"
              ref={videoInputRef}
              onChange={(e) => handleFileUpload(e, "video")}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
