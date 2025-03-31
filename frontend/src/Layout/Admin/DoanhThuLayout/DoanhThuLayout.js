import { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import './DoanhThuLayout.scss';

import SoDienThoaiMuaNhieu from './sdtmuanhieu';
import DoanhThuChart from './Doanhthuchart';
import SanPhamBanChay from './spbanchay';
import SanPhamItBan from './SanPhamItBan';
import TrungBinhMoiDon from './tbdon';
import PhanLoaiSanPham from './Phanloaisanpham';
import ProductTrends from './productrent';
import OrderSuccessRate from './OrderSuccessRate';

function DoanhThuLayout() {
  const [startDate, setStartDate] = useState(moment().subtract(7, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedOption, setSelectedOption] = useState('doanhthu');
  const [doanhThu, setDoanhThu] = useState([]);
  const [thongKeData, setThongKeData] = useState([]);
  const [orderSuccessData, setOrderSuccessData] = useState({});
  const [categoryData, setCategoryData] = useState([]);
  const [avgOrderData, setAvgOrderData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Style for tables
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .stats-table-container {
        overflow-x: auto;
      }
      .stats-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      .stats-table th, .stats-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      .stats-table th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .stats-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .stats-table tr:hover {
        background-color: #eaf2ff;
      }
      .loading-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
        font-weight: bold;
        color: #555;
      }
      .error-message {
        padding: 15px;
        background-color: #ffebee;
        color: #c62828;
        border-radius: 4px;
        margin: 15px 0;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '';
      switch (selectedOption) {
        case 'doanhthu':
          url = '/getdoanhthu';
          break;
        case 'spbanchay':
          url = '/top-products';
          break;
        case 'spitban':
          url = '/least-products';
          break;
        case 'trungbinh':
          url = '/avg-products-per-order';
          break;
        case 'sdtmua':
          url = '/top-phone';
          break;
        case 'category':
          url = '/category-stats';
          break;
        case 'successrate':
          url = '/order-success-rate';
          break;
        default:
          url = '/getdoanhthu';
      }

      const res = await axios.get(
        `http://localhost:3005${url}?startDate=${startDate}&endDate=${endDate}`
      );

      // Handle different data types based on selected option
      switch (selectedOption) {
        case 'doanhthu':
          setDoanhThu(Array.isArray(res.data) ? res.data : []);
          break;
        case 'category':
          setCategoryData(Array.isArray(res.data) ? res.data : []);
          break;
        case 'trungbinh':
          setAvgOrderData(res.data || {});
          break;
        case 'successrate':
          setOrderSuccessData(res.data || {});
          break;
        default:
          setThongKeData(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Lỗi gọi API:', err);
      setError(`Lỗi khi tải dữ liệu: ${err.message || 'Không xác định'}`);
      
      // Set default empty values for data
      switch (selectedOption) {
        case 'doanhthu':
          setDoanhThu([]);
          break;
        case 'category':
          setCategoryData([]);
          break;
        case 'trungbinh':
          setAvgOrderData({});
          break;
        case 'successrate':
          setOrderSuccessData({});
          break;
        default:
          setThongKeData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [selectedOption, startDate, endDate]);

  // Function to format date ranges
  const getPresetDateRange = (range) => {
    let start, end;
    switch(range) {
      case 'today':
        start = moment().format('YYYY-MM-DD');
        end = moment().format('YYYY-MM-DD');
        break;
      case 'yesterday':
        start = moment().subtract(1, 'days').format('YYYY-MM-DD');
        end = moment().subtract(1, 'days').format('YYYY-MM-DD');
        break;
      case 'last7days':
        start = moment().subtract(7, 'days').format('YYYY-MM-DD');
        end = moment().format('YYYY-MM-DD');
        break;
      case 'last30days':
        start = moment().subtract(30, 'days').format('YYYY-MM-DD');
        end = moment().format('YYYY-MM-DD');
        break;
      case 'thisMonth':
        start = moment().startOf('month').format('YYYY-MM-DD');
        end = moment().endOf('month').format('YYYY-MM-DD');
        break;
      case 'lastMonth':
        start = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
        end = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
        break;
      default:
        return;
    }
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className='doanhthu-container'>
      <div className='doanhthu-header'>
        <h2>Thống kê doanh thu & Sản phẩm</h2>
      </div>
      
      <div className='doanhthu-filter'>
        <div className='date-range-container'>
          <input
            type='date'
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className='doanhthu-input'
          />
          <span style={{ margin: '0 10px' }}>đến</span>
          <input
            type='date'
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className='doanhthu-input'
          />
          <button className='doanhthu-button' onClick={fetchData}>
            Lọc
          </button>
        </div>
        
        <div className='date-presets'>
          <button onClick={() => getPresetDateRange('today')}>Hôm nay</button>
          <button onClick={() => getPresetDateRange('yesterday')}>Hôm qua</button>
          <button onClick={() => getPresetDateRange('last7days')}>7 ngày</button>
          <button onClick={() => getPresetDateRange('last30days')}>30 ngày</button>
          <button onClick={() => getPresetDateRange('thisMonth')}>Tháng này</button>
          <button onClick={() => getPresetDateRange('lastMonth')}>Tháng trước</button>
        </div>
      </div>
      
      <div className='doanhthu-select-wrapper'>
        <select 
          id='select-option' 
          value={selectedOption} 
          onChange={e => setSelectedOption(e.target.value)}
          className='doanhthu-select'
        >
          <option value='doanhthu'>Doanh thu</option>
          <option value='spbanchay'>Sản phẩm bán chạy</option>
          <option value='spitban'>Sản phẩm ít bán</option>
          <option value='trungbinh'>Số lượng SP trung bình mỗi đơn</option>
          <option value='sdtmua'>Số ĐT mua nhiều</option>
          <option value='category'>Phân loại sản phẩm</option>
          <option value='trends'>Xu hướng bán sản phẩm</option>
          <option value='successrate'>Tỷ lệ đơn hàng</option>
        </select>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="loading-indicator">Đang tải dữ liệu...</div>
      ) : (
        <>
          {selectedOption === 'doanhthu' && <DoanhThuChart data={doanhThu} />}
          {selectedOption === 'spbanchay' && <SanPhamBanChay data={thongKeData} />}
          {selectedOption === 'spitban' && <SanPhamItBan data={thongKeData} />}
          {selectedOption === 'trungbinh' && <TrungBinhMoiDon data={avgOrderData} />}
          {selectedOption === 'sdtmua' && <SoDienThoaiMuaNhieu data={thongKeData} />}
          {selectedOption === 'category' && <PhanLoaiSanPham data={categoryData} />}
          {selectedOption === 'trends' && <ProductTrends startDate={startDate} endDate={endDate} />}
          {selectedOption === 'successrate' && <OrderSuccessRate data={orderSuccessData} />}
        </>
      )}
    </div>
  );
}

export default DoanhThuLayout;