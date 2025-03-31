import { useState, useEffect } from "react";
import "./TrangChuLayout.scss";
import Loading from "../../components/Loading/Loading";
import { MdKeyboardArrowRight } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import Carousel from "../Carousel/Carousel";
import ThanhDinhHuong from "../../components/ThanhDinhHuong/ThanhDinhHuong";
import { Helmet } from "react-helmet";
import ProductCard from "../../components/ProductItem/ProductCard";
import ListBlog from "../../components/ListBlog/ListBlog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
function TrangChuLayout() {
  const [data, setdata] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setkeyword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const fetchdata = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:3005/sanpham");
      const data = await response.json();
      if (response.ok) {
        setdata(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchdata();
  }, []);
  const convertToSlug = (str) => {
    const slug = str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

    return slug.charAt(0).toUpperCase() + slug.slice(1);
  };
  const handleSearch = () => {
    navigate(`/search-sanpham/${keyword}`);
  };
  return (
    <div>
      <Helmet>
        <title>{"Shopdunk"}</title>
      </Helmet>
      {isLoading && <Loading />}
      {!isLoading && (
        <div>
          {location.pathname !== "/" && (
            <ThanhDinhHuong breadcrumbs={[{ label: "Trang Chủ", link: "/" }]} />
          )}
          <Carousel />
          <div className="search_sanpham">
            <label htmlFor="">Tìm kiếm sản phẩm</label>
            <div className="div_input_search">
              <input
                type="text"
                placeholder="Nhập từ khóa"
                value={keyword}
                onChange={(e) => setkeyword(e.target.value)}
              />
              <button className="btn_search_sanpham" onClick={handleSearch}>
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </div>
          {data.map((item) => (
            <div key={item.name} className="div_sanpham">
              <div className="namesp">{item.name}</div>

              <div className="divsp">
                {item.sanpham.slice(0, 4).map((sanpham) => (
                  <ProductCard
                    key={sanpham.name}
                    sanpham={sanpham}
                    nametheloai={item.namekhongdau}
                  />
                ))}
              </div>

              <div className="title-product">
                <Link
                  to={`/san-pham/${convertToSlug(item.name)}`}
                  className="see-all"
                >
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
          ))}
          <div className="trangchu_banner">
            <img src="/2.jpeg" alt="" />
          </div>
          <ListBlog />
        </div>
      )}
    </div>
  );
}

export default TrangChuLayout;
