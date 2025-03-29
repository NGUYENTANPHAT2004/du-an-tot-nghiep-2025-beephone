import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';

const SoDienThoaiMuaNhieu = ({ data = [] }) => {
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];
  
  // Check if no data is available
  if (safeData.length === 0) {
    return (
      <div className='doanhthu-chart-wrapper'>
        <h3>Khách hàng mua nhiều nhất</h3>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Không có dữ liệu trong khoảng thời gian này.</p>
        </div>
      </div>
    );
  }
  
  // Ensure all data objects have the required properties with default values
  const normalizedData = safeData.map(item => ({
    _id: item._id || 'Không rõ',
    soDon: item.soDon || 0,
    tongTien: item.tongTien || 0,
    customerName: item.customerName || null,
    lastOrder: item.lastOrder || 'N/A',
    avgOrdersPerMonth: item.avgOrdersPerMonth || 0,
    orderHistory: Array.isArray(item.orderHistory) ? item.orderHistory : []
  }));
  
  // Kiểm tra nếu data có thêm thông tin khách hàng (từ API mở rộng)
  const hasCustomerInfo = normalizedData.length > 0 && normalizedData[0].customerName !== null;
  
  return (
    <div className='doanhthu-chart-wrapper'>
      <h3>Khách hàng mua nhiều nhất</h3>
      
      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>STT</th>
              {hasCustomerInfo && <th>Tên khách hàng</th>}
              <th>Số điện thoại</th>
              <th>Số đơn hàng</th>
              <th>Tổng chi tiêu</th>
              {hasCustomerInfo && <th>Đơn TB/Tháng</th>}
              {hasCustomerInfo && <th>Giá trị TB/Đơn</th>}
              {hasCustomerInfo && <th>Lần mua gần nhất</th>}
            </tr>
          </thead>
          <tbody>
            {normalizedData.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {hasCustomerInfo && <td>{item.customerName || 'Chưa có tên'}</td>}
                <td>{item._id}</td>
                <td>{item.soDon}</td>
                <td>{item.tongTien.toLocaleString('vi-VN')}đ</td>
                {hasCustomerInfo && <td>{typeof item.avgOrdersPerMonth === 'number' ? item.avgOrdersPerMonth.toFixed(1) : '0'}</td>}
                {hasCustomerInfo && <td>{(item.soDon > 0 ? item.tongTien / item.soDon : 0).toLocaleString('vi-VN')}đ</td>}
                {hasCustomerInfo && <td>{item.lastOrder || 'N/A'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h4>Thống kê chi tiêu khách hàng</h4>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" label={{ value: 'Số điện thoại', position: 'insideBottom', offset: -5 }} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip formatter={(value, name) => {
                if (name === 'tongTien') return [value.toLocaleString('vi-VN') + 'đ', 'Tổng chi tiêu'];
                return [value, 'Số đơn hàng'];
              }} />
              <Legend />
              <Bar yAxisId="left" dataKey="soDon" name="Số đơn hàng" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="tongTien" name="Tổng chi tiêu" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {hasCustomerInfo && normalizedData.some(customer => 
        Array.isArray(customer.orderHistory) && customer.orderHistory.length > 0
      ) && (
        <div style={{ marginTop: '30px' }}>
          <h4>Lịch sử mua hàng theo thời gian</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
                <YAxis />
                <Tooltip formatter={(value) => [value.toLocaleString('vi-VN') + 'đ', 'Giá trị đơn hàng']} />
                <Legend />
                {normalizedData.slice(0, 5).map((customer, index) => {
                  // Make sure orderHistory exists and is properly formatted
                  if (!Array.isArray(customer.orderHistory) || customer.orderHistory.length === 0) {
                    return null;
                  }
                  
                  // Ensure all items in orderHistory have date and value
                  const validHistory = customer.orderHistory.filter(
                    item => item && typeof item === 'object' && item.date && (!isNaN(item.value))
                  );
                  
                  if (validHistory.length === 0) {
                    return null;
                  }
                  
                  return (
                    <Line 
                      key={index} 
                      data={validHistory} 
                      dataKey="value" 
                      name={customer._id} 
                      stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
                      connectNulls
                    />
                  );
                }).filter(Boolean)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {!hasCustomerInfo && (
        <div className="upgrade-note" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #e9ecef' }}>
          <p><strong>Gợi ý:</strong> Để xem thông tin chi tiết hơn về khách hàng, có thể cập nhật API hoặc kết nối thêm dữ liệu từ hệ thống quản lý khách hàng.</p>
        </div>
      )}
    </div>
  );
};

export default SoDienThoaiMuaNhieu;