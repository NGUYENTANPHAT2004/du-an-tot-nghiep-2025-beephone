import { Modal } from '../../../../components/Modal'
import { MdDeleteForever } from 'react-icons/md'
import { MdCancelPresentation } from 'react-icons/md'

function XoaDungLuong ({ isOpen, onClose, iddungluong, fetchdata, setSelectedIds }) {
  const handleXoaDungLuong = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/deletedungluonghangloat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            iddungluongList: iddungluong
          })
        }
      )
      if (response.ok) {
        onClose()
        setSelectedIds([])
        fetchdata()
        alert('Xóa thành công!')
      }
    } catch (error) {
      console.error('lỗi xóa sản phẩm:', error)
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <p>Bạn có chắc muốn xóa dung lượng này?</p>
        <div className='divbtnxtl'>
          <button onClick={handleXoaDungLuong} className='btndelete'>
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

export default XoaDungLuong
