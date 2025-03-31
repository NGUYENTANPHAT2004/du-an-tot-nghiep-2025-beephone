import { Modal } from '../../../../components/Modal';
import { useState, useEffect } from 'react';
import "./Addcate.scss"

function AddCate({ isOpen, onClose, fetchData }) {
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [categories, setCategories] = useState([]); 
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setName('');
      setParent('');
      setError(null);
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:3005/listcate');
      if (response.ok) {
        const data = await response.json();
        const flatCategories = flattenCategories(data);
        setCategories(flatCategories);
      } else {
        console.error('Error fetching parent categories');
        setError('Failed to load category list');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError('Connection error. Please check your network.');
    }
  };

  const flattenCategories = (categoryTree, level = 0, result = []) => {
    categoryTree.forEach(category => {
      result.push({ _id: category._id, label: `${'— '.repeat(level)}${category.name}` });
      if (category.children && category.children.length > 0) {
        flattenCategories(category.children, level + 1, result);
      }
    });
    return result;
  };
  
  const handleAddCategory = async () => {
    // Validate inputs
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = { name };
      if (parent && parent.trim() !== '') {
        payload.parent = parent;
      }

      const response = await fetch('http://localhost:3005/createcate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create category');
        setIsSubmitting(false);
        return;
      }
  
      // Clear form and close modal
      setName('');
      setParent('');
      setIsSubmitting(false);
      onClose();
      
      // Call the parent's fetchData function to refresh the category list
      if (fetchData && typeof fetchData === 'function') {
        fetchData();
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Connection error. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className='add-category'>
        <h2>Thêm</h2>

        {error && <p className='error-message'>{error}</p>}

        <div className='input-group'>
          <label>Tên danh mục</label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='mời nhập danh mục'
          />

          <label>danh mục cha</label>
          <select 
            className="form-select" 
            value={parent} 
            onChange={(e) => setParent(e.target.value)}
          >
            <option value=''>danh mục gốc</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className='button-group'>
          <button 
            onClick={handleAddCategory} 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default AddCate;