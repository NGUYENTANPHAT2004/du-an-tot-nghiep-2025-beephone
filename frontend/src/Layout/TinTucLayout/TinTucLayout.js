import React, { useEffect, useState } from "react";
import "./TinTucLayout.scss";

const TinTucLayout = () => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3005/getblog")
      .then((response) => response.json())
      .then((data) => setBlogs(data.slice(0, 3)))
      .catch((error) => console.error("Error fetching blogs:", error));
  }, []);

  return (
    <div className="tong-blog">
      <h1 className="tieude-blog">Tin tức</h1>
      <div className="news-container-blog">
        {blogs.length > 0 && (
          <div className="news-banner-blog">
            <img src={blogs[0].img_blog} alt={blogs[0].tieude_blog} />
            <div className="news-banner-content-blog">
              <a
                href={`/chitietblog/${blogs[0].tieude_khongdau}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {blogs[0].tieude_blog}
              </a>
            </div>
          </div>
        )}

        <div className="news-list-blog">
          {blogs.slice(1).map((blog) => (
            <div key={blog._id} className="news-item-blog">
              <img src={blog.img_blog} alt={blog.tieude_blog} />
              <div className="news-info-blog">
                <a
                  href={`/chitietblog/${blog.tieude_khongdau}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {blog.tieude_blog}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TinTucLayout;
