import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const OrderSuccessRate = ({ data = {} }) => {
  const COLORS = ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E'];
  const STATUS_LABELS = {
    success: 'Thành công',
    pending: 'Đang xử lý',
    failed: 'Thất bại',
    cancelled: 'Đã hủy'
  };

  // Add default values for data properties
  const {
    totalOrders = 0,
    totalRevenue = 0,
    statusStats = {
      success: { count: 0, rate: 0, amount: 0 },
      pending: { count: 0, rate: 0, amount: 0 },
      failed: { count: 0, rate: 0, amount: 0 },
      cancelled: { count: 0, rate: 0, amount: 0 }
    },
    dailyStats = []
  } = data;

  const pieData = Object.entries(statusStats).map(([key, value]) => ({
    name: STATUS_LABELS[key],
    value: value.count || 0,
    rate: value.rate || 0,
    amount: value.amount || 0
  }));

  const dailyData = dailyStats.map(day => ({
    date: day._id,
    totalOrders: day.totalOrders || 0,
    totalAmount: day.totalAmount || 0,
    successRate: day.statusBreakdown?.find(s => s.status === 'Đã thanh toán')?.count 
      ? (day.statusBreakdown.find(s => s.status === 'Đã thanh toán').count / day.totalOrders * 100)
      : 0
  }));

  return (
    <div className='doanhthu-chart-wrapper'>
      <h3>Tỷ lệ đơn hàng</h3>
      
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-value">{totalOrders.toLocaleString('vi-VN')}</div>
          <div className="stat-label">Tổng số đơn hàng</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{totalRevenue.toLocaleString('vi-VN')}đ</div>
          <div className="stat-label">Tổng doanh thu</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{statusStats.success.rate}%</div>
          <div className="stat-label">Tỷ lệ thành công</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div style={{ width: '48%', height: '300px' }}>
          <h4 style={{ textAlign: 'center' }}>Phân bố trạng thái đơn hàng</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={({name, rate}) => `${name}: ${rate}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => {
                const item = pieData.find(d => d.name === name);
                return [`${value} đơn (${item.rate}%)`, name];
              }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ width: '48%', height: '300px' }}>
          <h4 style={{ textAlign: 'center' }}>Tỷ lệ thành công theo ngày</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip formatter={(value, name) => {
                if (name === 'successRate') return [`${value.toFixed(1)}%`, 'Tỷ lệ thành công'];
                if (name === 'totalAmount') return [value.toLocaleString('vi-VN') + 'đ', 'Doanh thu'];
                return [value, 'Số đơn'];
              }} />
              <Legend />
              <Bar yAxisId="left" dataKey="totalOrders" name="Số đơn" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="successRate" name="Tỷ lệ thành công" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stats-table-container" style={{ marginTop: '20px' }}>
        <table className="stats-table">
          <thead>
            <tr>
              <th>Trạng thái</th>
              <th>Số lượng</th>
              <th>Tỷ lệ</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {pieData.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.value.toLocaleString('vi-VN')}</td>
                <td>{item.rate}%</td>
                <td>{item.amount.toLocaleString('vi-VN')}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderSuccessRate; 