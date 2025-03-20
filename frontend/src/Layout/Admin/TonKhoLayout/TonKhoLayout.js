import { useState, useEffect } from 'react';
import './TonKhoLayout.scss';
import { FaEdit } from 'react-icons/fa';
import { CapNhatTonKho } from './UpdateTonKho/CapNhatTonKho';
import { 
  initializeSocket, 
  registerStockListeners, 
  checkStock 
} from '../../../untils/socketUtils';
import { toast,ToastContainer } from 'react-toastify'

function TonKhoLayout() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // Changed to single selection model
  const [selectAll, setSelectAll] = useState(false);
  const [isOpenCapNhat, setIsOpenCapNhat] = useState(false);
   useEffect(() => {
     // Initialize socket
     initializeSocket();
 
     // Register stock alert listeners
     const unregisterListeners = registerStockListeners(
       // onLowStock
       (data) => {
         console.log('Received low stock alert:', data);
 
         // Hiển thị thông báo
         if (data.products && data.products.length > 0) {
           toast.warning(`Cảnh báo: Có ${data.products.length} sản phẩm có số lượng tồn kho thấp (<=5)!`, {//+
             position: "top-right",//+
             autoClose: 5000,//+
             hideProgressBar: false,//+
             closeOnClick: true,//+
             pauseOnHover: true,//+
             draggable: true//+
           });//+
         }
       },
       // onStockStatus
       (data) => {
         console.log('Stock status:', data);
       },
       // onStockError
       (error) => {
         console.error('Stock check error:', error);
         alert(`Lỗi khi kiểm tra tồn kho: ${error.message}`);//-
         toast.error(`Lỗi khi kiểm tra tồn kho: ${error.message}`, {//+
           position: "top-right",//+
           autoClose: 5000,//+
           hideProgressBar: false,//+
           closeOnClick: true,//+
           pauseOnHover: true,//+
           draggable: true//+
         });//+
       }
     );
 
     // Check stock levels immediately
     checkStock();
 
     // Clean up listeners when component unmounts
     return () => {
       unregisterListeners();
     };
   }, []);
  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Số sản phẩm trên mỗi trang

  // State bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDungLuong, setFilterDungLuong] = useState('');
  const [filterMauSac, setFilterMauSac] = useState('');
  
  // State để lưu sản phẩm được làm phẳng để hiển thị
  const [flattenedProducts, setFlattenedProducts] = useState([]);
  // State để lưu thông tin variant được chọn
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Fetch tất cả sản phẩm tồn kho
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3005/tonkho/sanpham');
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
        processProductData(data);
      } else {
        console.error('Không thể lấy dữ liệu sản phẩm');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
    }
  };

  // Hàm xử lý và làm phẳng dữ liệu sản phẩm
  const processProductData = (productData) => {
    // Tạo danh sách phẳng các biến thể sản phẩm
    const flattened = productData.flatMap(product => {
      return product.dungluong.flatMap(dl => {
        return dl.mausac.map(ms => {
          return {
            productId: product._id,
            productName: product.name,
            dungLuongId: dl._id,
            dungLuongName: dl.name,
            mauSacId: ms._id,
            mauSacName: ms.name,
            quantity: ms.quantity,
            price: ms.price,
            uniqueId: `${product._id}-${dl._id}-${ms._id}`
          };
        });
      });
    });
    
    setFlattenedProducts(flattened);
    setFilteredProducts(flattened);
    
    // Reset selected item if it doesn't exist in the new data
    if (selectedId) {
      const stillExists = flattened.some(item => item.uniqueId === selectedId);
      if (!stillExists) {
        setSelectedId(null);
        setSelectedVariant(null);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Xử lý chọn/bỏ chọn một item
  const handleSelectItem = (uniqueId) => {
    if (selectedId === uniqueId) {
      // Nếu đã chọn, bỏ chọn
      setSelectedId(null);
      setSelectedVariant(null);
    } else {
      // Ngược lại, chọn mới
      setSelectedId(uniqueId);
      const variant = flattenedProducts.find(item => item.uniqueId === uniqueId);
      setSelectedVariant(variant);
    }
  };

  // Bộ lọc sản phẩm
  useEffect(() => {
    let filtered = flattenedProducts;

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterDungLuong) {
      filtered = filtered.filter(item => item.dungLuongName === filterDungLuong);
    }

    if (filterMauSac) {
      filtered = filtered.filter(item => item.mauSacName === filterMauSac);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchQuery, filterDungLuong, filterMauSac, flattenedProducts]);

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  // Danh sách tất cả các dung lượng và màu sắc không trùng lặp
  const allDungLuong = [...new Set(flattenedProducts.map(item => item.dungLuongName))];
  const allMauSac = [...new Set(flattenedProducts.map(item => item.mauSacName))];
  const handleFilterLowStock = () => {
    let filtered = flattenedProducts.filter(item => item.quantity < 5);
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };
  return (
    <div className="theloai_container">
      <ToastContainer/>
      <div className="nav_chucnang">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={filterDungLuong} onChange={(e) => setFilterDungLuong(e.target.value)}>
          <option value="">Chọn dung lượng</option>
          {allDungLuong.map((dl, index) => (
            <option key={index} value={dl}>{dl}</option>
          ))}
        </select>
        <select value={filterMauSac} onChange={(e) => setFilterMauSac(e.target.value)}>
          <option value="">Chọn màu sắc</option>
          {allMauSac.map((ms, index) => (
            <option key={index} value={ms}>{ms}</option>
          ))}
        </select>
        <button className="low-stock-filter" onClick={handleFilterLowStock}>
          Lọc hàng tồn thấp
        </button>
        <button
          className="btnthemtheloai"
          onClick={() => {
            if (!selectedId) {
              alert('Chọn một biến thể sản phẩm để cập nhật');
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
            <th>Chọn</th>
            <th>STT</th>
            <th>Tên sản phẩm</th>
            <th>Dung lượng</th>
            <th>Màu sắc</th>
            <th>Số lượng</th>
          </tr>
        </thead>
        <tbody>
          {displayedProducts.map((item, index) => (
            <tr 
              key={item.uniqueId}
              className={selectedId === item.uniqueId ? "selected-row" : ""}
            >
              <td>
                <input
                  type="radio"
                  checked={selectedId === item.uniqueId}
                  onChange={() => handleSelectItem(item.uniqueId)}
                />
              </td>
              <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
              <td>{item.productName}</td>
              <td>{item.dungLuongName}</td>
              <td>{item.mauSacName}</td>
              <td>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phân trang */}
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
          disabled={currentPage === 1}>
          Trước
        </button>
        <span>Trang {currentPage} / {totalPages || 1}</span>
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
          disabled={currentPage === totalPages || totalPages === 0}>
          Tiếp
        </button>
      </div>

      {selectedVariant && (
        <CapNhatTonKho
          isOpen={isOpenCapNhat}
          onClose={() => setIsOpenCapNhat(false)}
          fetchdata={fetchProducts}
          selectedProductId={selectedVariant.productId}
          selectedDungLuongId={selectedVariant.dungLuongId}
          selectedMauSacId={selectedVariant.mauSacId}
          selectedVariant={selectedVariant}
        />
      )}
    </div>
  );
}

export default TonKhoLayout;