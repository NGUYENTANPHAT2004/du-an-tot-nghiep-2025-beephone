import { AdminLayout } from "../Layout/Admin/TrangChuLayout";
import { PaySuccess } from "../Layout/ThanhToanThanhCong";
import BaoMat from "./../Layout/DeafaultLayout/HuongDan/BaoMat/BaoMat";
import { TrangChuLayout } from "../Layout/TrangChuLayout";
import { ChiTietLayout } from "../Layout/ChiTietLayout";
import { GioHangLayout } from "../Layout/GioHangLayout";
import TimKiemLayout from "../Layout/TimKiemLayout/TiemKiemLayout";
import { TimKiemSanPhamLayout } from "../Layout/TimKiemSanPhamLayout";
const publicRoutes = [
  { path: "/admin", component: AdminLayout, layout: null },
  { path: "/thanhcong", component: PaySuccess },
  { path: "/bao-mat", component: BaoMat },
  { path: "/", component: TrangChuLayout },
  { path: "/cart", component: GioHangLayout },
  { path: "/chitietsanpham/:loaisp/:tieude", component: ChiTietLayout },
  { path: "/search/:keyword", component: TimKiemLayout },
  { path: "/search-sanpham/:keyword", component: TimKiemSanPhamLayout },
];
const privateRoutes = [];
export { publicRoutes, privateRoutes };
