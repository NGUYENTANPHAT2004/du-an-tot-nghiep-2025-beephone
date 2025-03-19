import { useState, useEffect } from 'react'
import { FaEdit, FaPlus } from 'react-icons/fa'
import { AddBlog } from './AddBlog'
import { XoaBlog } from './XoaBlog'
import { UpdateBlog } from './UpdateBlog'
import './BlogLayout.scss'
import { FaTrashCan } from 'react-icons/fa6'
function BlogLayout () {
  const [data, setdata] = useState([])

  const [isOpenAdd, setIsOpenAdd] = useState(false)
  const [isOpenDelete, setIsOpenDelete] = useState(false)
  const [isOpenEdit, setIsOpenEdit] = useState(false)

  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  const fetchdata = async () => {
    try {
      const response = await fetch('http://localhost:3005/getblog')
      if (response.ok) {
        const data = await response.json()
        setdata(data)
      }
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    fetchdata()
  }, [])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.map(item => item._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectItem = id => {
    let newSelectedIds = [...selectedIds]
    if (newSelectedIds.includes(id)) {
      newSelectedIds = newSelectedIds.filter(itemId => itemId !== id)
    } else {
      newSelectedIds.push(id)
    }
    setSelectedIds(newSelectedIds)

    setSelectAll(newSelectedIds.length === data.length)
  }

  return (
    <div className='blog_container'>
      <div className='nav_chucnang'>
        <button className='btnthemtheloai' onClick={() => setIsOpenAdd(true)}>
          <FaPlus className='icons' />
          Thêm Blog
        </button>
        <button
          className='btnthemtheloai'
          onClick={() => {
            if (selectedIds.length === 0) {
              alert('Chọn một Blog để cập nhật')
            } else if (selectedIds.length > 1) {
              alert('Chỉ được chọn một Blog để cập nhật')
            } else {
              setIsOpenEdit(true)
            }
          }}
        >
          <FaEdit className='icons' />
          Cập nhật
        </button>

        <button
          className='btnthemtheloai'
          onClick={() =>
            selectedIds.length > 0
              ? setIsOpenDelete(true)
              : alert('Chọn một Blog để xóa')
          }
        >
          <FaTrashCan className='icons' />
          Xóa Blog
        </button>
      </div>

      <table className='tablenhap'>
        <thead>
          <tr>
            <th>
              <input
                type='checkbox'
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
            <th>STT</th>
            <th>ID</th>
            <th>Ảnh</th>
            <th>Tiêu đề</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>
                <input
                  type='checkbox'
                  checked={selectedIds.includes(item._id)}
                  onChange={() => handleSelectItem(item._id)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{item._id}</td>
              <td>
                <img src={`${item.img_blog}`} alt='' />
              </td>
              <td>{item.tieude_blog}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddBlog
        isOpen={isOpenAdd}
        onClose={() => setIsOpenAdd(false)}
        fetchdata={fetchdata}
      />
      <XoaBlog
        isOpen={isOpenDelete}
        onClose={() => setIsOpenDelete(false)}
        idblog={selectedIds}
        fetchdata={fetchdata}
      />
      <UpdateBlog
        isOpen={isOpenEdit}
        onClose={() => setIsOpenEdit(false)}
        fetchdata={fetchdata}
        idblog={selectedIds}
      />
    </div>
  )
}

export default BlogLayout