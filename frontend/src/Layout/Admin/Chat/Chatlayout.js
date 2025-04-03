import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaRobot, FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import './chatlayout.scss';

const AdminChatTraining = () => {
  const [trainingData, setTrainingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [adminKey, setAdminKey] = useState(localStorage.getItem('admin_key') || '');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (adminKey) {
      fetchTrainingData();
    } else {
      setLoading(false);
    }
  }, [adminKey]);

  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3005/api/admin/training-data?adminKey=${adminKey}`);
      
      if (response.data.status === 'success') {
        setTrainingData(response.data.data);
        // Store the admin key if successful
        localStorage.setItem('admin_key', adminKey);
      } else {
        toast.error('Không thể tải dữ liệu huấn luyện. Vui lòng kiểm tra lại khóa admin.');
        localStorage.removeItem('admin_key');
      }
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast.error('Lỗi xác thực. Vui lòng kiểm tra lại khóa admin.');
      localStorage.removeItem('admin_key');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAdminKey = (e) => {
    e.preventDefault();
    if (adminKey.trim()) {
      fetchTrainingData();
    }
  };

  const handleAddTrainingData = async (e) => {
    e.preventDefault();
    
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error('Vui lòng nhập cả câu hỏi và câu trả lời');
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:3005/api/admin/train', {
        question: newQuestion,
        answer: newAnswer,
        adminKey
      });
      
      if (response.data.status === 'success') {
        toast.success('Thêm dữ liệu huấn luyện thành công!');
        setTrainingData([...trainingData, { question: newQuestion, answer: newAnswer }]);
        setNewQuestion('');
        setNewAnswer('');
      } else {
        toast.error('Không thể thêm dữ liệu huấn luyện');
      }
    } catch (error) {
      console.error('Error adding training data:', error);
      toast.error('Lỗi khi thêm dữ liệu huấn luyện');
    }
  };

  const handleDeleteItem = async (index) => {
    // In a complete implementation, you would add a server endpoint to delete items
    // For now, we'll just update the local state as an example
    const newData = [...trainingData];
    newData.splice(index, 1);
    setTrainingData(newData);
    toast.success('Đã xóa mục huấn luyện');
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditQuestion(trainingData[index].question);
    setEditAnswer(trainingData[index].answer);
  };

  const cancelEditing = () => {
    setEditingIndex(-1);
    setEditQuestion('');
    setEditAnswer('');
  };

  const saveEdit = async (index) => {
    // In a complete implementation, you would add a server endpoint to update items
    // For now, we'll just update the local state as an example
    const newData = [...trainingData];
    newData[index] = { question: editQuestion, answer: editAnswer };
    setTrainingData(newData);
    setEditingIndex(-1);
    toast.success('Đã cập nhật mục huấn luyện');
  };

  const filteredData = trainingData.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!adminKey) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h2><FaRobot /> Quản lý Chat AI</h2>
        </div>
        
        <div className="admin-auth-form">
          <h3>Đăng nhập Admin</h3>
          <form onSubmit={handleSubmitAdminKey}>
            <div className="form-group">
              <label>Admin Key:</label>
              <input 
                type="password" 
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Nhập khóa admin"
              />
            </div>
            <button type="submit" className="btn-primary">Đăng nhập</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2><FaRobot /> Quản lý Chat AI</h2>
        <button 
          className="btn-logout" 
          onClick={() => {
            localStorage.removeItem('admin_key');
            setAdminKey('');
          }}
        >
          Đăng xuất
        </button>
      </div>
      
      <div className="admin-content">
        <div className="admin-section">
          <h3>Thêm dữ liệu huấn luyện mới</h3>
          <form onSubmit={handleAddTrainingData} className="training-form">
            <div className="form-group">
              <label>Câu hỏi:</label>
              <textarea 
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Nhập câu hỏi của người dùng"
                rows="3"
              ></textarea>
            </div>
            <div className="form-group">
              <label>Câu trả lời:</label>
              <textarea 
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Nhập câu trả lời cho chat AI"
                rows="4"
              ></textarea>
            </div>
            <button type="submit" className="btn-primary">
              <FaPlus /> Thêm dữ liệu
            </button>
          </form>
        </div>
        
        <div className="admin-section">
          <h3>Dữ liệu huấn luyện hiện tại</h3>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Tìm kiếm dữ liệu huấn luyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : (
            <div className="training-data-list">
              {filteredData.length === 0 ? (
                <p className="no-data">Không có dữ liệu huấn luyện</p>
              ) : (
                filteredData.map((item, index) => (
                  <div key={index} className="training-item">
                    {editingIndex === index ? (
                      <>
                        <div className="training-edit">
                          <div className="form-group">
                            <label>Câu hỏi:</label>
                            <textarea
                              value={editQuestion}
                              onChange={(e) => setEditQuestion(e.target.value)}
                              rows="3"
                            ></textarea>
                          </div>
                          <div className="form-group">
                            <label>Câu trả lời:</label>
                            <textarea
                              value={editAnswer}
                              onChange={(e) => setEditAnswer(e.target.value)}
                              rows="4"
                            ></textarea>
                          </div>
                          <div className="edit-actions">
                            <button 
                              onClick={() => saveEdit(index)}
                              className="btn-save"
                            >
                              <FaSave /> Lưu
                            </button>
                            <button 
                              onClick={cancelEditing}
                              className="btn-cancel"
                            >
                              <FaTimes /> Hủy
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="training-content">
                          <div className="training-question">
                            <strong>Q:</strong> {item.question}
                          </div>
                          <div className="training-answer">
                            <strong>A:</strong> {item.answer}
                          </div>
                        </div>
                        <div className="training-actions">
                          <button 
                            onClick={() => startEditing(index)}
                            className="btn-edit"
                            title="Sửa"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(index)}
                            className="btn-delete"
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatTraining;