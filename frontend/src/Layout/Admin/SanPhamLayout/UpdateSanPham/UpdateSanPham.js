/* eslint-disable react-hooks/exhaustive-deps */
import { Modal } from '../../../../components/Modal'
import { useState, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

function UpdateSanPham ({
  isOpen,
  onClose,
  idsanpham,
  fetchData,
  setSelectedIds
}) {
  const [name, setname] = useState('')
  const [price, setprice] = useState('')
  const [image, setimage] = useState('')
  const [file, setFile] = useState(null)
  const [mota, setmota] = useState('')

  const fetchchitiet = async (req, res) => {
    try {
      const response = await fetch(
        `http://localhost:3005/getchitietspadmin/${idsanpham}`
      )
      const data = await response.json()
      if (response.ok) {
        setname(data.name)
        setmota(data.content)
        setprice(data.price)
        setimage(data.image)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (idsanpham && isOpen) {
      fetchchitiet()
    }
  }, [idsanpham, isOpen])
  const handelclose = () => {
    setname('')
    setmota('')
    setprice('')
    setimage('')
    setFile(null)
    onClose()
  }

  const handelUpdate = async () => {
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('content', mota)
      formData.append('price', price)
      if (file) {
        formData.append('image', file)
      }

      const response = await fetch(
        `http://localhost:3005/updatechitietsp/${idsanpham}`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (response.ok) {
        handelclose()
        setSelectedIds([])
        fetchData()
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handelclose}>
      <div>
        <h2>Cập nhật sản phẩm</h2>
        <div className='div_input_group'>
          <div className='input-group'>
            <img src={image} alt='' />
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
          <button className='btnaddtl' onClick={handelUpdate}>
            Cập nhật
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UpdateSanPham