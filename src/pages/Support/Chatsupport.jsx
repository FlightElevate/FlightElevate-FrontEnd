import React, { useState, useRef, useEffect } from "react";
import { FiMic } from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";
import { MdAttachFile } from "react-icons/md";
import emoji from "../../assets/SVG/emoji.svg";
import profile_chat from "../../assets/img/profile_chat.jpg";
import sender from "../../assets/SVG/sender.svg";


const ChatSupport = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      message:
        "Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin.",
      sender: "user",
      time: "6:21 PM",
      date: "4th July",
      avatar: profile_chat,
    },
    {
      id: 2,
      message:
        "Cras sit amet nibh libero, in gravida nulla. Nulla vel met scelerisque ante sollicitudin. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis.",
      sender: "receiver",
      time: "6:21 PM",
      date: "4th July",
      avatar: "https://i.pravatar.cc/40?img=5",
    },
    {
      id: 3,
      message:
        "Cras sit amet nibh libero, in gravida nulla. Nulla vel met scelerisque ante sollicitudin. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis.",
      sender: "user",
      time: "6:21 PM",
      date: "4th July",
      avatar: profile_chat,
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachmentType, setAttachmentType] = useState("");
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const emojiRef = useRef(null);
  const attachRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target) &&
        !event.target.closest(".emoji-button")
      ) {
        setShowEmojiPicker(false);
      }

      if (
        attachRef.current &&
        !attachRef.current.contains(event.target) &&
        !event.target.closest(".attach-button")
      ) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      message: inputMessage,
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: new Date().toLocaleDateString(),
      avatar: "msg.avatar",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
  };

 const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileURL = URL.createObjectURL(file); // Create a blob URL for preview
  let fileMessage;

  if (file.type.startsWith("image/")) {
    fileMessage = <img src={fileURL} alt={file.name} className="w-40 rounded-lg mt-2" />;
  } else if (file.type.startsWith("video/")) {
    fileMessage = (
      <video controls className="w-60 rounded-lg mt-2">
        <source src={fileURL} type={file.type} />
        Your browser does not support the video tag.
      </video>
    );
  } else {
    // For documents, contacts, or other files — show a download link
    fileMessage = (
      <a
        href={fileURL}
        download={file.name}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline mt-2"
      >
        📎 {file.name}
      </a>
    );
  }

  const newMsg = {
    id: Date.now(),
    message: fileMessage,
    sender: "user",
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: new Date().toLocaleDateString(),
    avatar: profile_chat,
  };

  setMessages((prev) => [...prev, newMsg]);
  setShowAttachmentMenu(false);
  e.target.value = ""; // reset file input
};


  const handleMicClick = async () => {
    if (recording) {
      mediaRecorder.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        const audioURL = URL.createObjectURL(blob);

        const newMsg = {
          id: Date.now(),
          message: <audio controls src={audioURL} className="mt-2" />,
          sender: "user",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: new Date().toLocaleDateString(),
          avatar: "msg.avatar",
        };

        setMessages((prev) => [...prev, newMsg]);
      };

      recorder.start();
      setRecording(true);
      setMediaRecorder(recorder);
    } catch (err) {
      alert("Microphone permission denied or not available.");
      console.error(err);
    }
  };

  const handleAttachmentType = (type) => {
    setAttachmentType(type);
    setShowAttachmentMenu(false);

    let acceptTypes = "";
    if (type === "Image") acceptTypes = "image/*";
    else if (type === "Video") acceptTypes = "video/*";
    else if (type === "Document")
      acceptTypes = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";
    else if (type === "Contact") acceptTypes = ".vcf";
    else acceptTypes = "*/*";

    fileInputRef.current.setAttribute("accept", acceptTypes);
    fileInputRef.current.click();
  };

  return (
    <div className="mx-auto p-6 bg-[#F9F9F9] min-h-screen font-sans">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Support Detail
      </h1>

      <div className="bg-white p-4 rounded shadow flex justify-between items-start">
        <div className=" flex flex-col gap-5">
          <div className="flex  justify-between items-center">
            <h2 className="text-lg fw6 text-[#030204F7]">
            Komba Osby{" "}
            <span className="text-red-500 text-sm fw5">(Urgent)</span>
          </h2>
           <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded  ">
          Mark As Complete
        </button>
          </div>
          <p className="text-sm text-gray-600  ">
            Diam, in vitae ante velit suscipit scelerisque commodo urna at. Arcu quam erat ac volutpat sed nunc faucibus id. Tempor adipiscing ultricies odio ipsum sed quis amet, mauris. Diam, in vitae ante velit suscipit scelerisque commodo urna at. Arcu quam erat ac volutpat sed nunc faucibus id. Tempor adipiscing ultricies odio ipsum sed quis amet, mauris.
          </p>
        </div>
       
      </div>

      <div className="bg-white p-6 rounded shadow mt-6 flex flex-col justify-between">
        <div className="border-b border-[#EAECF0] pb-4 mb-4">
          <h3 className="text-md font-semibold text-gray-800 mb-1">
            Payment Issue
          </h3>
          <div className="text-sm text-gray-500 flex items-center space-x-4">
            <img
              src={profile_chat}
              alt="profile"
              className="w-8 h-8 rounded-full"
            />
            <span>David Smith</span>
            <span>|</span>
            <span>21 Feb 2020</span>
            <span>|</span>
            <span>Last Reply: 24 min ago</span>
          </div>
        </div>

        <div className="space-y-6 pl-10 overflow-y-auto max-h-[60vh] pr-4">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const bubbleBase = `max-w-[603px] w-auto px-5 py-3 text-sm flex items-center break-words`;
            const bubbleStyle = isUser
              ? "bg-[#EDF2FE] text-gray-800 rounded-tr-lg rounded-bl-lg rounded-br-lg"
              : "bg-[#F1F1F1] text-gray-800 rounded-tl-lg rounded-br-lg rounded-bl-lg";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  isUser ? "justify-start" : "justify-end"
                }`}
              >
                {isUser && (
                  <div className="flex flex-col items-center space-y-1">
                    <img
                      src={profile_chat}
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="text-[10px] text-gray-500 text-center leading-tight">
                      <p>{msg.time}</p>
                      <p>{msg.date}</p>
                    </div>
                  </div>
                )}

                <div className={`${bubbleBase} ${bubbleStyle}`}>
                  {msg.message}
                </div>

                {!isUser && (
                  <div className="flex flex-col items-center space-y-1">
                    <img
                      src={msg.avatar}
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="text-[10px] text-gray-500 text-center leading-tight">
                      <p>{msg.time}</p>
                      <p>{msg.date}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center border-t border-[#F1F1F1] pt-4 gap-4 rounded-xl relative">
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-10">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}

          {showAttachmentMenu && (
            <div
              ref={attachRef}
              className="absolute bottom-16 right-20 bg-white border rounded-lg shadow-lg w-35 z-20"
            >
              {["Document", "Image", "Video", "Contact", "Other"].map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => handleAttachmentType(type)}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                  >
                    {type === "Document" && " Document"}
                    {type === "Image" && " Image"}
                    {type === "Video" && " Video"}
                    {type === "Contact" && " Contact"}
                    {type === "Other" && " Other File"}
                  </button>
                )
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <img src={emoji} alt="emoji" className="w-6 h-6" />
          </button>

          <input
            type="text"
            placeholder="Type a message here"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 px-4 py-3  bg-white text-gray-800 placeholder-gray-400 focus:outline-none"
          />

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          <MdAttachFile
            className="text-gray-500 text-2xl ml-4 cursor-pointer attach-button "
            onClick={() => setShowAttachmentMenu((prev) => !prev)}
          />

          <FiMic
            className={`text-xl ml-4 cursor-pointer ${
              recording ? "text-red-500 animate-pulse" : "text-gray-500"
            }`}
            onClick={handleMicClick}
          />

          <img
            src={sender}
            alt="send"
            className="w-10 h-10 ml-4 cursor-pointer"
            onClick={handleSend}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
