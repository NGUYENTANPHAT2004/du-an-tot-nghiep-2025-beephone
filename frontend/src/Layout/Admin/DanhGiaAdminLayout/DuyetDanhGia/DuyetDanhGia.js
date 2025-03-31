import { Modal } from '../../../../components/Modal'
import { MdCheckCircle } from 'react-icons/md'
import { MdCancelPresentation } from 'react-icons/md'

function DuyetDanhGia ({ isOpen, onClose, iddanhgia, fetchdata, setSelectedIds }) {
  const handleDuyetDanhGia = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/duyetdanhgia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids: iddanhgia })
        }
      )
      if (response.ok) {
        onClose()
        setSelectedIds([])
        fetchdata()
        alert('Duyệt thành công!')
      }
    } catch (error) {
      console.error('lỗi duyệt đánh giá:', error)
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <p>Bạn có chắc muốn duyệt những đánh giá này?</p>
        <div className='divbtnxtl'>
          <button onClick={handleDuyetDanhGia} className='btndelete'>
            <MdCheckCircle />
            Duyệt
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

export default DuyetDanhGia