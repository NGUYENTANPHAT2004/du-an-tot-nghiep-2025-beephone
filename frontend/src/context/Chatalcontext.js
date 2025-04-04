import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useUserContext } from './Usercontext';
import io from 'socket.io-client';

// Import configuration - IMPORTANT FIX: this was missing
const API_URL = process.env.REACT_APP_API_URL || '';
const CHAT_API_KEY = process.env.REACT_APP_CHAT_API_KEY || 'beeshop_secret_chat_api_key_2025';

// Socket connection options
const SOCKET_OPTIONS = {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
};

const ChatAIContext = createContext(null);

export const ChatAIProvider = ({ children }) => {
  const { getUser, getUserPhone } = useUserContext();
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const messagesEndRef = useRef(null);
  
  // Define base URL from environment or fall back to relative path
  const apiBaseUrl = API_URL || '';

  // Connect to socket on mount
  useEffect(() => {
    const MAX_RECONNECT_ATTEMPTS = 5;
    
    const connectToSocket = () => {
      // Use proper socketUrl construction
      const socketUrl = `${apiBaseUrl}/chat`;
      console.log('Connecting to socket at:', socketUrl);
      
      // Create socket connection
      const newSocket = io(socketUrl, SOCKET_OPTIONS);
      
      newSocket.on('connect', () => {
        console.log('✅ Chat socket connected');
        setIsConnected(true);
        setSocket(newSocket);
        setReconnectAttempts(0);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Chat socket disconnected');
        setIsConnected(false);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          setReconnectAttempts(prev => prev + 1);
          console.log(`Reconnect attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
        } else {
          toast.error('Không thể kết nối đến dịch vụ chat. Vui lòng thử lại sau.', {
            position: 'top-right',
            autoClose: 3000
          });
        }
      });

      // Handle AI response
      newSocket.on('ai_message', (response) => {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: response.id,
            text: response.message,
            sender: 'ai',
            source: response.source,
            timestamp: response.timestamp
          }
        ]);
        setIsLoading(false);
      });

      // Handle AI typing
      newSocket.on('ai_typing', () => {
        // Can display typing status here
      });

      // Handle server errors
      newSocket.on('chat_error', (error) => {
        console.error('Chat error:', error);
        
        toast.error(error.message || 'Có lỗi xảy ra khi xử lý tin nhắn', {
          position: 'top-right',
          autoClose: 3000
        });
        
        setIsLoading(false);
      });

      // Handle chat session initialization
      newSocket.on('chat_initialized', (data) => {
        console.log('Chat session initialized:', data);
        setSessionId(data.sessionId);
      });

      // Handle chat history
      newSocket.on('chat_history', (data) => {
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map(msg => ({
            id: msg._id,
            text: msg.message,
            sender: msg.sender,
            source: msg.response?.source,
            timestamp: msg.createdAt
          }));
          
          setMessages(formattedMessages);
        }
      });
    };
    
    connectToSocket();
    
    // Clean up function
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [apiBaseUrl, reconnectAttempts]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check for logged-in user or use guest name
  useEffect(() => {
    const username = getUser();
    if (username) {
      setUserName(username);
    } else {
      // Load guest name from localStorage if available
      const guestName = localStorage.getItem('chat_guest_name');
      if (guestName) {
        setUserName(guestName);
      } else {
        // Generate a random guest name if none exists
        const randomName = `Guest_${Math.floor(Math.random() * 10000)}`;
        setUserName(randomName);
        localStorage.setItem('chat_guest_name', randomName);
      }
    }
  }, [getUser]);

  // Initialize chat session when needed
  useEffect(() => {
    if (isOpen && isConnected && socket && !sessionId && userName) {
      initializeChat();
    }
  }, [isOpen, isConnected, socket, sessionId, userName]);

  // Initialize chat session
  const initializeChat = () => {
    if (!socket || !isConnected) return;
    
    const userData = {
      guestName: userName,
      guestPhone: getUserPhone() || null
    };
    
    console.log('Initializing chat with data:', userData);
    socket.emit('init_chat', userData);
  };

  const toggleChat = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen && !sessionId && socket && isConnected && userName) {
      initializeChat();
    }
  };

  const setGuestName = (name) => {
    if (!name || name.trim() === '') {
      toast.error('Tên khách không được để trống', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }
    
    setUserName(name);
    localStorage.setItem('chat_guest_name', name);
    
    // Initialize chat after setting guest name
    if (isOpen && socket && isConnected) {
      initializeChat();
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    // Ensure we have a name to use
    const sender = userName || `Guest_${Math.floor(Math.random() * 10000)}`;
    
    // Add user message to chat
    const userMessage = {
      text: text,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      // Initialize chat session if needed
      if (!sessionId && socket && isConnected) {
        initializeChat();
        // Give some time for the session to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // If socket is connected, use it for real-time communication
      if (socket && isConnected) {
        socket.emit('user_message', {
          message: text,
          sessionId
        });
      } else {
        // Fallback to REST API if socket is not available
        const phone = getUserPhone();
        
        const response = await axios.post(`${apiBaseUrl}/api/chat`, {
          message: text,
          sessionId,
          guestInfo: { 
            name: sender, 
            phone: phone || null
          }
        }, {
          headers: {
            'x-api-key': CHAT_API_KEY
          }
        });
        
        if (response.data.success) {
          // Save sessionId if we don't have one
          if (!sessionId && response.data.sessionId) {
            setSessionId(response.data.sessionId);
          }
          
          setMessages(prevMessages => [
            ...prevMessages,
            {
              id: response.data.response.id,
              text: response.data.response.message,
              sender: 'ai',
              source: response.data.response.source,
              timestamp: response.data.response.timestamp
            }
          ]);
        } else {
          throw new Error(response.data.message || 'Có lỗi xảy ra');
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      setMessages(prevMessages => [
        ...prevMessages,
        {
          text: 'Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.',
          sender: 'ai',
          timestamp: new Date().toISOString()
        }
      ]);
      
      setIsLoading(false);
      
      toast.error('Không thể kết nối đến dịch vụ chat. Vui lòng thử lại sau.', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const endChat = () => {
    if (!sessionId) return;
    
    if (socket && isConnected) {
      socket.emit('end_chat');
    } else {
      // Fallback to REST API
      axios.post(`${apiBaseUrl}/api/chat/end/${sessionId}`, {}, {
        headers: {
          'x-api-key': CHAT_API_KEY
        }
      })
        .then(() => {
          console.log('Chat session ended');
        })
        .catch(error => {
          console.error('Error ending chat session:', error);
        });
    }
    
    setSessionId(null);
    setMessages([]);
  };

  const loadChatHistory = () => {
    if (!sessionId) return;
    
    if (socket && isConnected) {
      socket.emit('get_history');
    } else {
      // Fallback to REST API
      axios.get(`${apiBaseUrl}/api/chat/history/${sessionId}`, {
        headers: {
          'x-api-key': CHAT_API_KEY
        }
      })
        .then(response => {
          if (response.data.success && response.data.messages) {
            const formattedMessages = response.data.messages.map(msg => ({
              id: msg._id,
              text: msg.message,
              sender: msg.sender,
              source: msg.response?.source,
              timestamp: msg.createdAt
            }));
            
            setMessages(formattedMessages);
          }
        })
        .catch(error => {
          console.error('Error loading chat history:', error);
        });
    }
  };

  const sendFeedback = (messageId, isHelpful, comment = '') => {
    if (!messageId) return;
    
    if (socket && isConnected) {
      socket.emit('message_feedback', {
        messageId,
        isHelpful,
        comment
      });
    } else {
      // Fallback to REST API
      axios.post(`${apiBaseUrl}/api/chat/feedback`, {
        messageId,
        isHelpful,
        comment
      }, {
        headers: {
          'x-api-key': CHAT_API_KEY
        }
      })
        .then(() => {
          toast.success('Cảm ơn bạn đã đánh giá!', {
            position: 'top-right',
            autoClose: 2000
          });
        })
        .catch(error => {
          console.error('Error sending feedback:', error);
        });
    }
  };

  return (
    <ChatAIContext.Provider value={{
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
    }}>
      {children}
    </ChatAIContext.Provider>
  );
};

export const useChatAI = () => {
  const context = useContext(ChatAIContext);
  if (!context) {
    throw new Error('useChatAI must be used within a ChatAIProvider');
  }
  return context;
};

// Export the config objects for other components to use
export { API_URL, CHAT_API_KEY, SOCKET_OPTIONS };