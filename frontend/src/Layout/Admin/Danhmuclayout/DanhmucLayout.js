import { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import {AddCate} from './Add';
import {EditCate} from './Edit';
import {DeleteCate} from './Delete';
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
            <button onClick={() => onEdit(category._id)}>Sửa</button>
            <button onClick={() => onDelete(category._id)}>Xóa</button>
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

  // Hàm gọi API lấy danh mục (API trả về cấu trúc cây)
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3005/listcate');
      if (response.ok) {
        const data = await response.json();
        console.log('Dữ liệu từ API:', data);
        setCategories(data);
      } else {
        console.error('Lỗi khi lấy danh mục');
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Hàm đệ quy để lấy tất cả các ID từ cấu trúc cây
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

  // Xử lý chọn tất cả
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      const allIds = flattenIds(categories);
      setSelectedIds(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Xử lý chọn/bỏ chọn một mục
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

  // Xử lý Sửa: chỉ cho phép sửa khi chọn đúng 1 danh mục
  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      alert('Vui lòng chọn đúng 1 danh mục để sửa!');
      return;
    }
    setIsOpenEdit(true);
  };

  // Xử lý Xóa: cho phép xóa nhiều mục
  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 danh mục để xóa!');
      return;
    }
    setIsOpenDelete(true);
  };

  return (
    <div className="danhmuc_container">
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
            Chọn tất cả
          </label>
        </div>
        <div className="action-buttons">
          <button onClick={handleEdit}>Sửa</button>
          <button onClick={handleDelete}>Xóa</button>
        </div>
      </div>

      <div className="accordion-menu">
        {categories.map((category) => (
          <AccordionItem
            key={category._id}
            category={category}
            selectedIds={selectedIds}
            onSelect={handleSelectItem}
          />
        ))}
      </div>

      <AddCate
        isOpen={isOpenAdd}
        onClose={() => setIsOpenAdd(false)}
        fetchdata={fetchCategories}
      />
      <EditCate
        isOpen={isOpenEdit}
        onClose={() => setIsOpenEdit(false)}
        idcate={selectedIds[0]}
        fetchdata={fetchCategories}
      />
      <DeleteCate
        isOpen={isOpenDelete}
        onClose={() => setIsOpenDelete(false)}
        idcate={selectedIds}
        fetchdata={fetchCategories}
      />
    </div>
  );
}

export default DanhmucLayout;
