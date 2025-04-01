import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from "sweetalert2";
const UserContext = createContext(null);

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [welcomeVoucher, setWelcomeVoucher] = useState(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
      }
    }
    
    // Check for stored welcome voucher
    const storedVoucher = localStorage.getItem("welcomeVoucher");
    if (storedVoucher) {
      try {
        setWelcomeVoucher(JSON.parse(storedVoucher));
      } catch (error) {
        console.error("Error parsing welcome voucher:", error);
        localStorage.removeItem("welcomeVoucher");
      }
    }
  }, []);

  const login = async (loginData) => {
    try {
      const { data: responseData } = await axios.post('http://localhost:3005/login_auth', loginData);
      
      // Check for API errors
      if (!responseData || responseData.error) {
        throw new Error(responseData.message || "Tài khoản hoặc mật khẩu không đúng!");
      }
      
      // Make sure phone number is included in stored user data
      const userData = responseData.user || responseData;
      const userWithPhone = {
        ...userData,
        phone: userData.phone || loginData.phone
      };
  
      // Success notification
      toast.success("Đăng nhập thành công! Đang chuyển hướng...", {
        position: "top-right",
        autoClose: 2000
      });
  
      // Store user data in localStorage and state
      localStorage.setItem("user", JSON.stringify(userWithPhone));
      setUser(userWithPhone);
  
      // Redirect after a delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2500);
      
    } catch (error) {
      // Display specific API error or default error
      toast.error(error.response?.data?.message || "Đăng nhập thất bại! Kiểm tra lại tài khoản/mật khẩu.", {
        position: "top-right",
        autoClose: 3000
      });
  
      console.error("Lỗi đăng nhập:", error);
    }
  };
  
  const register = async (registerData) => {
    try {
      const { data: responseData } = await axios.post('http://localhost:3005/register_auth', registerData);
      
      if (!responseData || responseData.error) {
        throw new Error(responseData.message || "Tài khoản hoặc mật khẩu đã tồn tại!");
      }
  
      // Handle welcome voucher if available
      if (responseData.welcomeVoucher) {
        console.log("Welcome voucher received:", responseData.welcomeVoucher);
        setWelcomeVoucher(responseData.welcomeVoucher);
        
        // Store welcome voucher in localStorage to persist through redirects
        localStorage.setItem("welcomeVoucher", JSON.stringify(responseData.welcomeVoucher));
      }
      
      // Success notification
      toast.success("Đăng ký thành công!", {
        position: "top-right",
        autoClose: 2000
      });
  
      // Ensure phone is stored with user data
      const userData = {
        ...responseData.user,
        phone: registerData.phone
      };
      
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      
      // Don't redirect immediately to allow voucher to show
      setTimeout(() => {
        if (responseData.welcomeVoucher) {
          // If there's a welcome voucher, don't redirect automatically
          // User will dismiss the voucher to continue
          console.log("Not redirecting yet - welcome voucher is showing");
        } else {
          window.location.href = "/";
        }
      }, 2000);
      
    } catch (error) {
      // Display API error or default error
      toast.error(error.response?.data?.message || "Tài khoản đã tồn tại hoặc có lỗi xảy ra!", {
        position: "top-right",
        autoClose: 3000
      });
  
      console.error("Lỗi đăng ký:", error);
    }
  };

  const getUserPhone = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return null;
      
      const userData = JSON.parse(storedUser);
      
      // Check different possible paths to the phone property
      return userData?.phone || userData?.user?.phone || null;
    } catch (error) {
      console.error("Error getting user phone:", error);
      return null;
    }
  };

  const getUser = () => {
    try {
      const user = localStorage.getItem("user");
      if (!user) return null;
  
      const parsedUser = JSON.parse(user);
  
      // Check username existence in different possible paths
      return parsedUser?.username || parsedUser?.user?.username || null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };
  
  // Handles welcome voucher dismissal
  const dismissWelcomeVoucher = () => {
    console.log("Dismissing welcome voucher");
    setWelcomeVoucher(null);
    localStorage.removeItem("welcomeVoucher");
    
    // After dismissing, redirect to home if we're on register page
    if (window.location.pathname.includes('/register')) {
      window.location.href = "/";
    }
  };

  const logout = () => {
    if (localStorage.getItem('user')) {
      Swal.fire({
        title: "Bạn có chắc chắn muốn đăng xuất?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Đăng xuất",
        cancelButtonText: "Hủy"
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem("user");
          localStorage.removeItem("welcomeVoucher");
          setUser(null);
          setWelcomeVoucher(null);
          window.dispatchEvent(new Event("userLogout"));
    
          toast.success("Đăng xuất thành công!", {
            position: "top-right",
            autoClose: 2000
          });
        }
      });
    } else {
      toast.info("Bạn chưa đăng nhập", {
        position: "top-right",
        autoClose: 2000
      });
    }
  };

  const loginWithSocial = async (provider, token, phone) => {
    try {
      // Add phone parameter for social login
      const requestData = phone ? { token, phone } : { token };
      const { data } = await axios.post(`http://localhost:3005/auth/${provider}`, requestData);
      
      if(data) {
        // Ensure phone is included in stored data
        const userData = {
          ...data.user || data,
          phone: phone || data.user?.phone || data.phone
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      
      toast.success("Đăng nhập thành công! Đang chuyển hướng...", {
        position: "top-right",
        autoClose: 2000
      });
      
      setTimeout(() => {
        window.location.href = "/";
      }, 2500);
    } catch (error) {
      toast.error(`Đăng nhập với ${provider} thất bại`, {
        position: "top-right",
        autoClose: 2000
      });
    }
  };

  return (
    <UserContext.Provider value={{ 
      login, 
      register, 
      getUser, 
      getUserPhone,
      logout, 
      loginWithSocial, 
      user, 
      welcomeVoucher,
      dismissWelcomeVoucher
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};