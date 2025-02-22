import React from "react";
import "./LienHe.scss";
import { Helmet } from "react-helmet";

const LienHe = () => {
    
    return (
        
        <div id="lienHe">
            <Helmet>
        <title>{"Liên Hệ - Shopdunk"}</title>
        <meta name="description" content={"Shopdunk luôn sẵn sàng lắng nghe và hỗ trợ bạn! Nếu bạn có bất kỳ câu hỏi, yêu cầu hoặc cần tư vấn về các sản phẩm đồ thờ và đồ gỗ mỹ nghệ, hãy liên hệ ngay. Đội ngũ của chúng tôi cam kết mang đến cho bạn dịch vụ tốt nhất. 📍 Địa chỉ: Ngã 3 Cát Đằng, Yên Tiến, Ý Yên, Nam Định 📞 Hotline: 0985963784"} />
        <meta name="keywords" content={"Shopdunk, Làng nghề Cát Đằng, Yên Tiến, Ý Yên, Nam Định, Làm Mộc, Tạc Tượng, Tu Sửa Đình Chùa, Nhà Thờ"} />
      </Helmet>
            <div className="lienhe-title">Liên hệ</div>
            <div className="contact-info">
                <div id="name-contact">
                    Cơ sở chuyên buôn bán điện thoại <span className="red">Shopdunk</span>
                </div>

                <p className="description">
                    Địa chỉ: <br />
                    <a href="https://maps.app.goo.gl/z3xmqsCTZzZCacS4A"
            target="_blank"
            rel="noopener noreferrer" className="address-lienhe">
            Cơ sở 1: 202 Trường Chinh, Đống Đa, Hà Nội
          </a>
          <br />
                    <a href="https://maps.app.goo.gl/KZkD3xqo1Mgpsypt8"
                        target="_blank"
                        rel="noopener noreferrer" className="address-lienhe">
                        Cơ sở 1: 203 Trường Chinh, Đống Đa, Hà Nội
                    </a>
                </p>
                <p className="description">
                    Hotline: <span className="red">0985.963.963</span>
                </p>
                <p className="description">
                    Tên chủ cơ sở: <span className="bold">Anh Công</span>
                </p>
                <p className="description">
                    Fanpage:{" "}
                    <a
                        href="https://www.facebook.com/dothoconghuong/"
                        className="red">
                        https://www.facebook.com/shopdunk/
                    </a>
                </p>
                <p className="description">
                    Email: <span className="red">ducbinhnguyennd@gmail.com</span>
                </p>
            </div>
        </div>
    );
};

export default LienHe;
