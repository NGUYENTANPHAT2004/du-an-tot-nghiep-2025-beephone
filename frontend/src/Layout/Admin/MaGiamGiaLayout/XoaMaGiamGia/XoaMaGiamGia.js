import { Modal } from '../../../../components/Modal'
import { MdDeleteForever } from 'react-icons/md'
import { MdCancelPresentation } from 'react-icons/md'

function XoaMaGiamGia ({ isOpen, onClose, idmagiamgia, fetchdata, setSelectedIds }) {
  const handleXoaMaGiamGia = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/deletemagg`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids: idmagiamgia })
        }
      )
      if (response.ok) {
        onClose()
        setSelectedIds([])
        fetchdata()
        alert('Xóa thành công!')
      }
    } catch (error) {
      console.error('lỗi xóa mã giảm giá:', error)
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <p>Bạn có chắc muốn xóa mã giảm giá này?</p>
        <div className='divbtnxtl'>
          <button onClick={handleXoaMaGiamGia} className='btndelete'>
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

export default XoaMaGiamGia
