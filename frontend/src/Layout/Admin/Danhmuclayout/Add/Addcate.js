import { Modal } from '../../../../components/Modal';
import { useState, useEffect } from 'react';
import "./Addcate.scss"
function AddCate({ isOpen, onClose, fetchData }) {
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [categories, setCategories] = useState([]); 
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

 
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3005/listcate');
      if (response.ok) {
        const data = await response.json();
        console.log("Dữ liệu từ API:", data);
        // Sử dụng dữ liệu cây có sẵn trả về từ API
        const flatCategories = flattenCategories(data);
        console.log("Danh mục phẳng có dấu —:", flatCategories);
        setCategories(flatCategories);
      } else {
        console.error('Lỗi khi lấy danh mục cha');
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
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
        setError(errorData.message);
        return;
      }
  
      onClose();
      fetchData(); // Refresh danh sách danh mục
    } catch (error) {
      console.error('Lỗi khi thêm danh mục:', error);
      setError('Lỗi kết nối, vui lòng thử lại.');
    }
  };
  

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className='add-category'>
        <h2>Thêm Danh Mục</h2>

        {error && <p className='error-message'>{error}</p>}

        <div className='input-group'>
          <label>Tên danh mục:</label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Nhập tên danh mục'
          />

          <label>Danh mục cha:</label>
          <select className="form-select" value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value=''>Không có (Danh mục gốc)</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className='button-group'>
          <button onClick={handleAddCategory} className="btn btn-primary">
            Thêm
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default AddCate;
