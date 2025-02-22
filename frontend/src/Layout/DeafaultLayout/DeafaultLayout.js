import React from "react";
import Navbar from "./Header/MenuHeader/Navbar";
import { Footer } from "./Footer";
import Call from "./FloatingChat/Call/Call";
import Zalo from "./FloatingChat/Zalo/Zalo";
import "../DeafaultLayout/DefaultLayout.scss";

function DefaultLayout({ children }) {
  return (
    <div className="container-default">
     
      <div className="header-navbar">
        <Navbar />
      </div>
      <div className="content">{children}</div>
      <Footer />
      <div className="floatingbuton">
    
        <Zalo onClick={() => {"https://zalo.me/0337252262"}} />
        <Call />
      </div>
    </div>
  );
}

export default DefaultLayout;
