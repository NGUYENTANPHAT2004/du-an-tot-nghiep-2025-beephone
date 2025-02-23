import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './ChiTietBlog.scss'
import ListBlog from '../../components/ListBlog/ListBlog'
import { Helmet } from 'react-helmet'

const BlogDetail = () => {
  const { tieude } = useParams()
  const [blog, setBlog] = useState(null)

  useEffect(() => {
    fetch(`http://localhost:3005/chitietblog/${tieude}`)
      .then(response => response.json())
      .then(data => setBlog(data))
      .catch(error => console.error('Error fetching blog details:', error))
  }, [tieude])

  if (!blog) return <div>Loading...</div>

  return (
    <>
      <div className='blog-detail-container'>
        <Helmet>
          <title>{blog.tieude_blog}</title>
        </Helmet>
        <div className='blog-detail'>
          <h1>{blog.tieude_blog}</h1>
          <div dangerouslySetInnerHTML={{ __html: blog.noidung }} />
        </div>
      </div>
      <ListBlog />
    </>
  )
}

export default BlogDetail
