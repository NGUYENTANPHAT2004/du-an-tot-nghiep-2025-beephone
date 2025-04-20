// Fixed RedemptionOptions.js - For managing reward options focusing on user ID
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faTimes, 
  faSpinner, 
  faGift, 
  faPercent, 
  faShippingFast, 
  faTag
} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';

const RedemptionOptions = () => {
  const [options, setOptions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsCost: '',
    voucherType: 'percentage',
    voucherValue: '',
    voucherId: '',
    minOrderValue: '0',
    availableTiers: [],
    limitPerUser: '1',
    totalQuantity: '100',
    startDate: '',
    endDate: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchOptions();
    fetchVouchers();
  }, []);

  // Fetch redemption options
  const fetchOptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3005/admin/loyalty/redemption-options');
      
      if (response.data && response.data.success) {
        setOptions(response.data.data);
      } else {
        toast.error('Không thể tải danh sách tùy chọn đổi điểm');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách tùy chọn đổi điểm:', error);
      toast.error('Không thể tải danh sách tùy chọn đổi điểm');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available vouchers
  const fetchVouchers = async () => {
    try {
      const response = await axios.get('http://localhost:3005/getmagg');
      
      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        setVouchers(response.data);
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setVouchers(response.data.data);
      } else {
        toast.error('Không thể tải danh sách voucher');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách voucher:', error);
      toast.error('Không thể tải danh sách voucher');
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      name: '',
      description: '',
      pointsCost: '',
      voucherType: 'percentage',
      voucherValue: '',
      voucherId: '',
      minOrderValue: '0',
      availableTiers: [],
      limitPerUser: '1',
      totalQuantity: '100',
      startDate: moment().format('YYYY-MM-DD'),
      endDate: moment().add(3, 'months').format('YYYY-MM-DD'),
      imageUrl: ''
    });
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (option) => {
    setEditMode(true);
    setFormData({
      _id: option._id,
      name: option.name,
      description: option.description || '',
      pointsCost: option.pointsCost.toString(),
      voucherType: option.voucherType,
      voucherValue: option.voucherValue.toString(),
      voucherId: option.voucherId,
      minOrderValue: option.minOrderValue.toString(),
      availableTiers: option.availableTiers || [],
      limitPerUser: option.limitPerUser.toString(),
      totalQuantity: option.totalQuantity.toString(),
      remainingQuantity: option.remainingQuantity,
      startDate: moment(option.startDate).format('YYYY-MM-DD'),
      endDate: moment(option.endDate).format('YYYY-MM-DD'),
      isActive: option.isActive,
      imageUrl: option.imageUrl || ''
    });
    setModalOpen(true);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'availableTiers') {
      // Handle multi-select checkbox
      let updatedTiers = [...formData.availableTiers];
      
      if (checked) {
        updatedTiers.push(value);
      } else {
        updatedTiers = updatedTiers.filter(tier => tier !== value);
      }
      
      setFormData(prev => ({
        ...prev,
        availableTiers: updatedTiers
      }));
    } else {
      // Handle regular input fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Save redemption option - Fixed to prioritize user ID for redemption limits
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate data
    if (!formData.name || !formData.pointsCost || !formData.voucherValue || !formData.voucherId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    try {
      setLoading(true);
      
      // Normalize data
      const payload = {
        ...formData,
        pointsCost: Number(formData.pointsCost),
        voucherValue: Number(formData.voucherValue),
        minOrderValue: Number(formData.minOrderValue) || 0,
        limitPerUser: Number(formData.limitPerUser) || 1,
        totalQuantity: Number(formData.totalQuantity) || 100,
        remainingQuantity: editMode ? formData.remainingQuantity : Number(formData.totalQuantity) || 100
      };
      
      // Validate essential values
      if (payload.pointsCost <= 0) {
        toast.error('Số điểm cần để đổi phải lớn hơn 0');
        setLoading(false);
        return;
      }
      
      if (payload.voucherValue <= 0) {
        toast.error('Giá trị voucher phải lớn hơn 0');
        setLoading(false);
        return;
      }
      
      if (payload.limitPerUser <= 0) {
        toast.error('Giới hạn đổi điểm/người phải lớn hơn 0');
        setLoading(false);
        return;
      }
      
      if (payload.totalQuantity <= 0) {
        toast.error('Tổng số lượng phải lớn hơn 0');
        setLoading(false);
        return;
      }
      
      // Check start and end dates
      const startDate = new Date(payload.startDate);
      const endDate = new Date(payload.endDate);
      
      if (startDate > endDate) {
        toast.error('Ngày kết thúc phải sau ngày bắt đầu');
        setLoading(false);
        return;
      }
      
      // Note about redemption limits
      if (payload.limitPerUser > 1) {
        toast.info('Lưu ý: Giới hạn đổi điểm sẽ áp dụng theo user ID của người dùng');
      }
      
      // Perform API call
      if (editMode) {
        // Update existing option
        const response = await axios.put(
          `http://localhost:3005/admin/loyalty/update-redemption/${formData._id}`, 
          payload
        );
        
        if (response.data && response.data.success) {
          // Update options list
          const updatedOptions = options.map(option => 
            option._id === formData._id ? response.data.data : option
          );
          
          setOptions(updatedOptions);
          toast.success('Cập nhật tùy chọn đổi điểm thành công');
          setModalOpen(false);
        } else {
          toast.error(response.data?.message || 'Không thể cập nhật tùy chọn đổi điểm');
        }
      } else {
        // Create new option
        const response = await axios.post(
          'http://localhost:3005/admin/loyalty/create-redemption', 
          payload
        );
        
        if (response.data && response.data.success) {
          // Add new option to list
          setOptions([...options, response.data.data]);
          toast.success('Tạo tùy chọn đổi điểm thành công');
          setModalOpen(false);
        } else {
          toast.error(response.data?.message || 'Không thể tạo tùy chọn đổi điểm');
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu tùy chọn đổi điểm:', error);
      
      // Display specific error message if available
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Không thể lưu tùy chọn đổi điểm');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete redemption option
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tùy chọn đổi điểm này?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:3005/admin/loyalty/delete-redemption/${id}`);
      
      if (response.data && response.data.success) {
        setOptions(options.filter(option => option._id !== id));
        toast.success('Xóa tùy chọn đổi điểm thành công');
      } else {
        toast.error('Không thể xóa tùy chọn đổi điểm');
      }
    } catch (error) {
      console.error('Lỗi khi xóa tùy chọn đổi điểm:', error);
      toast.error('Không thể xóa tùy chọn đổi điểm');
    } finally {
      setLoading(false);
    }
  };

  // Handle activate/deactivate redemption option
  const handleToggleActive = async (id, currentStatus) => {
    try {
      setLoading(true);
      const response = await axios.patch(`http://localhost:3005/admin/loyalty/toggle-redemption/${id}`, { 
        isActive: !currentStatus 
      });
      
      if (response.data && response.data.success) {
        setOptions(options.map(option => 
          option._id === id ? response.data.data : option
        ));
        
        toast.success(`Đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'} tùy chọn đổi điểm`);
      } else {
        toast.error('Không thể thay đổi trạng thái tùy chọn đổi điểm');
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái tùy chọn đổi điểm:', error);
      toast.error('Không thể thay đổi trạng thái tùy chọn đổi điểm');
    } finally {
      setLoading(false);
    }
  };

  // Display voucher type icon
  const getVoucherTypeIcon = (type) => {
    switch (type) {
      case 'percentage': return <FontAwesomeIcon icon={faPercent} />;
      case 'fixed': return <FontAwesomeIcon icon={faTag} />;
      case 'shipping': return <FontAwesomeIcon icon={faShippingFast} />;
      case 'product': return <FontAwesomeIcon icon={faGift} />;
      default: return <FontAwesomeIcon icon={faGift} />;
    }
  };

  // Display voucher type name
  const getVoucherTypeName = (type) => {
    switch (type) {
      case 'percentage': return 'Giảm %';
      case 'fixed': return 'Giảm tiền';
      case 'shipping': return 'Miễn phí vận chuyển';
      case 'product': return 'Giảm giá sản phẩm';
      default: return 'Khác';
    }
  };

  // Display tier name
  const getTierName = (tier) => {
    switch (tier) {
      case 'silver': return 'Bạc';
      case 'gold': return 'Vàng';
      case 'platinum': return 'Bạch Kim';
      default: return 'Tiêu Chuẩn';
    }
  };

  return (
    <div className="redemption-options">
      <div className="header-actions">
        <h3>Quản lý tùy chọn đổi điểm</h3>
        <button 
          className="create-button"
          onClick={openCreateModal}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Tạo mới</span>
        </button>
      </div>

      {loading && !modalOpen ? (
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : options.length === 0 ? (
        <div className="no-results">
          <p>Chưa có tùy chọn đổi điểm nào</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên quà</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Điểm</th>
                <th>Cấp thành viên</th>
                <th>Còn lại</th>
                <th>Hạn sử dụng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {options.map(option => (
                <tr key={option._id} className={!option.isActive ? 'inactive' : ''}>
                  <td className="option-name">
                    <span className="name">{option.name}</span>
                    {option.description && (
                      <span className="description">{option.description}</span>
                    )}
                  </td>
                  <td className="option-type">
                    {getVoucherTypeIcon(option.voucherType)}
                    <span>{getVoucherTypeName(option.voucherType)}</span>
                  </td>
                  <td>
                    {option.voucherType === 'percentage' || option.voucherType === 'product'
                      ? `${option.voucherValue}%`
                      : option.voucherType === 'fixed'
                      ? `${option.voucherValue.toLocaleString('vi-VN')}đ`
                      : 'Miễn phí'}
                  </td>
                  <td>{option.pointsCost.toLocaleString('vi-VN')}</td>
                  <td>
                    {option.availableTiers && option.availableTiers.length > 0 
                      ? option.availableTiers.map(tier => getTierName(tier)).join(', ')
                      : 'Tất cả'}
                  </td>
                  <td>
                    {option.remainingQuantity}/{option.totalQuantity}
                    <br />
                    <small>({Math.round(option.remainingQuantity / option.totalQuantity * 100)}%)</small>
                  </td>
                  <td>{moment(option.endDate).format('DD/MM/YYYY')}</td>
                  <td>
                    <span className={`status-badge ${option.isActive ? 'active' : 'inactive'}`}>
                      {option.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="action-button edit"
                      onClick={() => openEditModal(option)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => handleDelete(option._id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <button 
                      className={`action-button toggle ${option.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleActive(option._id, option.isActive)}
                    >
                      {option.isActive ? 'Tắt' : 'Bật'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit redemption option modal - Updated with clearer user ID info */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editMode ? 'Chỉnh sửa tùy chọn đổi điểm' : 'Tạo tùy chọn đổi điểm mới'}</h3>
              <button 
                className="close-button"
                onClick={() => setModalOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Tên quà đổi điểm:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập tên quà đổi điểm"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Mô tả:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Nhập mô tả (tùy chọn)"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Số điểm cần để đổi:</label>
                  <input
                    type="number"
                    name="pointsCost"
                    value={formData.pointsCost}
                    onChange={handleChange}
                    placeholder="Ví dụ: 500"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Giá trị tối thiểu đơn hàng:</label>
                  <input
                    type="number"
                    name="minOrderValue"
                    value={formData.minOrderValue}
                    onChange={handleChange}
                    placeholder="Ví dụ: 100000"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Loại voucher:</label>
                  <select
                    name="voucherType"
                    value={formData.voucherType}
                    onChange={handleChange}
                    required
                  >
                    <option value="percentage">Giảm theo %</option>
                    <option value="fixed">Giảm số tiền cố định</option>
                    <option value="shipping">Miễn phí vận chuyển</option>
                    <option value="product">Giảm giá sản phẩm</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Giá trị voucher:</label>
                  <input
                    type="number"
                    name="voucherValue"
                    value={formData.voucherValue}
                    onChange={handleChange}
                    placeholder={formData.voucherType === 'percentage' ? 'Ví dụ: 10 (%)' : 'Ví dụ: 50000 (đ)'}
                    min="1"
                    required
                  />
                  <small>
                    {formData.voucherType === 'percentage' || formData.voucherType === 'product' 
                      ? '% giảm giá' 
                      : 'Số tiền giảm (đ)'}
                  </small>
                </div>
              </div>
              
              <div className="form-group">
                <label>Voucher:</label>
                <select
                  name="voucherId"
                  value={formData.voucherId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn voucher --</option>
                  {vouchers.map(voucher => (
                    <option key={voucher._id} value={voucher._id}>
                      {voucher.magiamgia} - {voucher.sophantram}% (hết hạn: {voucher.ngayketthuc})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Cấp thành viên có thể đổi:</label>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="availableTiers"
                      value="standard"
                      checked={formData.availableTiers.includes('standard')}
                      onChange={handleChange}
                    />
                    Tiêu Chuẩn
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="availableTiers"
                      value="silver"
                      checked={formData.availableTiers.includes('silver')}
                      onChange={handleChange}
                    />
                    Bạc
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="availableTiers"
                      value="gold"
                      checked={formData.availableTiers.includes('gold')}
                      onChange={handleChange}
                    />
                    Vàng
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="availableTiers"
                      value="platinum"
                      checked={formData.availableTiers.includes('platinum')}
                      onChange={handleChange}
                    />
                    Bạch Kim
                  </label>
                </div>
                <small>Để trống để cho phép tất cả các cấp</small>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Giới hạn đổi điểm/người:</label>
                  <input
                    type="number"
                    name="limitPerUser"
                    value={formData.limitPerUser}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Tổng số lượng:</label>
                  <input
                    type="number"
                    name="totalQuantity"
                    value={formData.totalQuantity}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày bắt đầu:</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Ngày kết thúc:</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Hình ảnh (URL):</label>
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="Nhập URL hình ảnh (tùy chọn)"
                />
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button"
                  className="cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="submit"
                  disabled={loading}
                >
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : (editMode ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedemptionOptions;