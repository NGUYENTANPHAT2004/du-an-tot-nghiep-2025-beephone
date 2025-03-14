import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Swal from "sweetalert2";
const UserContext = createContext(null);

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  

  const getUser = () => {
    try {
      const user = localStorage.getItem("user");
      if (!user) return null; // Nếu không có dữ liệu, trả về null
  
      const parsedUser = JSON.parse(user);
  
      // Kiểm tra username có tồn tại trong `parsedUser` hay không
      return parsedUser?.user?.username || parsedUser?.username || null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
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
          setUser(null);
          window.dispatchEvent(new Event("userLogout"));
    
          toast.success("Đăng xuất thành công!", {
            position: "top-right",
            autoClose: 2000
          });
        }
      });
    } else {
      toast.info("Bạn chưa đăng nhập" ,{
        position: "top-right",
        autoClose: 2000
      });
    }
  };
  const loginWithSocial = async (provider, token) => {
    try {
      const { data } = await axios.post(`http://localhost:3005/auth/${provider}`, { token });
      if(data){
        localStorage.setItem('user', JSON.stringify(data));
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
    <UserContext.Provider value={{ getUser, logout,loginWithSocial,user }}>
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