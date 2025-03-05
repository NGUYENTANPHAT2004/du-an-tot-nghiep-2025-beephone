/* eslint-disable react-hooks/exhaustive-deps */
import { Modal } from '../../../../components/Modal'
import { useState, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

function UpdateBlog ({ isOpen, onClose, fetchdata, idblog }) {
  const [tieude_blog, settieude_blog] = useState('')
  const [file, setFile] = useState(null)
  const [noidung, setnoidung] = useState('')
  const [imagetieude, setimagetieude] = useState('')

  const fetchchitiet = async (req, res) => {
    try {
      const response = await fetch(
        `http://localhost:3005/chitietblog1/${idblog}`
      )
      const data = await response.json()
      if (response.ok) {
        settieude_blog(data.tieude_blog)
        setnoidung(data.noidung)
        setimagetieude(data.img_blog)
      }
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    if (idblog && isOpen) {
      fetchchitiet()
    }
  }, [idblog, isOpen])
  const handelclose = () => {
  setimagetieude('')
  settieude_blog('')
  setnoidung('')
  setFile(null)
  onClose()
}


  const handleEditBlog = async () => {
    try {
      const formData = new FormData() // Tạo FormData
      formData.append('tieude_blog', tieude_blog)
      formData.append('noidung', noidung)

      if (file) {
        formData.append('image', file)
      }

      const response = await fetch('http://localhost:3005/postblog', {
        method: 'POST',
        body: formData
      })
      if (response.ok) {
        handelclose()
        fetchdata()
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handelclose}>
      <div className='addtheloai'>
        <h2>Cập nhật Blog</h2>
        <div className='div_input_group'>
          <div className='input-group1'>
            <img src={imagetieude} alt='' width={300} height={200} />
          </div>
          <div className='input-group'>
            <label> Ảnh</label>
            <input
              type='file'
              onChange={e => {
                const file = e.target.files[0]
                if (file) {
                  setFile(file)
                  setimagetieude(URL.createObjectURL(file))
                }
              }}
            />
          </div>
        </div>
        <div className='input-group'>
          <label>Tiêu đề:</label>
          <input
            type='text'
            value={tieude_blog}
            onChange={e => settieude_blog(e.target.value)}
            placeholder='Nhập tiêu đề'
          />
          <label>Nội dung:</label>
          <ReactQuill
            value={noidung}
            onChange={setnoidung}
            placeholder='Nhập nội dung'
            theme='snow'
          />
        </div>

        <div className='button-group'>
          <button onClick={handleEditBlog} className='btnaddtl'>
            Cập nhật
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UpdateBlog