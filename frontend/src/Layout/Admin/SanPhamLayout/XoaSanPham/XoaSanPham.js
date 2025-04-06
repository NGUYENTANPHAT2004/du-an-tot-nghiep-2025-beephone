import { Modal } from '../../../../components/Modal'
import { MdDeleteForever } from 'react-icons/md'
import { MdCancelPresentation } from 'react-icons/md'

function XoaSanPham ({ isOpen, onClose, idsanpham, fetchdata, setSelectedIds }) {
  const handleXoaSanPham = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/deletechitietsphangloat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ids: idsanpham
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
        <p>Bạn có chắc muốn xóa sản phẩm này?</p>
        <div className='divbtnxtl'>
          <button onClick={handleXoaSanPham} className='btndelete'>
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

export default XoaSanPham
