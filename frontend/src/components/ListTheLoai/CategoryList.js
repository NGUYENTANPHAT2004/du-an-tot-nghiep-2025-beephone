import React, { useEffect, useState } from 'react'
import './CategoryList.scss'
import { Link } from 'react-router-dom'

const CategoryList = () => {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetch('http://localhost:3005/theloaisanpham')
      .then(response => response.json())
      .then(data => setCategories(data))
      .catch(error => console.error('Error fetching categories:', error))
  }, [])

  return (
    <div className='category-list'>
      <div className='category-title'>DANH MỤC SẢN PHẨM</div>
      <ul>
        {categories.map(category => (
          <li key={category.id} className='category-item'>
            <Link to={`/san-pham/${category.namekhongdau}`}>
              <div className='category-name'>{category.name}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CategoryList
