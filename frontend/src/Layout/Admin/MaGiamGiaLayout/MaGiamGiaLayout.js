import { useState, useEffect } from 'react'
import { FaEdit, FaPlus, FaMegaphone, FaRegClock } from 'react-icons/fa'
import { FaTrashCan, FaServer } from 'react-icons/fa6'
import { AddMaGiamGia} from './AddMaGiamGia'
import { UpdateMaGiamGia } from './UpdateMaGiamGia'
import { XoaMaGiamGia } from './XoaMaGiamGia'
import {ServerWideVoucher} from './ServerWideVoucher'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './MaGiamGiaLayout.scss'

function MaGiamGiaLayout() {
  const [data, setData] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenXoaTL, setisOpenXoaTL] = useState(false)
  const [isOpenCapNhat, setisOpenCapNhat] = useState(false)
  const [isOpenServerWide, setIsOpenServerWide] = useState(false)
  const [filterType, setFilterType] = useState('all') // 'all', 'normal', 'serverWide', 'goldenHour'

  const fetchdata = async () => {
    try {
      const response = await fetch('http://localhost:3005/getmagg')
      if (response.ok) {
        const data = await response.json()
        setData(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchdata()
  }, [])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      // Only select IDs that match the current filter
      const filteredData = filterData(data, filterType)
      setSelectedIds(filteredData.map(item => item._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectItem = id => {
    let newSelectedIds = [...selectedIds]
    if (newSelectedIds.includes(id)) {
      newSelectedIds = newSelectedIds.filter(itemId => itemId !== id)
    } else {
      newSelectedIds.push(id)
    }
    setSelectedIds(newSelectedIds)

    // Check if all items in the current filter are selected
    const filteredData = filterData(data, filterType)
    setSelectAll(newSelectedIds.length === filteredData.length && 
      filteredData.every(item => newSelectedIds.includes(item._id)))
  }

  const handleServerWideVoucherCreated = (voucherData) => {
    toast.success(`Mã giảm giá toàn server đã được tạo: ${voucherData.code}`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
    fetchdata()
  }

  // Function to filter data based on the selected filter type
  const filterData = (data, filterType) => {
    switch(filterType) {
      case 'serverWide':
        return data.filter(item => item.isServerWide === true)
      case 'goldenHour':
        return data.filter(item => item.goldenHourStart !== 'Không giới hạn' && 
                                  item.goldenHourEnd !== 'Không giới hạn')
      case 'normal':
        return data.filter(item => item.isServerWide !== true &&
                                 (item.goldenHourStart === 'Không giới hạn' || 
                                  item.goldenHourEnd === 'Không giới hạn'))
      default:
        return data
    }
  }

  // Get the filtered data based on current filter type
  const filteredData = filterData(data, filterType)

  return (
    <div className='theloai_container'>
      <div className='nav_chucnang'>
        <button className='btnthemtheloai' onClick={() => setIsOpen(true)}>
          <FaPlus className='icons' />
          Thêm mã giảm giá
        </button>
        <button
          className='btnthemtheloai'
          onClick={() => {
            if (selectedIds.length === 0) {
              alert('Chọn một mã giảm giá để cập nhật')
            } else if (selectedIds.length > 1) {
              alert('Chỉ được chọn một mã giảm giá để cập nhật')
            } else {
              setisOpenCapNhat(true)
            }
          }}
        >
          <FaEdit className='icons' />
          Cập nhật
        </button>
        <button
          className='btnthemtheloai'
          onClick={() =>
            selectedIds.length > 0
              ? setisOpenXoaTL(true)
              : alert('Chọn mã giảm giá để xóa')
          }
        >
          <FaTrashCan className='icons' />
          Xóa mã giảm giá
        </button>
        <button
          className='btnthemtheloai btn-server-wide'
          onClick={() => setIsOpenServerWide(true)}
        >
          <FaServer className='icons' />
          Tạo mã giảm giá toàn server
        </button>
      </div>

      <div className='filter-options'>
        <span>Lọc mã giảm giá:</span>
        <div className='filter-buttons'>
          <button 
            className={filterType === 'all' ? 'active' : ''} 
            onClick={() => setFilterType('all')}
          >
            Tất cả
          </button>
          <button 
            className={filterType === 'normal' ? 'active' : ''} 
            onClick={() => setFilterType('normal')}
          >
            Mã giảm giá thường
          </button>
          <button 
            className={filterType === 'serverWide' ? 'active' : ''} 
            onClick={() => setFilterType('serverWide')}
          >
            <FaServer className='filter-icon' />
            Mã giảm giá toàn server
          </button>
          <button 
            className={filterType === 'goldenHour' ? 'active' : ''} 
            onClick={() => setFilterType('goldenHour')}
          >
            <FaRegClock className='filter-icon' />
            Mã khung giờ vàng
          </button>
        </div>
      </div>

      <table className='tablenhap'>
        <thead>
          <tr>
            <th>
              <input
                type='checkbox'
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
            <th>STT</th>
            <th>ID</th>
            <th>Mã giảm giá</th>
            <th>Ngày bắt đầu</th>
            <th>Ngày kết thúc</th>
            <th>Số lượng</th>
            <th>Phần trăm</th>
            <th>Giá trị tối thiểu</th>
            <th>Giá trị tối đa</th>
            <th>Khung giờ vàng</th>
            <th>Ngày áp dụng</th>
            <th>Loại</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={item._id} className={item.isServerWide ? 'server-wide-row' : ''}>
              <td>
                <input
                  type='checkbox'
                  checked={selectedIds.includes(item._id)}
                  onChange={() => handleSelectItem(item._id)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{item._id}</td>
              <td>{item.magiamgia}</td>
              <td>{item.ngaybatdau}</td>
              <td>{item.ngayketthuc}</td>
              <td>{item.soluong}</td>
              <td>{item.sophantram}%</td>
              <td>{item.minOrderValue.toLocaleString('vi-VN')}đ</td>
              <td>{item.maxOrderValue === 'Không giới hạn' ? 'Không giới hạn' : `${parseInt(item.maxOrderValue).toLocaleString('vi-VN')}đ`}</td>
              <td>
                {item.goldenHourStart !== 'Không giới hạn' && item.goldenHourEnd !== 'Không giới hạn' 
                  ? `${item.goldenHourStart} - ${item.goldenHourEnd}`
                  : 'Không giới hạn'
                }
              </td>
              <td>{item.daysOfWeek}</td>
              <td>
                {item.isServerWide 
                  ? <span className="type-badge server-wide"><FaServer /> Toàn server</span>
                  : <span className="type-badge normal">Thường</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AddMaGiamGia
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        fetchdata={fetchdata}
      />

      <XoaMaGiamGia
        isOpen={isOpenXoaTL}
        onClose={() => setisOpenXoaTL(false)}
        idmagiamgia={selectedIds}
        fetchdata={fetchdata}
        setSelectedIds={setSelectedIds}
      />
      
      <UpdateMaGiamGia
        isOpen={isOpenCapNhat}
        onClose={() => setisOpenCapNhat(false)}
        idmagiamgia={selectedIds}
        fetchdata={fetchdata}
      />
      
      <ServerWideVoucher
        isOpen={isOpenServerWide}
        onClose={() => setIsOpenServerWide(false)}
        onVoucherCreated={handleServerWideVoucherCreated}
      />
    </div>
  )
}

export default MaGiamGiaLayout