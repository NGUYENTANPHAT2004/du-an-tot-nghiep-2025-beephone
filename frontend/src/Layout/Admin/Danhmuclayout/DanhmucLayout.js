import { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { FaTrashCan } from 'react-icons/fa6';
import { AddCate } from './Add';
import { EditCate } from './Edit';
import { DeleteCate } from './Delete';
import './DanhmucLayout.scss';

// Component AccordionItem: hiển thị một mục danh mục đa cấp kèm checkbox và đệ quy các mục con
const AccordionItem = ({ category, onEdit, onDelete, onSelect, selectedIds }) => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => setOpen(!open);

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onSelect(category._id);
  };

  return (
    <div className="accordion-item">
      <div className="accordion-title" onClick={toggleOpen}>
        <div className="left-content">
          <input
            type="checkbox"
            checked={selectedIds.includes(category._id)}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="title-text">{category.name}</span>
          <div className="accordion-actions" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEdit(category._id)}>Edit</button>
            <button onClick={() => onDelete(category._id)}>Delete</button>
          </div>
        </div>
        {category.children && category.children.length > 0 && (
          <span className="accordion-icon">{open ? '-' : '+'}</span>
        )}
      </div>
      {open && category.children && category.children.length > 0 && (
        <div className="accordion-content">
          {category.children.map((child) => (
            <AccordionItem
              key={child._id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
              selectedIds={selectedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function DanhmucLayout() {
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [error, setError] = useState('');

  // Fetch categories from API (returns tree structure)
  const fetchCategories = async () => {
    try {
      setError('');
      const response = await fetch('http://localhost:3005/listcate');
      if (response.ok) {
        const data = await response.json();
        console.log('Data from API:', data);
        setCategories(data);
      } else {
        console.error('Error fetching categories');
        setError('Failed to load categories');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError('Connection error. Please check your network.');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Recursive function to get all IDs from tree structure
  const flattenIds = (tree) => {
    let result = [];
    tree.forEach((item) => {
      result.push(item._id);
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenIds(item.children));
      }
    });
    return result;
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      const allIds = flattenIds(categories);
      setSelectedIds(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Handle select/deselect an item
  const handleSelectItem = (id) => {
    let newSelectedIds = [...selectedIds];
    if (newSelectedIds.includes(id)) {
      newSelectedIds = newSelectedIds.filter((itemId) => itemId !== id);
    } else {
      newSelectedIds.push(id);
    }
    setSelectedIds(newSelectedIds);
    const allIds = flattenIds(categories);
    setSelectAll(newSelectedIds.length === allIds.length);
  };

  // Handle Edit: can only edit one category at a time
  const handleEdit = (id) => {
    setCurrentEditId(id);
    setIsOpenEdit(true);
  };

  // Handle Delete via button: can delete multiple items
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least 1 category to delete!');
      return;
    }
    setIsOpenDelete(true);
  };

  // Handle Delete via accordion: delete a specific item
  const handleDeleteItem = (id) => {
    setSelectedIds([id]);
    setIsOpenDelete(true);
  };

  return (
    <div className="danhmuc_container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="top-actions">
        <button className="btn-them-danhmuc" onClick={() => setIsOpenAdd(true)}>
          <FaPlus className="icons" />
          Thêm Danh Mục
        </button>
        <div className="select-all">
          <label>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            Chọn Tất Cả
          </label>
        </div>
        <div className="action-buttons">
          <button className="btn-them-danhmuc" onClick={handleDeleteSelected}>
            <FaTrashCan className='icons' />
            Xóa
          </button>
        </div>
      </div>

      <div className="accordion-menu">
        {categories.map((category) => (
          <AccordionItem
            key={category._id}
            category={category}
            selectedIds={selectedIds}
            onSelect={handleSelectItem}
            onEdit={handleEdit}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>

      <AddCate
        isOpen={isOpenAdd}
        onClose={() => setIsOpenAdd(false)}
        fetchData={fetchCategories}  // Fixed prop name (camelCase)
      />
      <EditCate
        isOpen={isOpenEdit}
        onClose={() => setIsOpenEdit(false)}
        idcate={currentEditId || selectedIds[0]}
        fetchData={fetchCategories}  // Fixed prop name (camelCase)
      />
      <DeleteCate
        isOpen={isOpenDelete}
        onClose={() => setIsOpenDelete(false)}
        idcate={selectedIds}
        fetchData={fetchCategories}  // Fixed prop name (camelCase)
      />
    </div>
  );
}

export default DanhmucLayout;