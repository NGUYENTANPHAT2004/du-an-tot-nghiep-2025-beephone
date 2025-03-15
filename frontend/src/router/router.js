import { AdminLayout } from "../Layout/Admin/TrangChuLayout";
import { PaySuccess } from "../Layout/ThanhToanThanhCong";
import BaoMat from "./../Layout/DeafaultLayout/HuongDan/BaoMat/BaoMat";
import { TrangChuLayout } from "../Layout/TrangChuLayout";
import { ChiTietLayout } from "../Layout/ChiTietLayout";
import { GioHangLayout } from "../Layout/GioHangLayout";
import TimKiemLayout from "../Layout/TimKiemLayout/TiemKiemLayout";
import DoiTra from '../Layout/DeafaultLayout/HuongDan/DoiTra/DoiTra'
import CamKet from '../Layout/DeafaultLayout/HuongDan/CamKet/CamKet'
import { TimKiemSanPhamLayout } from "../Layout/TimKiemSanPhamLayout";
import GioiThieu from '../Layout/DeafaultLayout/GioiThieu/GioiThieu';
import HuongDanThanhToan from '../Layout/DeafaultLayout/HuongDan/HuongDanThanhToan/HuongDanThanhToan'
import { DangNhapLayout } from '../Layout/Admin/DangNhapLayout'
import ChinhSachVanChuyen from '../Layout/DeafaultLayout/HuongDan/ChinhSachVanChuyen/ChinhSachVanChuyen'
const publicRoutes = [
  { path: "/admin", component: AdminLayout, layout: null },
  { path: "/thanhcong", component: PaySuccess },
  { path: "/bao-mat", component: BaoMat },
  { path: "/", component: TrangChuLayout },
  { path: '/lien-he', component: LienHe },
  { path: '/chinh-sach-van-chuyen', component: ChinhSachVanChuyen },
  { path: '/huong-dan-thanh-toan', component: HuongDanThanhToan },
  { path: '/doi-tra', component:  DoiTra},
  { path: '/cam-ket', component: CamKet },
  { path: '/gioi-thieu', component: GioiThieu },
  { path: '/login-admin', component: DangNhapLayout, layout: null },
  { path: "/cart", component: GioHangLayout },
  { path: "/chitietsanpham/:loaisp/:tieude", component: ChiTietLayout },
  { path: "/search/:keyword", component: TimKiemLayout },
  { path: "/search-sanpham/:keyword", component: TimKiemSanPhamLayout },
];
const privateRoutes = [];
export { publicRoutes, privateRoutes };
