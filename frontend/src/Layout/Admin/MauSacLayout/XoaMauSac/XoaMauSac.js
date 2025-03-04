import { Modal } from "../../../../components/Modal";
import { MdDeleteForever } from "react-icons/md";
import { MdCancelPresentation } from "react-icons/md";

function XoaMauSac({ isOpen, onClose, idmausac, fetchdata, setSelectedIds }) {
  const handleXoaMauSac = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/deletemausachangloat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: idmausac,
          }),
        }
      );
      if (response.ok) {
        onClose();
        setSelectedIds([]);
        fetchdata();
        alert("Xóa thành công!");
      }
    } catch (error) {
      console.error("lỗi xóa màu sắc:", error);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <p>Bạn có chắc muốn xóa màu sắc này?</p>
        <div className="divbtnxtl">
          <button onClick={handleXoaMauSac} className="btndelete">
            <MdDeleteForever />
            Xóa
          </button>
          <button onClick={onClose} className="btnhuy">
            <MdCancelPresentation />
            Hủy
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default XoaMauSac;
