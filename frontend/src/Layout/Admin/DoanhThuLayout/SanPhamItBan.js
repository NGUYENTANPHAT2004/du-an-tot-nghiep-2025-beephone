import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const SanPhamItBan = ({ data }) => {
  const colors = ['#f44336', '#e57373', '#ef5350', '#e53935', '#c62828'];

  return (
    <div className='doanhthu-chart-wrapper'>
      <h3>Sản phẩm ít bán nhất</h3>
      
      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên sản phẩm</th>
              <th>Dung lượng</th>
              <th>Số lượng</th>
              <th>Doanh thu</th>
              <th>% Tổng SL</th>
              <th>% Tổng DT</th>
              <th>Đơn giá TB</th>
            </tr>
          </thead>
          <tbody>
            {data.map((sp, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{sp.tensp}</td>
                <td>{sp.dungluongName || 'N/A'}</td>
                <td>{sp.soluong}</td>
                <td>{sp.doanhthu.toLocaleString('vi-VN')}đ</td>
                <td>{sp.percentOfTotalSales}%</td>
                <td>{sp.percentOfTotalRevenue}%</td>
                <td>{Math.round(sp.averagePrice).toLocaleString('vi-VN')}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="chart-container" style={{ marginTop: '20px', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tensp" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => {
                return [value.toLocaleString('vi-VN'), name === 'doanhthu' ? 'Doanh thu (đ)' : 'Số lượng'];
              }}
            />
            <Bar dataKey="soluong" name="Số lượng" fill="#f44336">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SanPhamItBan;