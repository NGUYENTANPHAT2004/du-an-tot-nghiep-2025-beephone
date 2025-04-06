import { Modal } from '../../../../components/Modal'
import { useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import './AddSanPham.scss'

function AddSanPham ({ isOpen, onClose, idtheloai, fetchData }) {
  const [name, setname] = useState('')
  const [price, setprice] = useState('')
  const [image, setimage] = useState('')
  const [file, setFile] = useState(null)
  const [mota, setmota] = useState('')

  const handelclose = () => {
    setname('')
    setmota('')
    setprice('')
    setimage('')
    setFile(null)
    onClose()
  }

  const handelAddsanpham = async () => {
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('content', mota)
      formData.append('price', price)
      if (file) {
        formData.append('image', file)
      }

      const response = await fetch(
        `http://localhost:3005/postchitietsp/${idtheloai}`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (response.ok) {
        handelclose()
        fetchData()
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handelclose}>
      <div>
        <h2>Thêm sản phẩm</h2>
        <div className='div_input_group'>
          <div className='input-group1'>
            {image !== '' ? <img src={image} alt='' width={150} height={200}/> : <h3>Ảnh sản phẩm</h3>}
          </div>
          <div className='input-group'>
            <label> Ảnh</label>
            <input
              type='file'
              onChange={e => {
                const file = e.target.files[0]
                if (file) {
                  setFile(file)
                  setimage(URL.createObjectURL(file))
                }
              }}
            />
            <label>Tên sản phẩm:</label>
            <input
              type='text'
              value={name}
              onChange={e => setname(e.target.value)}
              placeholder='Nhập tên sản phẩm'
            />
            <label>Giá sản phẩm:</label>
            <input
              type='text'
              value={price}
              onChange={e => setprice(e.target.value)}
              placeholder='Nhập đơn giá'
            />
          </div>
        </div>
        <label>Mô tả sản phẩm:</label>
        <ReactQuill
          value={mota}
          onChange={setmota}
          placeholder='Nhập mô tả sản phẩm'
          theme='snow'
        />

        <div className='button-group'>
          <button className='btnaddtl' onClick={handelAddsanpham}>
            Thêm
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default AddSanPham