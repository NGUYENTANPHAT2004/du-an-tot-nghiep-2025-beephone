import React, { useState, useRef, useEffect } from "react";
import "./chatai.scss";
import { FaPaperPlane, FaTimes, FaRobot, FaUser, FaTrash, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useChatAI } from "../../../../context/Chatalcontext";
import { useUserContext } from "../../../../context/Usercontext";

const ChatAI = () => {
  const [input, setInput] = useState("");
  const [guestNameInput, setGuestNameInput] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const inputRef = useRef(null);

  const {
    messages,
    isOpen,
    isLoading,
    userName,
    sessionId,
    toggleChat,
    sendMessage,
    clearChat,
    endChat,
    loadChatHistory,
    sendFeedback,
    setGuestName,
    messagesEndRef
  } = useChatAI();

  const { getUser, getUserPhone } = useUserContext();

  // Khi component được mount, kiểm tra xem người dùng đã đăng nhập hay đã có tên khách
  useEffect(() => {
    if (isOpen && !getUser() && !userName) {
      setShowGuestForm(true);
    }
  }, [isOpen, getUser, userName]);

  const handleChatAIClick = () => {
    toggleChat();

    // Focus the input field after a short delay (for animation)
    setTimeout(() => {
      if (inputRef.current && !showGuestForm) {
        inputRef.current.focus();
      }
    }, 300);
  };

  const handleSubmitMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (guestNameInput.trim()) {
      setGuestName(guestNameInput);
      setShowGuestForm(false);

      // Focus vào input tin nhắn sau khi đã nhập tên
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  };

  const handleFeedback = (messageId, isHelpful) => {
    sendFeedback(messageId, isHelpful);
    setFeedbackMessage(messageId);

    // Ẩn feedback sau 3 giây
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "";
    }
  };

  const handleCloseChat = () => {
    // Kết thúc phiên chat nếu có
    if (sessionId) {
      endChat();
    }

    toggleChat();
  };

  return (
    <>
      <div className="circle-chat-ai" onClick={handleChatAIClick}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
          alt="Chat AI"
          className="logo-chat-ai"
        />
        <span style={{ "--i": 0 }}></span>
        <span style={{ "--i": 1 }}></span>
        <span style={{ "--i": 2 }}></span>
        <span style={{ "--i": 3 }}></span>
      </div>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <FaRobot className="robot-icon" />
              <h3>BeeShop Assistant</h3>
            </div>
            <div className="chat-actions">
              <FaTrash className="clear-chat" onClick={clearChat} title="Xóa lịch sử chat" />
              <FaTimes className="close-chat" onClick={handleCloseChat} />
            </div>
          </div>

          {showGuestForm && !userName ? (
            <div className="guest-form-container">
              <form onSubmit={handleGuestSubmit} className="guest-form">
                <h4>Vui lòng nhập tên của bạn để bắt đầu trò chuyện</h4>
                <input
                  type="text"
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  autoFocus
                />
                <button type="submit">Bắt đầu chat</button>
              </form>
            </div>
          ) : (
            <>
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="welcome-message">
                    <FaRobot className="welcome-icon" />
                    <p>Xin chào {userName || 'bạn'}! Tôi là trợ lý ảo của BeeShop. Bạn cần hỗ trợ gì?</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}
                    >
                      <div className="message-avatar">
                        {msg.sender === 'user' ? <FaUser /> : <FaRobot />}
                      </div>
                      <div className="message-content">
                        <div className="message-text">{msg.text}</div>
                        <div className="message-meta">
                          <div className="message-time">{formatTime(msg.timestamp)}</div>

                          {/* Hiện feedback UI cho tin nhắn AI */}
                          {msg.sender === 'ai' && msg.id && feedbackMessage !== msg.id && (
                            <div className="message-feedback">
                              <button
                                onClick={() => handleFeedback(msg.id, true)}
                                title="Hữu ích"
                                className="feedback-button"
                              >
                                <FaThumbsUp />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, false)}
                                title="Không hữu ích"
                                className="feedback-button"
                              >
                                <FaThumbsDown />
                              </button>
                            </div>
                          )}

                          {/* Hiển thị thông báo đã gửi feedback */}
                          {msg.id && feedbackMessage === msg.id && (
                            <div className="feedback-sent">
                              Cảm ơn bạn đã đánh giá!
                            </div>
                          )}

                          {/* Hiển thị nguồn nếu là tin nhắn AI */}
                          {msg.sender === 'ai' && msg.source && (
                            <div className="message-source">
                              {msg.source === 'training' && 'cửa hàng'}
                              {msg.source === 'groq' && 'Groq AI'}
                              {msg.source === 'claude' && 'từ Claude AI'}
                              {msg.source === 'fallback' && 'từ BeeShop'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="message ai-message">
                    <div className="message-avatar">
                      <FaRobot />
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <AiOutlineLoading3Quarters className="loading-icon" />
                        <span>Đang nhập...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input" onSubmit={handleSubmitMessage}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  ref={inputRef}
                />
                <button type="submit" disabled={isLoading || !input.trim()}>
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatAI;