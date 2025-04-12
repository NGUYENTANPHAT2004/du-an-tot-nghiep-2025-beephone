import React, { useEffect, useState } from "react";
import "./ListBlog.scss";
import { MdKeyboardArrowRight } from "react-icons/md";
import { Link } from "react-router-dom";

const ListBlog = () => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3005/getblog")
      .then((response) => response.json())
      .then((data) => setBlogs(data))
      .catch((error) => console.error("Error fetching blogs:", error));
  }, []);

  return (
    <div className="listblog_container">
      <div className="news-list">
        <div className="news-header">Tin tức</div>
        <div className="news-items">
          {blogs.slice(0, 3).map((blog) => (
            <div key={blog._id} className="news-item">
              <div className="news-thumbnail">
                <img src={blog.img_blog} alt={blog.tieude_blog} />
              </div>
              <div className="news-content">
                <a
                  href={`/chitietblog/${blog.tieude_khongdau}`}
                  className="news-title"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {blog.tieude_blog}
                </a>
                <p className="news-date">{blog.ngay_tao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="title-product">
        <Link to={`/tintuc`} className="see-all">
          Xem tất cả{" "}
          <MdKeyboardArrowRight
            style={{
              color: "#0066CC",
              fontSize: "20px",
              display: "inline",
              marginLeft: "5px",
            }}
          />
        </Link>
      </div>
    </div>
  );
};

export default ListBlog;
