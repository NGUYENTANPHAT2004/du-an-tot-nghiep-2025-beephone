import { AdminLayout } from "../Layout/Admin/TrangChuLayout";
import { PaySuccess } from "../Layout/ThanhToanThanhCong";
import BaoMat from "./../Layout/DeafaultLayout/HuongDan/BaoMat/BaoMat";
import { TrangChuLayout } from "../Layout/TrangChuLayout";
import { ChiTietLayout } from "../Layout/ChiTietLayout";
import { GioHangLayout } from "../Layout/GioHangLayout";
const publicRoutes = [
  { path: "/admin", component: AdminLayout, layout: null },
  { path: "/thanhcong", component: PaySuccess },
  { path: "/bao-mat", component: BaoMat },
  { path: "/", component: TrangChuLayout },
  { path: "/cart", component: GioHangLayout },
  { path: "/chitietsanpham/:loaisp/:tieude", component: ChiTietLayout },
];
const privateRoutes = [];
export { publicRoutes, privateRoutes };
