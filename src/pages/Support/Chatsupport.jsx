import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiMic } from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";
import { MdAttachFile } from "react-icons/md";
import emoji from "../../assets/SVG/emoji.svg";
import profile_chat from "../../assets/img/profile_chat.jpg";
import sender from "../../assets/SVG/sender.svg";
import echo from "../../echo";
import { supportService } from "../../api/services/supportService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const ChatSupport = () => {
  const { id: ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachmentType, setAttachmentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null); // { file, type, url, name }
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const emojiRef = useRef(null);
  const attachRef = useRef(null);
  const audioBlobRef = useRef(null);

  // Fetch ticket details and messages
  useEffect(() => {
    const fetchTicketData = async () => {
      if (!ticketId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch ticket details
        const ticketResponse = await supportService.getTicket(ticketId);
        if (ticketResponse.success) {
          setTicket(ticketResponse.data);
        }

        // Fetch messages
        const messagesResponse = await supportService.getMessages(ticketId);
        if (messagesResponse.success) {
          const formattedMessages = (messagesResponse.data || []).map((msg) => ({
            id: msg.id,
            message: msg.message,
            sender_id: msg.sender_id || msg.sender?.id,
            sender: msg.sender || {},
            created_at: msg.created_at,
            message_type: msg.message_type || 'text',
            attachment_url: msg.attachment_url,
            file_name: msg.file_name,
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error fetching ticket data:', error);
        toast.error('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [ticketId]);

  // Subscribe to Reverb channel for real-time messages
  useEffect(() => {
    if (!ticketId) return;

    const channelName = `support-ticket.${ticketId}`;
    console.log('Subscribing to channel:', channelName);
    
    const channel = echo.private(channelName);

    // Handle subscription success
    channel.subscribed(() => {
      console.log('Successfully subscribed to channel:', channelName);
    });

    // Handle subscription error
    channel.error((error) => {
      console.error('Error subscribing to channel:', error);
      toast.error('Failed to connect to real-time updates');
    });

    // Listen for new messages
    // When using broadcastAs(), Laravel Echo listens to the custom event name
    // The backend broadcasts as 'message.sent' (from broadcastAs method)
    // Also try listening to the class name as fallback
    const handleMessage = (payload) => {
      console.log('Received real-time message:', payload);
      const newMessage = {
        id: payload.id,
        message: payload.message,
        sender_id: payload.sender?.id,
        sender: payload.sender || {},
        created_at: payload.created_at,
        message_type: payload.message_type || 'text',
        attachment_url: payload.attachment_url,
        file_name: payload.file_name,
      };

      // Add message in real-time (check for duplicates to avoid re-adding add check in new Message Added instead of previous)
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === newMessage.id);
        if (exists && newMessage?.sender_id !== user.id) {
          console.log('Message already exists, skipping:', newMessage.id);
          return prev;
        }
        console.log('Adding new message:', newMessage);
        if(newMessage?.sender_id == user.id){
          return [...prev];
        }else{

          return [...prev, newMessage];
        }
      });

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    // Listen to the custom event name (from broadcastAs)
    channel.listen('.message.sent', handleMessage);
    

    return () => {
      console.log('Leaving channel:', channelName);
      echo.leave(channelName);
    };
  }, [ticketId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Click outside handlers
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

  // Send message via API
  const handleSend = async () => {
    if ((!inputMessage.trim() && !attachmentPreview) || !ticketId || sending) return;

    setSending(true);
    try {
      let response;
      
      // If there's an attachment preview, send it
      if (attachmentPreview) {
        const formData = new FormData();
        
        // Always recreate File object from blob to ensure it's valid
        let fileToSend = null;
        let blobToUse = null;
        
        // For audio: Get blob from state or ref (fallback)
        if (attachmentPreview.type === 'audio') {
          blobToUse = attachmentPreview.blob || audioBlobRef.current;
          
          if (blobToUse && blobToUse instanceof Blob) {
            const fileExtension = attachmentPreview.mimeType?.includes('mp4') ? 'm4a' : 
                                 attachmentPreview.mimeType?.includes('ogg') ? 'ogg' : 'webm';
            const fileName = attachmentPreview.name || `audio_${Date.now()}.${fileExtension}`;
            const mimeType = attachmentPreview.mimeType || 'audio/webm';
            
            fileToSend = new File([blobToUse], fileName, { 
              type: mimeType
            });
            
            console.log('Created audio File:', {
              name: fileToSend.name,
              type: fileToSend.type,
              size: fileToSend.size,
              isFile: fileToSend instanceof File
            });
          }
        } 
        // For regular files (image, video, document)
        else if (attachmentPreview.file && attachmentPreview.file instanceof File) {
          fileToSend = attachmentPreview.file;
          console.log('Using existing File:', {
            name: fileToSend.name,
            type: fileToSend.type,
            size: fileToSend.size,
            isFile: fileToSend instanceof File
          });
        } 
        // Fallback: try to create from blob
        else if (attachmentPreview.blob && attachmentPreview.blob instanceof Blob) {
          blobToUse = attachmentPreview.blob;
          const fileExtension = attachmentPreview.mimeType?.includes('mp4') ? 'm4a' : 
                             attachmentPreview.mimeType?.includes('ogg') ? 'ogg' : 
                             attachmentPreview.name?.split('.').pop() || 'bin';
          const fileName = attachmentPreview.name || `file_${Date.now()}.${fileExtension}`;
          const mimeType = attachmentPreview.mimeType || 'application/octet-stream';
          
          fileToSend = new File([blobToUse], fileName, { 
            type: mimeType
          });
        }
        
        // CRITICAL VALIDATION: Ensure file is valid before appending
        if (!fileToSend) {
          console.error('No file to send. attachmentPreview:', attachmentPreview);
          toast.error('No file found. Please try recording/selecting again.');
          setSending(false);
          return;
        }
        
        if (!(fileToSend instanceof File)) {
          console.error('Invalid file object type:', typeof fileToSend, fileToSend);
          toast.error('Invalid file object. Please try again.');
          setSending(false);
          return;
        }
        
        if (fileToSend.size === 0) {
          console.error('File is empty:', fileToSend);
          toast.error('File is empty. Please try again.');
          setSending(false);
          return;
        }
        
        // Append file to FormData
        formData.append('attachment', fileToSend, fileToSend.name);
        
        formData.append('message', inputMessage || attachmentPreview.name || '');
        formData.append('message_type', attachmentPreview.type);
        
        // Debug: Verify FormData contents
        console.log('FormData verification:', {
          hasAttachment: formData.has('attachment'),
          attachmentType: formData.get('attachment')?.constructor?.name,
          attachmentSize: formData.get('attachment')?.size,
          message: formData.get('message'),
          message_type: formData.get('message_type'),
        });
        
        response = await supportService.sendMessage(ticketId, formData);
      } else {
        // Send text message only
        response = await supportService.sendMessage(ticketId, {
          message: inputMessage,
          message_type: 'text',
        });
      }

      if (response.success) {
        // Add message immediately for better UX (optimistic update)
        const sentMessage = {
          id: response.data?.id || Date.now(),
          message: inputMessage || attachmentPreview?.name || '',
          sender_id: user?.id,
          sender: user || {},
          created_at: new Date().toISOString(),
          message_type: attachmentPreview?.type || 'text',
          attachment_url: response.data?.attachment_url,
          file_name: response.data?.file_name || attachmentPreview?.name,
        };
        
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === sentMessage.id);
          if (exists) return prev;
          return [...prev, sentMessage];
        });
        
        setInputMessage("");
        setShowEmojiPicker(false);
        setAttachmentPreview(null);
        setShowPreview(false);
        
        // Clean up audio URL if exists
        if (attachmentPreview?.url && attachmentPreview.type === 'audio') {
          URL.revokeObjectURL(attachmentPreview.url);
        }
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        
        // Real-time update will also come via Reverb, but we show it immediately
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !ticketId) return;

    // Determine message type based on file type
    let messageType = 'document';
    if (file.type.startsWith('image/')) {
      messageType = 'image';
    } else if (file.type.startsWith('video/')) {
      messageType = 'video';
    } else if (file.type.startsWith('audio/')) {
      messageType = 'audio';
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentPreview({
        file: file,
        type: messageType,
        url: reader.result,
        name: file.name,
      });
      setShowPreview(true);
      setShowAttachmentMenu(false);
    };
    
    if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      reader.readAsDataURL(file);
    } else {
      // For documents, just show file name
      setAttachmentPreview({
        file: file,
        type: messageType,
        url: null,
        name: file.name,
      });
      setShowPreview(true);
      setShowAttachmentMenu(false);
    }
    
    e.target.value = "";
  };

  const handleMicClick = async () => {
    if (recording && mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine the best MIME type supported by the browser
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        if (chunks.length === 0) {
          toast.error('No audio recorded');
          return;
        }
        
        const blob = new Blob(chunks, { type: mimeType });
        audioBlobRef.current = blob; // Store blob in ref for reliable access
        
        // Create preview URL for audio
        const audioUrl = URL.createObjectURL(blob);
        const fileExtension = mimeType.includes('mp4') ? 'm4a' : 
                             mimeType.includes('ogg') ? 'ogg' : 'webm';
        const fileName = `audio_${Date.now()}.${fileExtension}`;
        
        // Show preview instead of sending immediately
        // Store blob reference and metadata, but create File object when sending
        setAttachmentPreview({
          blob: blob, // Keep blob for preview URL and file creation
          type: 'audio',
          url: audioUrl,
          name: fileName,
          mimeType: mimeType,
        });
        setShowPreview(true);
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        toast.error('Error recording audio');
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      setMediaRecorder(recorder);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error("Microphone permission denied or not available.");
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

  const handleCompleteTicket = async () => {
    if (!ticketId) return;
    
    try {
      const response = await supportService.completeTicket(ticketId);
      if (response.success) {
        toast.success('Ticket marked as complete');
        // Update ticket status
        setTicket((prev) => prev ? { ...prev, status: 'closed' } : null);
      } else {
        toast.error('Failed to complete ticket');
      }
    } catch (error) {
      console.error('Error completing ticket:', error);
      toast.error('Failed to complete ticket');
    }
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return { time: "", date: "" };
    try {
      const date = new Date(dateString);
      const time = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateStr = date.toLocaleDateString();
      return { time, date: dateStr };
    } catch {
      return { time: "", date: "" };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'normal':
        return 'text-blue-500';
      case 'low':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto p-6 bg-[#F9F9F9] min-h-screen font-sans flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticketId || !ticket) {
    return (
      <div className="mx-auto p-6 bg-[#F9F9F9] min-h-screen font-sans">
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-600">No ticket selected. Please select a ticket from the support list.</p>
          <button
            onClick={() => navigate('/support')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Support
          </button>
        </div>
      </div>
    );
  }

  const isMyMessage = (senderId) => {
    // Convert both to numbers for comparison to handle string/number mismatch
    const currentUserId = user?.id ? Number(user.id) : null;
    const messageSenderId = senderId ? Number(senderId) : null;
    return currentUserId !== null && messageSenderId !== null && currentUserId === messageSenderId;
  };

  return (
    <div className="mx-auto p-6 bg-[#F9F9F9] min-h-screen font-sans">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Support Detail
      </h1>

      <div className="bg-white p-4 rounded shadow flex justify-between items-start">
        <div className="flex flex-col gap-5 flex-1">
          <div className="flex justify-between items-center">
            <h2 className="text-lg fw6 text-[#030204F7]">
              {ticket.user?.name || 'Unknown User'}{" "}
              {ticket.priority && (
                <span className={`text-sm fw5 ${getPriorityColor(ticket.priority)}`}>
                  ({ticket.priority})
                </span>
              )}
            </h2>
          </div>
          <p className="text-sm text-gray-600">
            {ticket.description || 'No description provided'}
          </p>
        </div>
        {ticket.status !== 'closed' && (
          <button
            onClick={handleCompleteTicket}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded whitespace-nowrap ml-4"
          >
            Mark As Complete
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow mt-6 flex flex-col justify-between">
        <div className="border-b border-[#EAECF0] pb-4 mb-4">
          <h3 className="text-md font-semibold text-gray-800 mb-1">
            {ticket.title || 'Support Ticket'}
          </h3>
          <div className="text-sm text-gray-500 flex items-center space-x-4">
            <img
              src={ticket.user?.avatar || profile_chat}
              alt="profile"
              className="w-8 h-8 rounded-full"
            />
            <span>{ticket.user?.name || 'Unknown'}</span>
            <span>|</span>
            <span>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}</span>
            {messages.length > 0 && (
              <>
                <span>|</span>
                <span>Last Reply: {formatDateTime(messages[messages.length - 1]?.created_at).time}</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6 pl-10 overflow-y-auto max-h-[60vh] pr-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              // Use sender_id or fallback to sender.id for proper comparison
              const senderId = msg.sender_id || msg.sender?.id;
              const isUser = isMyMessage(senderId);
              const { time, date } = formatDateTime(msg.created_at);
              const bubbleBase = `max-w-[603px] w-auto px-5 py-3 text-sm flex items-center break-words`;
              const bubbleStyle = isUser
                ? "bg-[#EDF2FE] text-gray-800 rounded-tr-lg rounded-bl-lg rounded-br-lg"
                : "bg-[#F1F1F1] text-gray-800 rounded-tl-lg rounded-br-lg rounded-bl-lg";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="flex flex-col items-center space-y-1">
                      <img
                        src={msg.sender?.avatar || profile_chat}
                        alt="avatar"
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="text-[10px] text-gray-500 text-center leading-tight">
                        <p>{time}</p>
                        <p>{date}</p>
                      </div>
                    </div>
                  )}

                  <div className={`${bubbleBase} ${bubbleStyle}`}>
                    {msg.message_type === 'image' && msg.attachment_url && (
                      <div className="flex flex-col gap-2">
                        <img 
                          src={msg.attachment_url} 
                          alt={msg.file_name || "Image attachment"} 
                          className="max-w-[300px] max-h-[300px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(msg.attachment_url, '_blank')}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block';
                            }
                          }}
                        />
                        <div style={{ display: 'none' }} className="text-sm text-gray-600">
                          📷 Image: {msg.file_name || msg.message}
                        </div>
                      </div>
                    )}
                    {msg.message_type === 'image' && !msg.attachment_url && (
                      <span>📷 {msg.file_name || msg.message}</span>
                    )}
                    {msg.message_type === 'video' && msg.attachment_url && (
                      <div className="flex flex-col gap-2">
                        <video 
                          src={msg.attachment_url} 
                          controls 
                          className="max-w-[300px] max-h-[300px] rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block';
                            }
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                        <div style={{ display: 'none' }} className="text-sm text-gray-600">
                          🎬 Video: {msg.file_name || msg.message}
                        </div>
                      </div>
                    )}
                    {msg.message_type === 'video' && !msg.attachment_url && (
                      <span>🎬 {msg.file_name || msg.message}</span>
                    )}
                    {msg.message_type === 'audio' && msg.attachment_url && (
                      <div className="flex flex-col gap-2">
                        <audio 
                          src={msg.attachment_url} 
                          controls 
                          className="w-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block';
                            }
                          }}
                        >
                          Your browser does not support the audio tag.
                        </audio>
                        <div style={{ display: 'none' }} className="text-sm text-gray-600">
                          🎵 Audio: {msg.file_name || msg.message}
                        </div>
                      </div>
                    )}
                    {msg.message_type === 'audio' && !msg.attachment_url && (
                      <span>🎵 {msg.file_name || msg.message}</span>
                    )}
                    {(msg.message_type === 'document' || msg.message_type === 'file') && (
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
                        <span className="text-2xl">📎</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {msg.file_name || msg.message.replace(/^📎\s*/, '')}
                          </p>
                          <p className="text-xs text-gray-500">Document</p>
                        </div>
                        {msg.attachment_url && (
                          <a
                            href={msg.attachment_url}
                            download={msg.file_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    )}
                    {msg.message_type === 'text' && (
                      <span>{msg.message}</span>
                    )}
                    {!msg.message_type && (
                      <span>{msg.message}</span>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex flex-col items-center space-y-1">
                      <img
                        src={msg.sender?.avatar || user?.avatar || profile_chat}
                        alt="avatar"
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="text-[10px] text-gray-500 text-center leading-tight">
                        <p>{time}</p>
                        <p>{date}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex flex-col border-t border-[#F1F1F1] pt-4 gap-2 rounded-xl relative">
          {/* Preview Section - shows above input when attachment is selected */}
          {showPreview && attachmentPreview && (
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
              {attachmentPreview.type === 'image' && attachmentPreview.url && (
                <img 
                  src={attachmentPreview.url} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              {attachmentPreview.type === 'video' && attachmentPreview.url && (
                <video 
                  src={attachmentPreview.url} 
                  controls 
                  className="w-16 h-16 rounded"
                />
              )}
              {attachmentPreview.type === 'audio' && attachmentPreview.url && (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">🎤</span>
                  <audio 
                    src={attachmentPreview.url} 
                    controls 
                    className="flex-1 max-w-[200px] h-8"
                  />
                </div>
              )}
              {(attachmentPreview.type === 'document' || !attachmentPreview.url) && (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">📎</span>
                  <span className="text-sm text-gray-700 truncate max-w-[200px]">
                    {attachmentPreview.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  setShowPreview(false);
                  setAttachmentPreview(null);
                  if (attachmentPreview.url && attachmentPreview.type === 'audio') {
                    URL.revokeObjectURL(attachmentPreview.url);
                  }
                }}
                className="ml-auto text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-4">
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
            className="p-2 rounded-full hover:bg-gray-100 emoji-button"
          >
            <img src={emoji} alt="emoji" className="w-6 h-6" />
          </button>

          <input
            type="text"
            placeholder={showPreview ? "Add a message (optional)..." : "Type a message here"}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
            className="flex-1 px-4 py-3 bg-white text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
          />

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          <MdAttachFile
            className="text-gray-500 text-2xl ml-4 cursor-pointer attach-button"
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
            className={`w-10 h-10 ml-4 cursor-pointer ${sending ? 'opacity-50' : ''}`}
            onClick={handleSend}
          />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
