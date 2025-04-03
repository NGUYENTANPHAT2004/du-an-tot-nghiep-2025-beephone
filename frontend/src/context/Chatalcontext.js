import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useUserContext } from './Usercontext';
import io from 'socket.io-client';

const ChatAIContext = createContext(null);

export const ChatAIProvider = ({ children }) => {
  const { getUser, getUserPhone } = useUserContext();
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Connect to socket on mount
  useEffect(() => {
    const newSocket = io('http://localhost:3005', {
      transports: ['websocket'],
      upgrade: false
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('ai_response', (response) => {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          text: response.message,
          sender: 'ai',
          timestamp: new Date().toISOString()
        }
      ]);
      setIsLoading(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check for logged-in user
  useEffect(() => {
    const username = getUser();
    if (username) {
      setUserName(username);
    } else {
      // Load guest name from localStorage if available
      const guestName = localStorage.getItem('chat_guest_name');
      if (guestName) {
        setUserName(guestName);
      }
    }
  }, [getUser]);

  const toggleChat = () => {
    setIsOpen(prevState => !prevState);
  };

  const setGuestName = (name) => {
    setUserName(name);
    localStorage.setItem('chat_guest_name', name);
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    // Get user identifier - either username or guest name
    const sender = getUser() || userName;
    
    if (!sender) {
      toast.error('Vui lòng nhập tên trước khi gửi tin nhắn', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    // Add user message to chat
    const userMessage = {
      text: text,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      // If socket is connected, use it for real-time communication
      if (socket && isConnected) {
        socket.emit('chat_message', {
          message: text,
          userName: sender,
          phoneNumber: getUserPhone() || 'guest'
        });
      } else {
        // Fallback to REST API if socket is not available
        const response = await axios.post('http://localhost:3005/api/chat', {
          message: text,
          userName: sender,
          phoneNumber: getUserPhone() || 'guest'
        });
        
        setMessages(prevMessages => [
          ...prevMessages,
          {
            text: response.data.reply,
            sender: 'ai',
            timestamp: new Date().toISOString()
          }
        ]);
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

  return (
    <ChatAIContext.Provider value={{
      messages,
      isOpen,
      isLoading,
      userName,
      toggleChat,
      sendMessage,
      clearChat,
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