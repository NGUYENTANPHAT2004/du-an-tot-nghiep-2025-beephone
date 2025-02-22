import { AdminLayout } from '../Layout/Admin/TrangChuLayout'


const publicRoutes = [
  { path: '/admin', component: AdminLayout, layout: null },
]
const privateRoutes = []
export { publicRoutes, privateRoutes }
