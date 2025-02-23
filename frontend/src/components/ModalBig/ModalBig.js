import React from 'react'
import ReactDOM from 'react-dom'
import './ModalBig.scss'
import { IoMdClose } from 'react-icons/io'

const ModalBig = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div className='ModalBig-overlay'>
      <div className='ModalBig-content'>
        <div className='modal-header'>
          <button className='ModalBig-close' onClick={onClose}>
            <IoMdClose className='icons' />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default ModalBig
