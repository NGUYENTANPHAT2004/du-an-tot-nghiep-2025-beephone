import { Modal } from '../../../../components/Modal'
import { MdDeleteForever } from 'react-icons/md'
import { MdCancelPresentation } from 'react-icons/md'

function XoaHoaDon ({ isOpen, onClose, idhoadon, fetchdata, setSelectedIds }) {
  const handleXoaHoaDon = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/deletehoaddon`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids: idhoadon })
        }
      )
      if (response.ok) {
        onClose()
        setSelectedIds([])
        fetchdata()
        alert('Xóa thành công!')
      }
    } catch (error) {
      console.error('lỗi xóa hóa đơn:', error)
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <p>Bạn có chắc muốn xóa hóa đơn này?</p>
        <div className='divbtnxtl'>
          <button onClick={handleXoaHoaDon} className='btndelete'>
            <MdDeleteForever />
            Xóa
          </button>
          <button onClick={onClose} className='btnhuy'>
            <MdCancelPresentation />
            Hủy
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default XoaHoaDon
