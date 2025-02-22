import React, { useState, useEffect } from 'react'
import './Header.scss'
import { useNavigate } from 'react-router-dom'
import { FaSearch } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBagShopping } from '@fortawesome/free-solid-svg-icons'

const Header = () => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [itemCount, setItemCount] = useState(0)

  const updateCartCount = () => {
    const cart = localStorage.getItem('cart')
    setItemCount(cart ? JSON.parse(cart).length : 0)
  }

useEffect(() => {
  updateCartCount()

  const handleCartChange = () => updateCartCount()
  window.addEventListener('cartUpdated', handleCartChange)

  return () => {
    window.removeEventListener('cartUpdated', handleCartChange)
  }
}, [])


  const navigate = useNavigate()

  const handleSearch = () => {
    if (searchKeyword.trim() !== '') {
      navigate(`/search/${encodeURIComponent(searchKeyword)}`)
    }
  }

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className='header-container'>
      <div className='cart-container'>
        <FontAwesomeIcon icon={faBagShopping} className='cart-icon' />
        {itemCount > 0 && <span className='cart-badge'>{itemCount}</span>}
      </div>
      <div className='header-right'>
        <input
          type='text'
          className='search-input'
          placeholder='Tìm kiếm'
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className='search-button' onClick={handleSearch}>
          <FaSearch
            style={{ color: '#fff', fontSize: '20px', display: 'inline-block' }}
          />
        </button>
      </div>
    </div>
  )
}

export default Header