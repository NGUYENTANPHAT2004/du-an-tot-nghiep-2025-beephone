import React from "react";
import Navbar from "./Header/MenuHeader/Navbar";
import { Footer } from "./Footer";
import "../AllBlog/AllBlog.scss";
import HeaderBlog from "../AllBlog/HeaderBlog/HeaderBlog.js";
function AllBlog() {
  return (
    <div className="container-default">
     
      <div className="header-navbar">
        <Navbar />
      </div>
      <HeaderBlog />
      <Footer />
      <div className="floatingbuton">
    
        <Zalo onClick={() => {"https://zalo.me/0337252262"}} />
        <Call />
      </div>
    </div>
  );
}

export default AllBlog;