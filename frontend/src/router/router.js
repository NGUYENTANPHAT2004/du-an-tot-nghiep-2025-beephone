import { AdminLayout } from "../Layout/Admin/TrangChuLayout";
import { PaySuccess } from "../Layout/ThanhToanThanhCong";
import BaoMat from "./../Layout/DeafaultLayout/HuongDan/BaoMat/BaoMat";
import { TrangChuLayout } from '../Layout/TrangChuLayout'
const publicRoutes = [
  { path: "/admin", component: AdminLayout, layout: null },
  { path: "/thanhcong", component: PaySuccess },
  { path: "/bao-mat", component: BaoMat },
  { path: '/', component: TrangChuLayout },
  
];
const privateRoutes = [];
export { publicRoutes, privateRoutes };
