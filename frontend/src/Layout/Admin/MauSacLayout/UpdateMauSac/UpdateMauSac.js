/* eslint-disable react-hooks/exhaustive-deps */
import { Modal } from "../../../../components/Modal";
import { useEffect, useState } from "react";

function UpdateMauSac({ isOpen, onClose, idmausac, fetchData }) {
  const [name, setname] = useState("");
  const [price, setprice] = useState(0);
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);

  const handelclose = () => {
    setname("");
    setprice("");
    setImages([]);
    setFiles([]);
    onClose();
  };

  const fetchchitiet = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/getchitietmausac/${idmausac}`
      );
      const data = await response.json();
      if (response.ok) {
        setname(data.name);
        setprice(data.price);
        setImages(data.image);
        setFiles(
          data.image.map((img) => ({
            preview: img,
            raw: img,
          }))
        );
      }
    } catch (error) {
      console.error(error);
    }
  };
  console.log(price);

  useEffect(() => {
    if (idmausac && isOpen) {
      fetchchitiet();
    }
  }, [idmausac, isOpen]);

  const handelUpdateMauSac = async () => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);

      files.forEach((file) => {
        formData.append("image", file);
      });

      const response = await fetch(
        `http://localhost:3005/putmausac/${idmausac}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        handelclose();
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handelclose}>
      <div>
        <h2>Cập nhật màu sắc</h2>
        <div className="div_input_group">
          <div className="input-group1">
            {images.length > 0 ? (
              images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt=""
                  style={{ width: 100, height: 100, marginRight: 10 }}
                />
              ))
            ) : (
              <h3>Ảnh</h3>
            )}
          </div>
          <div className="input-group">
            <label>Ảnh</label>
            <input
              type="file"
              multiple
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files);

                setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
                setImages((prevImages) => [
                  ...prevImages,
                  ...selectedFiles.map((file) => URL.createObjectURL(file)),
                ]);
              }}
            />
            <label>Mã màu sắc:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setname(e.target.value)}
              placeholder="Nhập mã màu sắc"
            />
            <label>Giá:</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setprice(e.target.value)}
              placeholder="Nhập đơn giá"
            />
          </div>
        </div>

        <div className="button-group">
          <button className="btnaddtl" onClick={handelUpdateMauSac}>
            Cập nhật
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default UpdateMauSac;
