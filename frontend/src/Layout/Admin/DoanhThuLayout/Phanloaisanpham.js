import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PhanLoaiSanPham = ({ data }) => {
  // Ensure data is an array and not empty
  const validData = Array.isArray(data) ? data : [];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
  
  // If no data, show a message
  if (validData.length === 0) {
    return (
      <div className='doanhthu-chart-wrapper'>
        <h3>Phân loại sản phẩm theo danh mục</h3>
        <div className="no-data-message" style={{ padding: '20px', textAlign: 'center' }}>
          <p>Không có dữ liệu trong khoảng thời gian này.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className='doanhthu-chart-wrapper'>
      <h3>Phân loại sản phẩm theo danh mục</h3>
      
      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Danh mục</th>
              <th>Số sản phẩm</th>
              <th>Số lượng bán</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {validData.map((category, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{category.categoryName || 'Không rõ'}</td>
                <td>{category.productCount || 0}</td>
                <td>{category.totalQuantity || 0}</td>
                <td>{(category.totalRevenue || 0).toLocaleString('vi-VN')}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div style={{ width: '48%', height: '300px' }}>
          <h4 style={{ textAlign: 'center' }}>Phân bố doanh thu theo danh mục</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={validData}
                dataKey="totalRevenue"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={({name, percent}) => `${name || 'Không rõ'}: ${(percent * 100).toFixed(0)}%`}
              >
                {validData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => (value || 0).toLocaleString('vi-VN') + 'đ'} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ width: '48%', height: '300px' }}>
          <h4 style={{ textAlign: 'center' }}>Phân bố số lượng bán theo danh mục</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={validData}
                dataKey="totalQuantity"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#82ca9d"
                label={({name, percent}) => `${name || 'Không rõ'}: ${(percent * 100).toFixed(0)}%`}
              >
                {validData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PhanLoaiSanPham;