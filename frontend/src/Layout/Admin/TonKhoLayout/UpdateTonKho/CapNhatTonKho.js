import { useEffect, useState } from 'react';
import './CapNhatTonKho.scss';
import { RiCloseLine } from 'react-icons/ri';

export function CapNhatTonKho({ isOpen, onClose, fetchdata, selectedProductId, selectedDungLuongId, selectedMauSacId, selectedVariant }) {
  const [dungluongs, setDungluongs] = useState([]);
  const [mausacs, setMausacs] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    dungluongId: '',
    mausacId: '',
    quantity: 0
  });

  useEffect(() => {
    if (isOpen && selectedVariant) {
      // Dùng trực tiếp thông tin từ selectedVariant
      setFormData({
        productId: selectedVariant.productId,
        dungluongId: selectedVariant.dungLuongId,
        mausacId: selectedVariant.mauSacId,
        quantity: selectedVariant.quantity || 0
      });
    }
  }, [isOpen, selectedVariant]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3005/stock/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: formData.productId,
          dungluongId: formData.dungluongId || null,
          mausacId: formData.mausacId || null,
          quantity: parseInt(formData.quantity)
        })
      });

      if (response.ok) {
        alert('Cập nhật tồn kho thành công');
        fetchdata();
        onClose();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật tồn kho:', error);
      alert('Đã xảy ra lỗi khi cập nhật tồn kho');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Cập nhật tồn kho</h2>
          <button className="close-button" onClick={onClose}>
            <RiCloseLine />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sản phẩm:</label>
            <div className="info-display">{selectedVariant?.productName || 'Không có thông tin'}</div>
          </div>
          
          <div className="form-group">
            <label>Dung lượng:</label>
            <div className="info-display">{selectedVariant?.dungLuongName || 'Không có thông tin'}</div>
          </div>
          
          <div className="form-group">
            <label>Màu sắc:</label>
            <div className="info-display">{selectedVariant?.mauSacName || 'Không có thông tin'}</div>
          </div>
          
          <div className="form-group">
            <label>Số lượng:</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              required
            />
          </div>
          
          <div className="buttons">
            <button type="submit" className="save-button">Lưu</button>
            <button type="button" className="cancel-button" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}