import React from "react";

const newsData = [
  {
    title: "Đánh giá MacBook Air M1: MacBook Air M1 có ổn không? Dùng được mấy năm nữa?",
    image: "https://shopdunk.com/images/thumbs/0019069__DSC4273 (1)_1600.jpeg",
    link: "/danh-gia-macbook-air-m-1",
    description: "Đến hiện tại, MacBook Air M1 vẫn là một trong những dòng máy tích hợp chip Apple M1 mạnh mẽ nhất và ấn tượng nhất trên thị trường.",
    date: null,
  },
  {
    title: "11 điều chứng minh MacBook là “đôi bạn cùng tiến” với sinh viên IT",
    image: "https://shopdunk.com/images/thumbs/0018993_hoc-it-co-nen-mua-macbook_1600.jpeg",
    link: "/hoc-it-co-nen-mua-macbook",
    description: "Trước nay, các sản phẩm MacBook của Apple đều nổi tiếng với hiệu năng cao, hệ điều hành Mac OS tối ưu, độ bảo mật cao, hỗ trợ nhiều công cụ lập trình thiết kế hiện đại, rất phù hợp với công việc IT.",
    date: "13/12/2024",
  },
  {
    title: "BLACK FRIDAY - DEAL SLAY, GIÁ RẺ NGẤT NGÂY",
    image: "https://shopdunk.com/images/thumbs/0033149_banner black friday_App_1600.png",
    link: "/black-friday-deal-slay-gi%C3%A1-r%E1%BA%BB-ng%E1%BA%A5t-ng%C3%A2y",
    description: "Đến hẹn lại lên, “Thứ 6 đen tối” đã tới! Hưởng ứng đại hội mua sắm sôi động nhất năm, ShopDunk gửi tới quý khách hàng loạt deal cực khủng, giảm sốc tới 50%...",
    date: "23/11/2024",
  },
];

const NewsList = () => {
  return (
    <div className="news-list">
      {newsData.map((news, index) => (
        <div key={index} className="news-item">
          <div className="news-image">
            <a href={news.link}>
              <img src={news.image} alt={news.title} title={news.title} />
            </a>
          </div>
          <div className="news-content">
            <a className="news-title" href={news.link}>{news.title}</a>
            <p className="news-description">{news.description}</p>
            {news.date && <span className="news-date">{news.date}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsList;