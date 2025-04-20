import { Modal } from "../../../components/Modal";
import "./ModalNhapThongTin.scss";
import { useState, useEffect } from "react";

function ModalNhapThongTin({
  isOpen,
  onClose,
  amount,
  sanphams,
  name,
  nguoinhan,
  phone,
  sex,
  giaotannoi,
  address,
  ghichu,
  magiamgia,
  userId,
}) {
  const [bankCode, setBankCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [isStockChecked, setIsStockChecked] = useState(false);

  // ✅ Kiểm tra tồn kho khi modal mở
  useEffect(() => {
    if (isOpen && sanphams && sanphams.length > 0) {
      checkStockAvailability();
    }
  }, [isOpen, sanphams]);
  console.log(sanphams);
  const checkStockAvailability = async () => {
    setLoading(true);
    setStockError(null);
    setIsStockChecked(false);

    try {
      const missingStockItems = [];

      for (const item of sanphams) {
        // Kiểm tra thông tin sản phẩm cơ bản
        if (!item.idsp) {
          console.warn("Thiếu thông tin sản phẩm:", item);
          missingStockItems.push({
            productId: item.idsp || "unknown",
            dungluongId: item.dungluong || "unknown",
            mausacId: item.idmausac || "unknown",
          });
          continue;
        }

        try {
          // Kiểm tra xem sản phẩm có phải là Flash Sale không
          if (item.isFlashSale) {
            // Kiểm tra tồn kho Flash Sale
            const flashSaleUrl = `http://localhost:3005/flash-sale-products/${item.idsp}`;
            const flashSaleParams = new URLSearchParams();
            if (item.dungluong)
              flashSaleParams.append("dungluongId", item.dungluong);
            if (item.idmausac)
              flashSaleParams.append("mausacId", item.idmausac);

            const flashSaleResponse = await fetch(
              `${flashSaleUrl}?${flashSaleParams.toString()}`
            );

            if (!flashSaleResponse.ok) {
              const errorText = await flashSaleResponse.text();
              console.warn(
                `Lỗi kiểm tra Flash Sale (${flashSaleResponse.status}): ${errorText}`
              );
              setStockError({
                productId: item.idsp,
                message:
                  "Sản phẩm Flash Sale không còn hiệu lực hoặc không tồn tại.",
              });
              setIsStockChecked(true);
              setLoading(false);
              return;
            }

            const flashSaleInfo = await flashSaleResponse.json();

            if (!flashSaleInfo.success || !flashSaleInfo.data) {
              setStockError({
                productId: item.idsp,
                message: "Sản phẩm Flash Sale không tồn tại hoặc đã kết thúc.",
              });
              setIsStockChecked(true);
              setLoading(false);
              return;
            }

            const remainingQuantity = flashSaleInfo.data.remainingQuantity;

            if (remainingQuantity < item.soluong) {
              setStockError({
                productId: item.idsp,
                available: remainingQuantity,
                requested: item.soluong,
                message: `Sản phẩm Flash Sale không đủ số lượng. Hiện chỉ còn ${remainingQuantity} sản phẩm.`,
              });
              setIsStockChecked(true);
              setLoading(false);
              return;
            }
          } else {
            // Kiểm tra tồn kho thông thường
            const stockUrl = `http://localhost:3005/stock/${item.idsp}/${
              item.dungluong || "null"
            }/${item.idmausac || "null"}`;
            const response = await fetch(stockUrl);

            if (!response.ok) {
              const errorText = await response.text();
              console.warn(
                `Lỗi kiểm tra tồn kho (${response.status}): ${errorText}`
              );
              continue;
            }

            const stockInfo = await response.json();

            if (
              !stockInfo.unlimitedStock &&
              stockInfo.stock !== "Không giới hạn" &&
              stockInfo.stock < item.soluong
            ) {
              setStockError({
                productId: item.idsp,
                available: stockInfo.stock,
                requested: item.soluong,
                message: `Sản phẩm không đủ số lượng trong kho. Hiện chỉ còn ${stockInfo.stock} sản phẩm.`,
              });
              setIsStockChecked(true);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error(`Lỗi xử lý sản phẩm ${item.idsp}:`, error);
          missingStockItems.push(item);
        }
      }

      // Nếu có sản phẩm bị thiếu thông tin
      if (missingStockItems.length > 0) {
        console.warn("Các sản phẩm thiếu thông tin:", missingStockItems);
        // Nhưng không dừng quá trình - cho phép thanh toán tiếp
      }

      setIsStockChecked(true);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi kiểm tra tồn kho:", error);
      setStockError({
        message: "Không thể kiểm tra tồn kho. Vui lòng thử lại sau.",
      });
      setIsStockChecked(true);
      setLoading(false);
    }
  };

  // Cập nhật hàm handlethanhtoan trong ModalNhapThongTin.js
  const handlethanhtoan = async () => {
    if (!isStockChecked) {
      await checkStockAvailability();
      if (stockError) return;
    }

    if (stockError) {
      alert(stockError.message);
      return;
    }

    // Kiểm tra xem voucher có phải từ điểm thưởng không
    let isLoyaltyVoucher = false;
    let loyaltyVoucherInfo = null;

    if (magiamgia) {
      try {
        const voucherResponse = await fetch(
          `http://localhost:3005/check-loyalty-voucher/${magiamgia}`
        );
        const voucherData = await voucherResponse.json();
        isLoyaltyVoucher = voucherData.isLoyaltyVoucher;
        loyaltyVoucherInfo = voucherData.redemptionInfo;

        // Hiển thị thông báo nếu là voucher điểm thưởng
        if (isLoyaltyVoucher) {
          console.log(
            `Đang sử dụng voucher từ đổi điểm, đã dùng ${
              loyaltyVoucherInfo?.pointsSpent || "?"
            } điểm`
          );
        }
      } catch (error) {
        console.error("Lỗi kiểm tra voucher điểm thưởng:", error);
      }
    }

    // Chuẩn bị dữ liệu thanh toán
    const validSanphams = sanphams.map((item) => {
      if (!item.idmausac) {
        console.warn("Thiếu idmausac cho sản phẩm:", item);
      }
      return {
        ...item,
        idsp: item.idsp,
        soluong: item.soluong || 1,
        price: item.price || 0,
        dungluong: item.dungluong,
        mausac: item.mausac || "",
        idmausac: item.idmausac,
      };
    });

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3005/create_payment_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nguoinhan,
          phone,
          sex,
          giaotannoi,
          address,
          ghichu,
          magiamgia,
          bankCode,
          amount,
          sanphams: validSanphams,
          language: "vn",
          userId: userId || null,
          // Thêm cờ để chỉ ra đây là voucher điểm thưởng
          isLoyaltyVoucher,
          loyaltyVoucherInfo,
        }),
      });

      const data = await response.json();

      if (data.message) {
        alert(data.message);

        // Nếu có lỗi và đây là voucher điểm thưởng, thông báo sẽ hoàn điểm
        if (isLoyaltyVoucher && data.loyaltyRefundInitiated) {
          alert(
            "Điểm thưởng đã dùng để đổi voucher này sẽ được hoàn lại trong vài phút."
          );
        }
      } else {
        window.location.href = data;
      }
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      alert("Đã xảy ra lỗi khi thanh toán. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bodythanhtoan">
        {stockError && (
          <div className="stock-error">
            <p>{stockError.message}</p>
          </div>
        )}

        <div className="bankcode-select">
          <label>Mã ngân hàng</label>
          <div className="manganhang">
            <input
              type="radio"
              id="vnpay"
              name="bankCode"
              value=""
              checked={bankCode === ""}
              onChange={(e) => setBankCode(e.target.value)}
            />
            <label htmlFor="vnpay">Cổng thanh toán VNPAYQR</label>
          </div>
          <div className="manganhang">
            <input
              type="radio"
              id="vnbank"
              name="bankCode"
              value="VNBANK"
              checked={bankCode === "VNBANK"}
              onChange={(e) => setBankCode(e.target.value)}
            />
            <label htmlFor="vnbank">
              Thanh toán qua ATM - ngân hàng nội địa
            </label>
          </div>
          <div className="manganhang">
            <input
              type="radio"
              id="intcard"
              name="bankCode"
              value="INTCARD"
              checked={bankCode === "INTCARD"}
              onChange={(e) => setBankCode(e.target.value)}
            />
            <label htmlFor="intcard">Thanh toán qua thẻ quốc tế</label>
          </div>
        </div>

        <button
          className={`btndathang ${stockError || loading ? "disabled" : ""}`}
          onClick={handlethanhtoan}
          disabled={stockError || loading}
        >
          {loading ? "Đang xử lý..." : "Thanh toán"}
        </button>
      </div>
    </Modal>
  );
}

export default ModalNhapThongTin;
