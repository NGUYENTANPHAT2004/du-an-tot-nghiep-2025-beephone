import { Modal } from '../../../../components/Modal'
import { MdDeleteForever } from 'react-icons/md'
import { MdCancelPresentation } from 'react-icons/md'

function XoaBlog ({ isOpen, onClose, idblog, fetchdata }) {
  const handleXoaBlog = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/deleteblog/${idblog}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      if (response.ok) {
        onClose()
        fetchdata()
        alert('Xóa thành công!')
      }
    } catch (error) {
      console.error('lỗi xóa blog:', error)
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <p>Bạn có chắc muốn xóa blog này?</p>
        <div className='divbtnxtl'>
          <button onClick={handleXoaBlog} className='btndelete'>
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

export default XoaBlog