import { useState } from 'react';
import { Modal } from '../../../../components/Modal';
import { MdDeleteForever } from 'react-icons/md';
import { MdCancelPresentation } from 'react-icons/md';

function DeleteCate({ isOpen, onClose, idcate, fetchData }) {
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!idcate || idcate.length === 0) {
      setError('No categories selected for deletion');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      if (idcate.length === 1) {
        // Single ID deletion - use the existing endpoint
        const response = await fetch(`http://localhost:3005/deletecate/${idcate[0]}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || 'Error deleting category');
          setIsDeleting(false);
          return;
        }
      } else {
        // Multiple IDs deletion - use the new bulk endpoint
        const response = await fetch('http://localhost:3005/deletemultiple', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: idcate }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || 'Error deleting categories');
          setIsDeleting(false);
          return;
        }
        
        // Can show detailed results if needed
        // const result = await response.json();
        // console.log('Deletion results:', result);
      }
      
      setIsDeleting(false);
      onClose();
      fetchData(); // Refresh list after deletion
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
      setIsDeleting(false);
    }
  };

  const categoryCount = idcate ? idcate.length : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="delete-category">
        <h2>Delete Category</h2>
        
        {error && <p className="error-message">{error}</p>}
        
        <p>
          {categoryCount === 1 
            ? 'Are you sure you want to delete this category? This will also delete all subcategories.' 
            : `Are you sure you want to delete these ${categoryCount} categories? This will also delete all subcategories.`}
        </p>
        
        <div className="modal-actions">
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="btn-delete"
          >
            <MdDeleteForever className="icon" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          
          <button 
            onClick={onClose}
            className="btn-cancel"
          >
            <MdCancelPresentation className="icon" />
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteCate;