import "./AdminLayout.scss";
import { SideBar } from "./SideBar";
import { useSearchParams } from "react-router-dom";
import { TheLoaiLayoutAdmin } from "../TheLoaiLayout";
import { BlogLayout } from "../BlogLayout";
import { MaGiamGiaLayout } from "../MaGiamGiaLayout";
import { HoaDonLayout } from "../HoaDonLayout";
import { DoanhThuLayout } from "../DoanhThuLayout";
import { DanhGiaAdminLayout } from "../DanhGiaAdminLayout";
function TrangChuLayout() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "Trang chủ";

  return (
    <div className="trangchu_container">
      <SideBar activeTab={tabFromUrl} />
      <div className="admin_body">
        {tabFromUrl === "Doanh Thu" && <DoanhThuLayout />}
        {tabFromUrl === "Sản Phẩm" && <TheLoaiLayoutAdmin />}
        {tabFromUrl === "Blog" && <BlogLayout />}
        {tabFromUrl === "Hóa đơn" && <HoaDonLayout />}
        {tabFromUrl === "Mã Giảm Giá" && <MaGiamGiaLayout />}
        {tabFromUrl === "Đánh Giá" && <DanhGiaAdminLayout />}
      </div>
    </div>
  );
}

export default TrangChuLayout;
