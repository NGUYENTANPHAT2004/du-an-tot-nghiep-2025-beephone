import React from 'react'
import ReactDOM from 'react-dom'
import './Modal.scss'
import { IoMdClose } from 'react-icons/io'

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div className='modal-overlay'>
      <div className='modal-content' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <button className='modal-close' onClick={onClose}>
            <IoMdClose className='icons' />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default Modal
