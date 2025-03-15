import { useState, useEffect } from 'react';
import './TonKhoLayout.scss';
import { FaEdit } from 'react-icons/fa';
import { CapNhatTonKho } from './UpdateTonKho/CapNhatTonKho';

function TonKhoLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isOpenCapNhat, setIsOpenCapNhat] = useState(false);

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Số sản phẩm trên mỗi trang

  // State bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDungLuong, setFilterDungLuong] = useState('');
  const [filterMauSac, setFilterMauSac] = useState('');

  // Fetch tất cả sản phẩm tồn kho
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3005/tonkho/allproducts');
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
        setFilteredProducts(data);
      } else {
        console.error('Không thể lấy dữ liệu sản phẩm');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Xử lý chọn tất cả
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(item => item._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prevSelected =>
      prevSelected.includes(id) ? prevSelected.filter(itemId => itemId !== id) : [...prevSelected, id]
    );
  };

  // **Bộ lọc sản phẩm**
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filterDungLuong) {
      filtered = filtered.filter(item =>
        item.dungluong.some(dl => dl.name.includes(filterDungLuong))
      );
    }

    if (filterMauSac) {
      filtered = filtered.filter(item =>
        item.dungluong.some(dl => dl.mausac.some(ms => ms.name.includes(filterMauSac)))
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchQuery, filterDungLuong, filterMauSac, products]);

  // **Phân trang**
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) {
    return <p>Đang tải dữ liệu...</p>;
  }

  if (filteredProducts.length === 0) {
    return <p>Không tìm thấy sản phẩm phù hợp!</p>;
  }

  return (
    <div className="theloai_container">
      <div className="nav_chucnang">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={filterDungLuong} onChange={(e) => setFilterDungLuong(e.target.value)}>
          <option value="">Chọn dung lượng</option>
          {Array.from(new Set(products.flatMap(p => p.dungluong.map(dl => dl.name)))).map((dl, index) => (
            <option key={index} value={dl}>{dl}</option>
          ))}
        </select>
        <select value={filterMauSac} onChange={(e) => setFilterMauSac(e.target.value)}>
          <option value="">Chọn màu sắc</option>
          {Array.from(new Set(products.flatMap(p => p.dungluong.flatMap(dl => dl.mausac.map(ms => ms.name))))).map((ms, index) => (
            <option key={index} value={ms}>{ms}</option>
          ))}
        </select>
        
        <button
          className="btnthemtheloai"
          onClick={() => {
            if (selectedIds.length === 0) {
              alert('Chọn một sản phẩm để cập nhật');
            } else if (selectedIds.length > 1) {
              alert('Chỉ được chọn một sản phẩm để cập nhật kho');
            } else {
              setIsOpenCapNhat(true);
            }
          }}
        >
          <FaEdit className="icons" /> Cập nhật số lượng kho
        </button>
      </div>

      <table className="tablenhap">
        <thead>
          <tr>
            <th>
              <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
            </th>
            <th>STT</th>
            <th>Tên sản phẩm</th>
            <th>Dung lượng</th>
            <th>Màu sắc</th>
            <th>Số lượng</th>
          </tr>
        </thead>
        <tbody>
          {displayedProducts.map((item, index) => (
            item.dungluong.map((dl) => (
              dl.mausac.map((ms) => (
                <tr key={`${item._id}-${dl._id}-${ms._id}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item._id)}
                      onChange={() => handleSelectItem(item._id)}
                    />
                  </td>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{item.name}</td>
                  <td>{dl.name}</td>
                  <td>{ms.name}</td>
                  <td>{ms.quantity}</td>
                </tr>
              ))
            ))
          ))}
        </tbody>
      </table>

      {/* Phân trang */}
      <div className="pagination">
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Trước
        </button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          Tiếp
        </button>
      </div>

      <CapNhatTonKho
        isOpen={isOpenCapNhat}
        onClose={() => setIsOpenCapNhat(false)}
        fetchdata={fetchProducts}
      />
    </div>
  );
}

export default TonKhoLayout;
