import { useState } from 'react';
import { Modal } from '../../../../components/Modal'
import { MdDeleteForever } from 'react-icons/md'
import { MdCancelPresentation } from 'react-icons/md'

function DeleteCate({ isOpen, onClose, idcate, fetchdata }) {
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3005/deletecate/${idcate}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Lỗi khi xóa danh mục');
        return;
      }
      onClose();
      fetchdata(); // Làm mới danh sách sau khi xóa
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Xóa Danh Mục</h2>
      {error && <p className="error">{error}</p>}
      <p>Bạn có chắc chắn muốn xóa danh mục này?</p>
      <div className="modal-actions">
        <button onClick={handleDelete}>Xóa</button>
        <button onClick={onClose}>Hủy</button>
      </div>
    </Modal>
  );
}

export default DeleteCate;
