import { Modal } from '../../../../components/Modal'
import { MdCheckCircle } from 'react-icons/md'
import { MdCancelPresentation } from 'react-icons/md'

function XoaDanhGia ({
  isOpen,
  onClose,
  iddanhgia,
  fetchdata,
  setSelectedIds
}) {
  const handleXoaDanhGia = async () => {
    try {
      const response = await fetch(`http://localhost:3005/xoadanhgia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: iddanhgia })
      })
      if (response.ok) {
        onClose()
        setSelectedIds([])
        fetchdata()
        alert('Xóa thành công!')
      }
    } catch (error) {
      console.error('lỗi xóa đánh giá:', error)
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <p>Bạn có chắc muốn xóa những đánh giá này?</p>
        <div className='divbtnxtl'>
          <button onClick={handleXoaDanhGia} className='btndelete'>
            <MdCheckCircle />
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

export default XoaDanhGia