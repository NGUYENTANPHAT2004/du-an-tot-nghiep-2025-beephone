import React from "react";
import "./Footer.scss";
import { FaFacebook } from "react-icons/fa";
import { IoMdMail } from "react-icons/io";
import { SiZalo } from "react-icons/si";
import { IoMdCall } from "react-icons/io";
import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <div className='footer'>
      <div className='container'>
        <div className='column'>
          <img
            src="/logo.png"
            alt="Logo"
            className="logo"
          />
          <p>BeeShop</p>
          <div className="address-container">
            <a href="https://maps.app.goo.gl/z3xmqsCTZzZCacS4A"
              target="_blank"
              rel="noopener noreferrer" className="address">
              Cơ sở 1: Trịnh Văn Bô
            </a>
            <br />
            <br />
            <a href="https://maps.app.goo.gl/KZkD3xqo1Mgpsypt8"
              target="_blank"
              rel="noopener noreferrer" className="address">
              Cơ sở 1: Cầu diễn
            </a>
          </div>
          <p>
            <IoMdCall /> 0813783419
          </p>
          <p>
            <IoMdMail /> tttp1704@gmail.com
          </p>
        </div>
        <div className="crack-column-tong">

          <div class="crack-column"></div>
        </div>
        <div className='column'>
          <h3>THÔNG TIN</h3>
          <ul>
            <li><Link to={"/"}>Về chúng tôi</Link></li>
            <li><Link to={"/lien-he"}>Liên hệ</Link></li>
            <li><Link to={"/doi-tra"}>Thu cũ đổi mới</Link></li>
            <li><Link to={"/huong-dan-mua-hang"}>Hướng dẫn mua hàng</Link></li>
            <li><Link to={"/huong-dan-thanh-toan"}>Hướng dẫn thanh toán</Link></li>
           
          </ul>
          <h3>ĐĂNG KÝ TƯ VẤN</h3>
          <p>
            Hãy để lại thông tin để được tư vấn sản phẩm chất lượng tốt nhất, phù hợp với nhu cầu của bạn.
          </p>
          <form>
            <input type="text" placeholder="Họ và tên" />
            <input type="text" placeholder="Số điện thoại" />
            <button type="submit">TƯ VẤN CHO TÔI</button>
          </form>
        </div>


        <div className="crack-column-tong">

          <div class="crack-column"></div>
        </div>
        <div className='column'>
          <h3>GIỚI THIỆU</h3>
          <p>
            BeeShop là website giới thiệu các sản phẩm về điện thoại , có tất cả các dòng điện thoại mới nhất mang thương hiệu BeeShop.
          </p>
          <h3>KẾT NỐI VỚI CHÚNG TÔI</h3>
          <div className='socialIcons'>
            <FaFacebook
              className="icons"
              onClick={() => window.open("https://www.facebook.com/dothoconghuong/", "_blank")}
            />

            <IoMdMail className="icons" />
            <IoMdCall
              className="icons"
              onClick={() => window.location.href = "tel:0985963784"}
            />

            <SiZalo className="icons" onClick={() => window.open("https://zalo.me/0337252262", "_blank")} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
