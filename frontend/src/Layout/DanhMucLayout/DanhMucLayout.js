import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Loading from '../../components/Loading/Loading';
import ProductCard from '../../components/ProductItem/ProductCard';
import './DanhMucLayout.scss';
import ListBlog from '../../components/ListBlog/ListBlog';
import ThanhDinhHuong from '../../components/ThanhDinhHuong/ThanhDinhHuong';
import { Helmet } from 'react-helmet';
import { DanhGiaLayout } from '../DanhGiaLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const DanhMucLayout = () => {
  const { slug } = useParams();
  const [categoryDetail, setCategoryDetail] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [selectedTheLoai, setSelectedTheLoai] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('asc');
  const [allTheLoai, setAllTheLoai] = useState([]);

  // State to track parent category info
  const [parentCategory, setParentCategory] = useState(null);

  // Fetch category detail by slug
  useEffect(() => {
    const fetchCategoryDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3005/categoryitem/${slug}`);
        if (!response.ok) {
          throw new Error("Danh mục không tồn tại");
        }
        const data = await response.json();
        console.log("Dữ liệu danh mục:", data);
        setCategoryDetail(data);
        
        // If category has a parent, fetch parent details
        if (data.parent) {
          try {
            const parentResponse = await fetch(`http://localhost:3005/categoryitem/${data.parent}`);
            if (parentResponse.ok) {
              const parentData = await parentResponse.json();
              setParentCategory(parentData);
            }
          } catch (error) {
            console.error("Lỗi khi tải danh mục cha:", error);
          }
        }
        
        // Extract all theloai from the category
        const theLoaiList = extractAllTheLoai(data);
        setAllTheLoai(theLoaiList);
        
        // Fetch products from all the theloai
        await fetchAllProducts(theLoaiList);
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
        setLoading(false);
      }
    };
    fetchCategoryDetail();
  }, [slug]);

  // Extract all theloai from category and its children recursively
  const extractAllTheLoai = (category) => {
    let result = [];
    
    // Add theloai from current category
    if (category.theloai && category.theloai.length > 0) {
      result = [...category.theloai];
    }
    
    // Add theloai from children recursively
    if (category.children && category.children.length > 0) {
      category.children.forEach(child => {
        const childTheLoai = extractAllTheLoai(child);
        result = [...result, ...childTheLoai];
      });
    }
    
    // Remove duplicates by ID
    return result.filter((theLoai, index, self) => 
      index === self.findIndex(t => t._id === theLoai._id)
    );
  };

  // Fetch products from all theloai
  const fetchAllProducts = async (theLoaiList) => {
    try {
      // Create an array of promises for parallel fetching
      const productPromises = theLoaiList.map(theLoai => 
        fetch(`http://localhost:3005/san-pham-pt/${theLoai.namekhongdau}?limit=100`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Error fetching products for ${theLoai.name}`);
            }
            return response.json();
          })
          .then(data => ({
            theLoai: theLoai.name,
            theLoaiSlug: theLoai.namekhongdau,
            products: data.sanpham || []
          }))
          .catch(error => {
            console.error(error);
            return { theLoai: theLoai.name, theLoaiSlug: theLoai.namekhongdau, products: [] };
          })
      );
      
      // Wait for all requests to complete
      const results = await Promise.all(productPromises);
      
      // Combine all products with their theloai info
      let allProductsData = [];
      results.forEach(result => {
        const productsWithTheLoai = result.products.map(product => ({
          ...product,
          theLoaiName: result.theLoai,
          theLoaiSlug: result.theLoaiSlug
        }));
        allProductsData = [...allProductsData, ...productsWithTheLoai];
      });
      
      // Remove duplicate products (by ID)
      const uniqueProducts = allProductsData.filter((product, index, self) =>
        index === self.findIndex(p => p._id === product._id)
      );
      
      setAllProducts(uniqueProducts);
      applyFiltersAndPagination(uniqueProducts, 'all', sortOrder, page, limit);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải tất cả sản phẩm:", error);
      setLoading(false);
    }
  };

  // Apply filters and pagination to the products
  const applyFiltersAndPagination = (products, theLoai, sort, currentPage, itemsPerPage) => {
    // Filter by theloai if not 'all'
    let filteredProducts = products;
    if (theLoai !== 'all') {
      filteredProducts = products.filter(product => product.theLoaiSlug === theLoai);
    }
    
    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
      return sort === 'asc' ? a.price - b.price : b.price - a.price;
    });
    
    // Calculate pagination
    const total = sortedProducts.length;
    const totalPageCount = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex);
    
    setDisplayProducts(paginatedProducts);
    setTotalPages(totalPageCount > 0 ? totalPageCount : 1);
  };

  // Handle category/theloai change
  useEffect(() => {
    if (allProducts.length > 0) {
      setPage(1); // Reset to first page when changing category
      applyFiltersAndPagination(allProducts, selectedTheLoai, sortOrder, 1, limit);
    }
  }, [selectedTheLoai, sortOrder]);

  // Handle page change
  useEffect(() => {
    if (allProducts.length > 0) {
      applyFiltersAndPagination(allProducts, selectedTheLoai, sortOrder, page, limit);
    }
  }, [page]);

  if (loading) return <Loading />;

  // Build breadcrumbs with parent categories
  const buildBreadcrumbs = () => {
    const breadcrumbs = [{ label: "Trang Chủ", link: "/" }];
    
    // If we have parent category info, add it to breadcrumbs
    if (parentCategory) {
      breadcrumbs.push({ 
        label: parentCategory.name, 
        link: `/danh-muc/${parentCategory.namekhongdau}` 
      });
    }
    
    // Add current category
    breadcrumbs.push({ 
      label: categoryDetail?.name || "Danh mục", 
      link: `/danh-muc/${slug}` 
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = buildBreadcrumbs();

  return (
    <div className="theloailayout-container">
      <Helmet>
        <title>{categoryDetail?.name || "Danh mục"} - Shopdunk</title>
        <meta name="description" content={categoryDetail?.name} />
      </Helmet>

      <ThanhDinhHuong breadcrumbs={breadcrumbs} />

      {/* Thể loại tabs */}
      {allTheLoai.length > 0 && (
        <div className="theloai-tabs">
          <button
            onClick={() => setSelectedTheLoai('all')}
            className={selectedTheLoai === 'all' ? 'active' : ''}
          >
            Tất cả
          </button>
          {allTheLoai.map(theLoai => (
            <button
              key={theLoai._id}
              onClick={() => setSelectedTheLoai(theLoai.namekhongdau)}
              className={selectedTheLoai === theLoai.namekhongdau ? 'active' : ''}
            >
              {theLoai.name}
            </button>
          ))}
        </div>
      )}

      {/* Sort dropdown */}
      <div className="filter-dropdown">
        <select
          onChange={e => setSortOrder(e.target.value)}
          value={sortOrder}
          className="custom-select"
        >
          <option value="asc">Giá thấp đến cao</option>
          <option value="desc">Giá cao đến thấp</option>
        </select>
      </div>

      {/* Product list */}
      <div className="theloaisp">
        {displayProducts.length > 0 ? (
          displayProducts.map(product => (
            <ProductCard
              key={product._id}
              sanpham={product}
              setLoading={setLoading}
              nametheloai={product.theLoaiSlug}
            />
          ))
        ) : (
          <div className="no-products">Không có sản phẩm nào trong danh mục này</div>
        )}
      </div>

      {/* Pagination */}
      {displayProducts.length > 0 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <span>
            Trang {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      )}

      <ListBlog />
      <DanhGiaLayout />
    </div>
  );
};

export default DanhMucLayout;