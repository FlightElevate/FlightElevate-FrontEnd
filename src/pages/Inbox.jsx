import React, { useState, useRef, useEffect } from "react";
import { FiImage, FiMoreHorizontal, FiPlus, FiVideo, FiFileText, FiSearch, FiArrowLeft, FiMenu } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import { AiOutlineCheck } from "react-icons/ai";
import EmojiPicker from "emoji-picker-react";
import { messageService } from "../api/services/messageService";
import { showErrorToast } from "../utils/notifications";
import { useAuth } from "../context/AuthContext";
import echo from "../echo";

const Inbox = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatSearch, setNewChatSearch] = useState("");
  const [showChatList, setShowChatList] = useState(false); 

  const chatBodyRef = useRef(null);
  const emojiRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const { user } = useAuth();

  
  const [chatPages, setChatPages] = useState({}); 
  const [loadingMessages, setLoadingMessages] = useState(false);

  const getChats = async () => {
    try {
      const response = await messageService.getConversations();
      if (response.success) setChats(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await messageService.getUsers();
      if (response.success) {
        const users = Array.isArray(response.data) ? response.data : [];
        setAvailableUsers(users);
      }
    } catch (err) {
      showErrorToast("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessages = async (conversationId, loadOlder = false) => {
    if (!conversationId || loadingMessages) return;

    setLoadingMessages(true);

    const page = loadOlder
      ? (chatPages[conversationId]?.page || 1) + 1
      : 1;

    try {
      const response = await messageService.getMessages(conversationId, { page });
      if (response.success) {
        const messages = response.data.reverse(); 

        setSelectedChat(prev => {
          if (!prev || prev.conversation_id !== conversationId) {
            const chat = chats.find(c => c.conversation_id === conversationId);
            return { ...chat, messages };
          } else {
            return {
              ...prev,
              messages: loadOlder ? [...messages, ...prev.messages] : messages,
            };
          }
        });

        setChatPages(prev => ({
          ...prev,
          [conversationId]: {
            page,
            hasMore: messages.length > 0
          }
        }));

        
        setTimeout(() => {
          if (!loadOlder) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
          } else {
            
            const scrollHeightBefore = chatBodyRef.current.scrollHeight;
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight - scrollHeightBefore;
          }
        }, 50);
      }
    } catch {
      showErrorToast("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleStartNewConversation = async (selectedUser) => {
    try {
      const payload = { direct: true, user_id: selectedUser.id };
      const response = await messageService.createConversation(payload);
      if (response.success) {
        
        const conversationData = response.data;
        const newChat = {
          ...conversationData,
          conversation_id: conversationData.id || conversationData.conversation_id,
          user: conversationData.chat_users?.map(cu => cu.user) || [selectedUser],
          messages: []
        };

        
        const existingChatIndex = chats.findIndex(c => c.conversation_id === newChat.conversation_id);
        if (existingChatIndex >= 0) {
          
          setChats(prev => prev.map((c, idx) => idx === existingChatIndex ? newChat : c));
        } else {
          
          setChats(prev => [...prev, newChat]);
        }

        setSelectedChat(newChat);
        setShowUserList(false);
        setNewChatSearch("");

        
        fetchMessages(newChat.conversation_id);
      }
    } catch {
      showErrorToast("Error creating conversation");
    }
  };

  const handleSend = async () => {
    if (!selectedChat || (!input.trim() && !attachment)) return;

    
    if (!selectedChat.conversation_id) {
      showErrorToast("Invalid conversation. Please select a conversation first.");
      return;
    }

    const type = attachment ? "attachment" : "text";
    const data = attachment ? [attachment] : [];

    const payload = { message: input, type, data };

    try {
      const response = await messageService.sendMessage(selectedChat.conversation_id, payload);
      if (response.success) {
        const msgData = response.data;

        setSelectedChat(prev => ({
          ...prev,
          messages: [...prev.messages, msgData],
        }));

        setChats(prev =>
          prev.map(c =>
            c.conversation_id === selectedChat.conversation_id
              ? { ...c, last_message: msgData.body || msgData.data?.[0]?.name }
              : c
          )
        );

        setInput("");
        setAttachment(null);
        setAttachmentPreview(null);
        setShowAttachmentPopup(false);

        setTimeout(() => {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }, 80);
      }
    } catch {
      showErrorToast("Failed to send message");
    }
  };

  const handleMenuClick = (type) => {
    switch (type) {
      case "file": fileInputRef.current.click(); break;
      case "image": imageInputRef.current.click(); break;
      case "video": videoInputRef.current.click(); break;
      case "audio": audioInputRef.current.click(); break;
      default: break;
    }
    setShowActionMenu(false);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({ name: file.name, url: reader.result, type });
      setAttachmentPreview({ url: reader.result, type, name: file.name });
      setShowAttachmentPopup(true);
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiClick = (emojiData) => setInput(prev => prev + emojiData.emoji);

  const handleDownloadAttachment = (item) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    getChats();
    getUsers();
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojiPicker(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowActionMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Refresh users when user list is shown
  useEffect(() => {
    if (showUserList && availableUsers.length === 0) {
      getUsers();
    }
  }, [showUserList]);

  
  const handleScroll = () => {
    if (!chatBodyRef.current || !selectedChat) return;
    if (chatBodyRef.current.scrollTop === 0) {
      const pageData = chatPages[selectedChat.conversation_id];
      if (pageData?.hasMore) {
        fetchMessages(selectedChat.conversation_id, true);
      }
    }
  };

  useEffect(() => {
    const ref = chatBodyRef.current;
    if (ref) ref.addEventListener("scroll", handleScroll);
    return () => {
      if (ref) ref.removeEventListener("scroll", handleScroll);
    };
  }, [selectedChat, chatPages]);

  
  useEffect(() => {
    if (!selectedChat) return;
    const channelName = `chat.${selectedChat.conversation_id}`;
    const channel = echo.private(channelName);

    channel.listen('ChatMessageStored', payload => {
      const message = payload.message;
      if (message.chat_user?.user?.id !== user.id) {
        setSelectedChat(prev => ({
          ...prev,
          messages: [...prev.messages, message],
        }));
        setTimeout(() => {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }, 50);
      }
    });

    return () => echo.leave(channelName);
  }, [selectedChat, user.id]);

  
  const filteredChats = chats.filter(chat =>
    chat.user?.[0]?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredUsers = availableUsers.filter(u => {
    if (!u || !u.name) return false;
    const searchTerm = newChatSearch.toLowerCase().trim();
    if (!searchTerm) return true; // Show all users if search is empty
    return u.name.toLowerCase().includes(searchTerm) || 
           (u.username && u.username.toLowerCase().includes(searchTerm)) ||
           (u.email && u.email.toLowerCase().includes(searchTerm));
  });
  

  const formatMessageTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };


  return (
    <div className="p-2 sm:p-3 bg-[#F9FAFB]">
      <div className="flex h-[calc(90vh-50px)] sm:h-[calc(90vh-50px)] bg-white rounded-lg shadow border border-gray-100 overflow-hidden relative">
        {}
        {showChatList && (
          <div
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setShowChatList(false)}
          />
        )}

        {}
        <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} ${showChatList ? 'flex' : 'hidden md:flex'} absolute md:relative top-0 left-0 w-full md:w-[340px] h-full bg-white border-r border-gray-100 flex-col z-40`}>
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {}
              {selectedChat && (
                <button
                  onClick={() => {
                    setSelectedChat(null);
                    setShowChatList(false);
                  }}
                  className="md:hidden text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Back to messages"
                >
                  <FiArrowLeft size={20} />
                </button>
              )}
              <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
            </div>
            <span className="text-xs bg-gray-100 p-2.5 rounded">{filteredChats.length}</span>
          </div>
          <div className="px-3 py-2">
            <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 min-h-[44px]">
              <FiSearch className="text-gray-500 flex-shrink-0" size={18} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="bg-transparent w-full outline-none text-sm px-2 min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No conversations found</p>
            ) : (
              filteredChats.map((chat) => {
                const lastMessage = chat.last_message;
                const lastMessageTime = chat.last_message_time ? new Date(chat.last_message_time) : null;
                const now = new Date();

                let timeDisplay = "";
                if (lastMessageTime) {
                  const isToday = lastMessageTime.toDateString() === now.toDateString();
                  if (isToday) {
                    const hours = lastMessageTime.getHours();
                    const minutes = lastMessageTime.getMinutes();
                    const ampm = hours >= 12 ? "PM" : "AM";
                    const formattedHours = hours % 12 || 12;
                    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
                    timeDisplay = `${formattedHours}:${formattedMinutes} ${ampm}`;
                  } else {
                    const diffTime = Math.floor((now - lastMessageTime) / (1000 * 60 * 60 * 24));
                    timeDisplay = diffTime === 1 ? "1 day ago" : `${diffTime} days ago`;
                  }
                }

                const isLastMessageMine = chat.lastMessageUserId === user.id;

                return (
                  <div
                    key={chat.conversation_id}
                    onClick={() => {
                      fetchMessages(chat.conversation_id);
                      setShowChatList(false); 
                    }}
                    className={`flex flex-col px-4 sm:px-5 py-3 cursor-pointer border-b border-gray-300 transition min-h-[44px] ${selectedChat?.conversation_id === chat.conversation_id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={chat.user?.[0]?.avatar || "/default-avatar.png"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${chat.user?.[0]?.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-800 truncate">{chat.user?.[0]?.name}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeDisplay}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">@{chat.user?.[0]?.username}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 truncate pl-2">
                      {isLastMessageMine && <span className="font-semibold">You: </span>}
                      <span className="font-bold">{lastMessage}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>



        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {!selectedChat ? (
            <div className="flex flex-col justify-center items-center h-full text-gray-400 px-4">
              <p className="text-center">Select a conversation to start</p>
              {}
              <button
                onClick={() => setShowChatList(true)}
                className="md:hidden mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition min-h-[44px]"
              >
                <FiMenu size={20} className="inline mr-2" />
                View Messages
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-gray-300 bg-white">
                {}
                <button
                  onClick={() => setShowChatList(true)}
                  className="md:hidden text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Open messages"
                >
                  <FiMenu size={20} />
                </button>

                <div className="relative">
                  <img
                    src={selectedChat.user?.[0]?.avatar || "/default-avatar.png"}
                    className="w-12 h-12 rounded-full object-cover"
                  />


                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white 
                      ${selectedChat.user?.[0]?.is_online ? "bg-green-500" : "bg-gray-400"}`}
                  ></span>
                </div>

                <div className="flex flex-col">
                  <p className="font-semibold text-gray-900">{selectedChat.user?.[0]?.name}</p>
                  <p className="text-xs text-gray-500">@{selectedChat.user?.[0]?.username}</p>
                </div>


                <span className={`ml-auto text-xs font-medium px-3 py-1 rounded-full
                    ${selectedChat.user?.[0]?.is_online
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {selectedChat.user?.[0]?.is_online ? "Online" : "Offline"}
                </span>
              </div>


              <div ref={chatBodyRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                {selectedChat.messages?.map((msg) => {
                  const isMine = msg.chat_user?.user?.id === user.id;
                  const time = formatMessageTime(msg.created_at);

                  return (
                    <div key={msg.id} className={`w-full mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`
            relative max-w-[85%] sm:max-w-[65%] px-3 py-2 rounded-lg shadow-sm 
            ${isMine ? "bg-[#DCF8C6] text-gray-800 rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}
            flex flex-wrap items-end gap-1
          `}
                      >

                        {msg.type === "text" && (
                          <span className="font-medium break-words flex-1">
                            {msg.body}
                          </span>
                        )}

                        {msg.type === "attachment" && msg.data?.map((item, idx) => (
                          <div key={idx} className="flex-1 min-w-0">
                            {item.type === "image" ? (
                              <img src={item.url} className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg mb-1 max-w-full" alt="Attachment" />
                            ) : (
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 min-w-0">
                                <span className="text-xl flex-shrink-0">
                                  {item.type === "video" ? "🎬" :
                                    item.type === "audio" ? "🎵" : "📎"}
                                </span>
                                <span className="font-semibold truncate text-sm">{item.name}</span>
                              </div>
                            )}

                            <button
                              className="text-blue-500 text-xs underline block mt-1 min-h-[44px]"
                              onClick={() => handleDownloadAttachment(item)}
                            >
                              Download
                            </button>
                          </div>
                        ))}

                        <span className="text-[10px] text-gray-600 flex items-center whitespace-nowrap ms-5">
                          {time}
                          {isMine && (
                            <span className="ml-1">
                              {msg.status === "sent" && "✓"}
                              {msg.status === "delivered" && "✓✓"}
                              {msg.status === "seen" && <span className="text-blue-500">✓✓</span>}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>


              {showAttachmentPopup && (
                <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg p-4 shadow-md z-50 w-[90%] max-w-md flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {attachmentPreview?.type === "image" ? (
                      <img src={attachmentPreview.url} className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded flex-shrink-0" alt="Preview" />
                    ) : (
                      <span className="text-2xl sm:text-3xl">{attachmentPreview?.type === "video" ? "🎬" : attachmentPreview?.type === "audio" ? "🎵" : "📎"}</span>
                    )}
                    <span className="truncate max-w-[200px] text-sm">{attachmentPreview?.name}</span>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Add a message..."
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-full min-h-[44px]"
                    rows="2"
                  />
                  <button
                    onClick={handleSend}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition min-h-[44px]"
                  >
                    Send
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 sm:p-4 border-t border-gray-300 bg-white">
                <div className="relative flex-shrink-0" ref={emojiRef}>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Emoji picker"
                  >
                    <BsEmojiSmile className="text-xl sm:text-2xl" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full mb-2 left-0 z-50">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                </div>

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type message..."
                  className="flex-1 px-3 sm:px-4 py-2 rounded-xl bg-gray-100 outline-none text-sm min-h-[44px]"
                />

                <div className="relative flex-shrink-0" ref={menuRef}>
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="text-gray-500 hover:text-blue-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="More options"
                  >
                    <FiMoreHorizontal className="text-xl" />
                  </button>
                  {showActionMenu && (
                    <div className="absolute bottom-full mb-2 right-0 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-50">
                      {[
                        { icon: <FiFileText />, label: "Attach File", type: "file" },
                        { icon: <FiImage />, label: "Send Image", type: "image" },
                        { icon: <FiVideo />, label: "Send Video", type: "video" },
                        { icon: <FiVideo />, label: "Send Audio", type: "audio" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleMenuClick(item.type)}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700 min-h-[44px]"
                        >
                          {item.icon}{item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-xl hover:bg-blue-700 transition min-h-[44px] whitespace-nowrap text-sm sm:text-base"
                  onClick={handleSend}
                >
                  Send
                </button>

                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, "file")} />
                <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleFileUpload(e, "image")} />
                <input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, "video")} />
                <input type="file" accept="audio/*" ref={audioInputRef} className="hidden" onChange={(e) => handleFileUpload(e, "audio")} />
              </div>
            </>
          )}
        </div>

        {!showUserList && !selectedChat && (
          <button
            onClick={() => setShowUserList(true)}
            className="absolute bottom-4 left-4 bg-blue-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-blue-700 transition min-w-[56px] min-h-[56px] flex items-center justify-center z-50"
            aria-label="New chat"
          >
            <FiPlus className="text-xl sm:text-2xl" />
          </button>
        )}

        {showUserList && (
          <div className="absolute top-0 left-0 w-full md:w-[340px] h-full bg-white border-r border-gray-100 flex flex-col z-[60]">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-300 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">New Chat</h2>
              <button
                onClick={() => setShowUserList(false)}
                className="text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="px-3 py-2">
              <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 min-h-[44px]">
                <FiSearch className="text-gray-500 flex-shrink-0" size={18} />
                <input
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  placeholder="Search users..."
                  className="bg-transparent w-full outline-none text-sm px-2 min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              {loadingUsers ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400">No users found</p>
                  <p className="text-xs text-gray-400 mt-2">Available: {availableUsers.length}, Filtered: {filteredUsers.length}</p>
                </div>
              ) : (
                filteredUsers.map((userItem) => (
                  <div
                    key={userItem.id}
                    onClick={() => {
                      handleStartNewConversation(userItem);
                      setShowUserList(false); 
                    }}
                    className="flex items-center gap-3 px-4 sm:px-5 py-4 cursor-pointer border-b border-gray-300 hover:bg-gray-50 min-h-[44px]"
                  >
                    <img
                      src={userItem.avatar || "/default-avatar.png"}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        minWidth: '40px', 
                        minHeight: '40px',
                        maxWidth: '40px',
                        maxHeight: '40px',
                        objectFit: 'cover'
                      }}
                      alt={userItem.name}
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{userItem.name || 'No name'}</p>
                      <p className="text-xs text-gray-500 truncate">@{userItem.username || 'no-username'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Inbox;
