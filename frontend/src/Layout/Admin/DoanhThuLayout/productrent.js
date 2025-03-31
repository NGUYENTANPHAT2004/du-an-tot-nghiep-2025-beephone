import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const ProductTrends = ({ startDate, endDate }) => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:3005/getsanpham');
        setProducts(res.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchTrendData = async () => {
      setLoading(true);
      try {
        const url = `http://localhost:3005/product-sales-trend?startDate=${startDate}&endDate=${endDate}${selectedProduct ? `&productId=${selectedProduct}` : ''}`;
        const res = await axios.get(url);
        setTrendData(res.data);
      } catch (error) {
        console.error('Error fetching trend data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchTrendData();
    }
  }, [startDate, endDate, selectedProduct]);

  return (
    <div className='doanhthu-chart-wrapper'>
      <h3>Xu hướng bán sản phẩm</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="product-select">Chọn sản phẩm: </label>
        <select 
          id="product-select"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          style={{ padding: '5px', marginLeft: '10px' }}
        >
          <option value="">Tất cả sản phẩm</option>
          {products.map(product => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>
      
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : trendData.length === 0 ? (
        <div>Không có dữ liệu trong khoảng thời gian này</div>
      ) : (
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip formatter={(value, name) => {
                if (name === 'revenue') return [value.toLocaleString('vi-VN') + 'đ', 'Doanh thu'];
                return [value, 'Số lượng'];
              }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="quantity" name="Số lượng" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ProductTrends;