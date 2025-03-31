import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const TrungBinhMoiDon = ({ data = {} }) => {
  // Set default values for all properties
  const safeData = {
    totalDon: 0,
    avgSP: 0,
    medianItems: 0,
    maxItems: 0,
    totalItems: 0,
    orderSizes: {
      single: 0,
      small: 0,
      medium: 0,
      large: 0,
      extraLarge: 0
    },
    timeOfDay: {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    },
    busiest: {
      day: 'N/A',
      timeOfDay: 'N/A'
    },
    returnsPercent: '0.0',
    ...data
  };
  
  // Kiểm tra nếu data có đủ thông tin chi tiết
  // Nếu không phải API mở rộng, hiển thị dạng đơn giản
  const isSimpleData = !safeData.orderSizes || !safeData.timeOfDay;
  
  // Dữ liệu màu cho biểu đồ
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Nếu có dữ liệu phân phối kích thước đơn hàng, tạo dữ liệu cho biểu đồ tròn
  const pieData = isSimpleData ? [] : [
    { name: '1 sản phẩm', value: safeData.orderSizes.single || 0 },
    { name: '2-3 sản phẩm', value: safeData.orderSizes.small || 0 },
    { name: '4-5 sản phẩm', value: safeData.orderSizes.medium || 0 },
    { name: '6-10 sản phẩm', value: safeData.orderSizes.large || 0 },
    { name: '10+ sản phẩm', value: safeData.orderSizes.extraLarge || 0 }
  ];
  
  // Dữ liệu cho biểu đồ cột về thời gian
  const timeData = isSimpleData ? [] : [
    { name: 'Sáng', value: safeData.timeOfDay.morning || 0 },
    { name: 'Trưa', value: safeData.timeOfDay.afternoon || 0 },
    { name: 'Chiều', value: safeData.timeOfDay.evening || 0 },
    { name: 'Tối', value: safeData.timeOfDay.night || 0 }
  ];

  return (
    <div className='doanhthu-chart-wrapper'>
      <h3>Số lượng SP trung bình mỗi đơn</h3>
      
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-value">{(safeData.totalDon || 0).toLocaleString('vi-VN')}</div>
          <div className="stat-label">Tổng số đơn hàng</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{(safeData.avgSP || 0).toFixed(2)}</div>
          <div className="stat-label">SP trung bình/đơn</div>
        </div>
        
        {!isSimpleData && (
          <>
            <div className="stat-card">
              <div className="stat-value">{safeData.medianItems || 0}</div>
              <div className="stat-label">Trung vị sản phẩm/đơn</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{safeData.maxItems || 0}</div>
              <div className="stat-label">Đơn hàng lớn nhất</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{(safeData.totalItems || 0).toLocaleString('vi-VN')}</div>
              <div className="stat-label">Tổng sản phẩm bán</div>
            </div>
          </>
        )}
      </div>
      
      {!isSimpleData && (
        <>
          <div className="distribution-section">
            <h4>Phân phối kích thước đơn hàng</h4>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <div style={{width: '48%', height: '300px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Số đơn hàng']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{width: '48%', height: '300px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Số đơn hàng']} />
                    <Bar dataKey="value" fill="#82ca9d" name="Số đơn hàng" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="additional-stats">
            <h4>Thông tin thêm</h4>
            <div className="stats-flex">
              <div className="stat-item">
                <span className="stat-label">Ngày có nhiều đơn nhất:</span>
                <span className="stat-value">{safeData.busiest.day || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Thời gian đặt hàng phổ biến:</span>
                <span className="stat-value">{safeData.busiest.timeOfDay || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Đơn hàng có hoàn trả:</span>
                <span className="stat-value">{safeData.returnsPercent || '0.0'}%</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Hiển thị dạng đơn giản nếu không có dữ liệu chi tiết */}
      {isSimpleData && (
        <div className="simple-stats">
          <p>Trong khoảng thời gian này, cửa hàng có tổng cộng <strong>{(safeData.totalDon || 0).toLocaleString('vi-VN')}</strong> đơn hàng với trung bình <strong>{(safeData.avgSP || 0).toFixed(2)}</strong> sản phẩm mỗi đơn.</p>
          
          <div style={{ marginTop: '20px' }}>
            <p>Để xem thống kê chi tiết hơn, vui lòng sử dụng API mở rộng hoặc liên hệ với quản trị viên.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrungBinhMoiDon;