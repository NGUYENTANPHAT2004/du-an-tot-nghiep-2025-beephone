import './AdminLayout.scss'
import { SideBar } from './SideBar'
import { useSearchParams } from 'react-router-dom'
import { TheLoaiLayoutAdmin } from '../TheLoaiLayout'
import { BlogLayout } from '../BlogLayout'
import {  DanhmucLayout} from '../Danhmuclayout'
import { MaGiamGiaLayout } from '../MaGiamGiaLayout'
function TrangChuLayout () {
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') || 'Trang chủ'

  return (
    <div className='trangchu_container'>
      <SideBar activeTab={tabFromUrl} />
      <div className='admin_body'>
        {tabFromUrl === 'Sản Phẩm' && <TheLoaiLayoutAdmin />}
        {tabFromUrl === 'Blog' && <BlogLayout />}
        {tabFromUrl === 'Danh Mục' && <DanhmucLayout />}
        {tabFromUrl === 'Mã Giảm Giá' && <MaGiamGiaLayout />}
      </div>
    </div>
  )
}

export default TrangChuLayout
