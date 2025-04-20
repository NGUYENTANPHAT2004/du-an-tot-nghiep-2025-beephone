/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
import "./GioHangLayout.scss";
import { useState, useEffect } from "react";
import { ModalNhapThongTin } from "./ModalNhapThongTin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCircleExclamation,
  faCheckCircle,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useUserContext } from "../../context/Usercontext";
import { useFlashSale } from "../../context/Flashecontext";
import axios from "axios";
function GioHangLayout() {
  const { user } = useUserContext();
  const [cart, setCart] = useState([]);
  const [sex, setsex] = useState("Anh");
  const [name, setname] = useState("");
  const [phone, setphone] = useState("");
  const [nguoinhan, setnguoinhan] = useState("");
  const [giaotannoi, setgiaotannoi] = useState(true);
  const [address, setAddress] = useState("");
  const [ghichu, setghichu] = useState("");
  const [magiamgia, setmagiamgia] = useState("");
  const [isOpenModaltt, setisOpenModaltt] = useState(false);
  const [sanphams, setsanphams] = useState([]);
  const [voucherValidation, setVoucherValidation] = useState(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  // Validation states
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [nguoinhanerror, setnguoinhanerror] = useState("");
  // Validation functions
  // Name validation status
  const [nameValid, setNameValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [addressValid, setAddressValid] = useState(false);
  const [nguoinhanvalid, setnguoinhanvalid] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [weight, setWeight] = useState(1000);
  const [selectedWard, setSelectedWard] = useState("");
  const [wardError, setWardError] = useState("");
  const [districtError, setDistrictError] = useState("");
  const [provinceError, setProvinceError] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const { checkProductInFlashSale } = useFlashSale();
  const validateName = (value) => {
    setname(value);
    if (!value.trim()) {
      setNameError("Vui lòng nhập họ tên");
      setNameValid(false);
      return false;
    } else if (value.trim().length < 2) {
      setNameError("Họ tên phải có ít nhất 2 ký tự");
      setNameValid(false);
      return false;
    } else if (
      !/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(
        value
      )
    ) {
      setNameError("Họ tên chỉ được chứa chữ cái và khoảng trắng");
      setNameValid(false);
      return false;
    } else {
      setNameError("");
      setNameValid(true);
      return true;
    }
  };
  const validateVoucher = async (code) => {
    if (!code || code.trim() === "") {
      setVoucherValidation(null);
      return;
    }

    setValidatingVoucher(true);
    try {
      // Sử dụng giỏ hàng hiện tại để xác thực
      const response = await fetch(
        "http://localhost:3005/pre-validate-voucher",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            magiamgia: code,
            orderTotal: totalPrice,
            userId: user?._id || null,
            phone: user?.phone || null,
            cartItems: cart.map((item) => ({
              productId: item.idsanpham,
              quantity: item.soluong,
              price: item.pricemausac,
            })),
          }),
        }
      );

      const result = await response.json();
      setVoucherValidation(result);
    } catch (error) {
      console.error("Lỗi khi xác thực voucher:", error);
      setVoucherValidation({
        valid: false,
        message: "Lỗi khi kiểm tra mã giảm giá",
      });
    } finally {
      setValidatingVoucher(false);
    }
  };
  const validatenguoinhan = (value) => {
    setnguoinhan(value);
    if (!value.trim()) {
      setnguoinhanerror("Vui lòng nhập họ tên");
      setnguoinhanvalid(false);
      return false;
    } else if (value.trim().length < 2) {
      setnguoinhanerror("Họ tên phải có ít nhất 2 ký tự");
      setnguoinhanvalid(false);
      return false;
    } else if (
      !/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(
        value
      )
    ) {
      setnguoinhanerror("Họ tên chỉ được chứa chữ cái và khoảng trắng");
      setnguoinhanvalid(false);
      return false;
    } else {
      setnguoinhanerror("");
      setnguoinhanvalid(true);
      return true;
    }
  };
  const validatePhone = (value) => {
    setphone(value);
    // Vietnamese phone number regex pattern
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;

    if (!value.trim()) {
      setPhoneError("Vui lòng nhập số điện thoại");
      setPhoneValid(false);
      return false;
    } else if (!phoneRegex.test(value)) {
      setPhoneError("Số điện thoại không hợp lệ");
      setPhoneValid(false);
      return false;
    } else {
      setPhoneError("");
      setPhoneValid(true);
      return true;
    }
  };
  const validateProvince = () => {
    if (!selectedProvince) {
      setProvinceError("Vui lòng chọn Tỉnh / Thành phố");
      return false;
    }
    setProvinceError("");
    return true;
  };

  const validateDistrict = () => {
    if (!selectedDistrict) {
      setDistrictError("Vui lòng chọn Quận / Huyện");
      return false;
    }
    setDistrictError("");
    return true;
  };

  const validateWard = () => {
    if (!selectedWard) {
      setWardError("Vui lòng chọn Xã / Phường");
      return false;
    }
    setWardError("");
    return true;
  };

  const validateAddress = (value) => {
    setAddress(value);
    if (!value.trim()) {
      setAddressError("Vui lòng nhập địa chỉ");
      setAddressValid(false);
      return false;
    } else if (value.trim().length < 5) {
      setAddressError("Địa chỉ phải có ít nhất 5 ký tự");
      setAddressValid(false);
      return false;
    } else {
      setAddressError("");
      setAddressValid(true);
      return true;
    }
  };

  // Fetch provinces only once when component mounts
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const headers = {
          Token: process.env.REACT_APP_GHN_API_KEY,
        };

        const resProvinces = await axios.get(
          "https://online-gateway.ghn.vn/shiip/public-api/master-data/province",
          { headers }
        );
        setProvinces(resProvinces.data.data);
      } catch (err) {
        console.error("Lỗi lấy danh sách tỉnh:", err);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        return;
      }

      try {
        const headers = {
          Token: process.env.REACT_APP_GHN_API_KEY,
        };

        const resDistricts = await axios.post(
          "https://online-gateway.ghn.vn/shiip/public-api/master-data/district",
          { province_id: Number(selectedProvince) },
          { headers }
        );
        setDistricts(resDistricts.data.data);
        setSelectedDistrict(""); // reset district when province changes
        setWards([]); // reset wards when province changes
      } catch (err) {
        console.error("Lỗi lấy danh sách quận/huyện:", err);
      }
    };

    fetchDistricts();
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedDistrict) {
        setWards([]);
        return;
      }

      try {
        const headers = {
          Token: process.env.REACT_APP_GHN_API_KEY,
        };

        const resWards = await axios.post(
          "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward",
          { district_id: Number(selectedDistrict) },
          { headers }
        );
        setWards(resWards.data.data);
        setSelectedWard(""); // reset ward when district changes
      } catch (err) {
        console.error("Lỗi lấy danh sách xã/phường:", err);
      }
    };

    fetchWards();
  }, [selectedDistrict]);

  // Gộp quá trình khởi tạo cart và gọi API thành 1 useEffect
  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem("cart")) || [];
    if (cartData.length > 0) {
      callAPIsForEachObject(cartData);
    } else {
      setCart([]);
    }
  }, []);

  const callAPIsForEachObject = async (cartData) => {
    try {
      const updatedData = await Promise.all(
        cartData.map(async (item) => {
          try {
            const response = await fetch(
              `http://localhost:3005/getchitietsp-variants/${item.idsanpham}`
            );

            if (!response.ok) {
              throw new Error(`Lỗi khi gọi API với ${item.idsanpham}`);
            }

            const productDetails = await response.json();
            console.log("Dữ liệu sản phẩm:", productDetails.name);

            // Mảng chứa tất cả màu sắc
            let allMausac = [];

            // Thu thập tất cả màu sắc từ tất cả dung lượng
            if (productDetails.dungluongs) {
              productDetails.dungluongs.forEach((dl) => {
                if (dl.mausac && dl.mausac.length > 0) {
                  dl.mausac.forEach((ms) => {
                    allMausac.push({
                      ...ms,
                      dungluongId: dl._id,
                      dungluongName: dl.name,
                    });
                  });
                }
              });
            }

            // Tìm dung lượng và màu sắc hiện tại
            let selectedDungluong = null;
            let selectedMausac = null;
            let selectedDungluongId = item.iddungluong;

            // Nếu không có iddungluong, thử tìm từ idmausac
            if (!selectedDungluongId && item.idmausac) {
              const matchingColor = allMausac.find(
                (ms) => ms._id === item.idmausac
              );
              if (matchingColor) {
                selectedDungluongId = matchingColor.dungluongId;
                console.log(
                  `Đã tìm thấy dungluongId: ${selectedDungluongId} từ màu sắc`
                );
              }
            }

            // Nếu vẫn không có, sử dụng dung lượng đầu tiên
            if (
              !selectedDungluongId &&
              productDetails.dungluongs &&
              productDetails.dungluongs.length > 0
            ) {
              selectedDungluongId = productDetails.dungluongs[0]._id;
              console.log(
                `Sử dụng dungluongId mặc định: ${selectedDungluongId}`
              );
            }

            // Tìm dung lượng đã chọn
            if (selectedDungluongId && productDetails.dungluongs) {
              selectedDungluong = productDetails.dungluongs.find(
                (dl) => dl._id === selectedDungluongId
              );
            }

            // Tìm màu sắc đã chọn
            if (selectedDungluong && item.idmausac) {
              selectedMausac = selectedDungluong.mausac?.find(
                (ms) => ms._id === item.idmausac
              );
            }

            // Nếu không tìm thấy màu sắc, sử dụng màu đầu tiên của dung lượng
            if (
              selectedDungluong &&
              !selectedMausac &&
              selectedDungluong.mausac?.length > 0
            ) {
              selectedMausac = selectedDungluong.mausac[0];
              console.log(`Sử dụng màu mặc định: ${selectedMausac.name}`);
            }

            // Trả về item đã cập nhật
            return {
              ...item,
              soluong: item.soluong || 1,
              mangmausac: allMausac,
              iddungluong: selectedDungluongId,
              dungluong: selectedDungluong
                ? selectedDungluong.name
                : item.dungluong || "Mặc định",
              mausac: selectedMausac
                ? selectedMausac.name
                : item.mausac || "Mặc định",
              idmausac: selectedMausac ? selectedMausac._id : item.idmausac,
              pricemausac: item.isFlashSale
                ? item.pricemausac
                : selectedMausac
                ? selectedMausac.price
                : item.pricemausac || 0,
            };
          } catch (error) {
            console.error("Lỗi khi gọi API:", error);
            return item; // Giữ nguyên item nếu có lỗi
          }
        })
      );

      setCart(updatedData);
      localStorage.setItem("cart", JSON.stringify(updatedData));
    } catch (error) {
      console.error("Lỗi khi xử lý giỏ hàng:", error);
    }
  };

  // Khi user nhấn nút tăng số lượng:
  const increaseQuantity = async (index) => {
    const newCart = [...cart];
    const product = newCart[index];

    if (product.isFlashSale) {
      // Kiểm tra tồn kho Flash Sale
      try {
        const flashSaleResponse = await fetch(
          `http://localhost:3005/flash-sale-products/${product.idsanpham}?dungluongId=${product.iddungluong}&mausacId=${product.idmausac}`
        );
        const flashSaleData = await flashSaleResponse.json();

        if (flashSaleData.success && flashSaleData.data) {
          const remainingQuantity = flashSaleData.data.remainingQuantity;

          if (remainingQuantity > product.soluong) {
            newCart[index].soluong += 1;
            setCart(newCart);
            localStorage.setItem("cart", JSON.stringify(newCart));
          } else {
            alert("Số lượng Flash Sale không đủ");
          }
        } else {
          alert("Sản phẩm này không còn trong chương trình Flash Sale");
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra tồn kho Flash Sale:", error);
        alert("Không thể kiểm tra tồn kho Flash Sale");
      }
    } else {
      // Kiểm tra tồn kho thông thường
      try {
        const response = await fetch(
          `http://localhost:3005/stock/${product.idsanpham}/${product.iddungluong}/${product.idmausac}`
        );
        const data = await response.json();

        if (
          data.stock === "Không giới hạn" ||
          data.unlimitedStock ||
          data.stock > product.soluong
        ) {
          newCart[index].soluong += 1;
          setCart(newCart);
          localStorage.setItem("cart", JSON.stringify(newCart));
        } else {
          alert("Không đủ hàng");
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra tồn kho:", error);
        alert("Không thể kiểm tra tồn kho");
      }
    }
  };

  const decreaseQuantity = (index) => {
    const newCart = [...cart];
    if (newCart[index].soluong > 1) {
      newCart[index].soluong -= 1;
    } else {
      newCart.splice(index, 1);
    }
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.pricemausac * item.soluong,
    0
  );

  const finalTotalPrice = totalPrice + shippingFee;

  const changeColor = async (
    index,
    selectedColor,
    newPrice,
    colorId,
    dungluongId,
    dungluongName
  ) => {
    const newCart = [...cart];
    const currentItem = newCart[index];

    // Cập nhật màu sắc, giá và các ID liên quan
    currentItem.mausac = selectedColor;
    currentItem.pricemausac = newPrice;
    currentItem.idmausac = colorId;
    currentItem.iddungluong = dungluongId;
    currentItem.dungluong = dungluongName;

    // Kiểm tra Flash Sale cho biến thể sản phẩm mới
    if (currentItem.idsanpham && dungluongId && colorId) {
      try {
        const result = await checkProductInFlashSale(
          currentItem.idsanpham,
          dungluongId,
          colorId
        );

        if (result.inFlashSale) {
          // Cập nhật thông tin Flash Sale
          currentItem.pricemausac = result.flashSaleInfo.salePrice;
          currentItem.isFlashSale = true;
          currentItem.flashSaleId = result.flashSaleInfo.flashSaleId;
        } else {
          // Đặt lại giá thông thường nếu không có Flash Sale
          currentItem.isFlashSale = false;
          currentItem.flashSaleId = null;
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra Flash Sale cho màu mới:", error);
      }
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  useEffect(() => {
    const formattedSanphams = cart.map((item) => ({
      idsp: item.idsanpham,
      soluong: item.soluong,
      price: item.pricemausac,
      dungluong: item.iddungluong,
      mausac: item.mausac,
      idmausac: item.idmausac,
    }));
    setsanphams(formattedSanphams);
  }, [cart]);

  const validateAllFields = () => {
    const isNameValid = validateName(name);
    const isPhoneValid = validatePhone(phone);
    const isReceiverValid = validatenguoinhan(nguoinhan);
    const isProvinceValid = validateProvince();
    const isDistrictValid = validateDistrict();
    const isWardValid = validateWard();

    // Create address from selected province, district, and ward
    if (isProvinceValid && isDistrictValid && isWardValid) {
      const selectedProvinceName =
        provinces.find((p) => p.ProvinceID === Number(selectedProvince))
          ?.ProvinceName || "";
      const selectedDistrictName =
        districts.find((d) => d.DistrictID === Number(selectedDistrict))
          ?.DistrictName || "";
      const selectedWardName =
        wards.find((w) => w.WardCode === selectedWard)?.WardName || "";

      const addressParts = [
        selectedWardName,
        selectedDistrictName,
        selectedProvinceName,
      ].filter(Boolean);
      setAddress(addressParts.join(", "));
    }

    return (
      isNameValid &&
      isPhoneValid &&
      isReceiverValid &&
      isProvinceValid &&
      isDistrictValid &&
      isWardValid
    );
  };

  const handelOpenModalTT = () => {
    if (validateAllFields()) {
      setisOpenModaltt(true);
    }
  };

  // Calculate shipping fee when ward is selected
  // Fixed shipping fee calculation with proper numeric types
  useEffect(() => {
    const calculateShippingFee = async () => {
      // Skip calculation if address is incomplete
      if (!selectedWard || !selectedDistrict || !selectedProvince) {
        setShippingFee(0);
        return;
      }

      setIsCalculatingShipping(true);
      try {
        // Set up headers with numeric ShopId
        const headers = {
          Token: process.env.REACT_APP_GHN_API_KEY, // Replace with your actual GHN token
          ShopId: 5724662, // Make sure this is a NUMBER, not a string
          "Content-Type": "application/json",
        };

        // Calculate total weight (minimum 1kg)
        const totalWeight = Math.max(
          cart.reduce((sum, item) => sum + item.soluong * 500, 0),
          1000
        );

        const fromDistrictID = 1482;
        const shopID = 5724662;

        // Get selected province and district names for logging
        const provinceName =
          provinces.find((p) => p.ProvinceID === Number(selectedProvince))
            ?.ProvinceName || "";
        const districtName =
          districts.find((d) => d.DistrictID === Number(selectedDistrict))
            ?.DistrictName || "";
        const wardName =
          wards.find((w) => w.WardCode === selectedWard)?.WardName || "";

        console.log(
          `Calculating shipping from Cầu Giấy (${fromDistrictID}) to: ${wardName}, ${districtName}, ${provinceName}`
        );
        console.log(
          `Using: ShopID=${shopID}, Weight=${totalWeight}g, Value=${totalPrice}đ`
        );

        // Step 1: Get available services with numeric shopID
        console.log("Requesting available services...");
        const serviceRes = await axios.post(
          "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services",
          {
            shop_id: shopID, // This needs to be a NUMBER
            from_district: fromDistrictID,
            to_district: Number(selectedDistrict),
          },
          { headers }
        );

        console.log("Available services response:", serviceRes.data);

        // Handle no available services
        if (!serviceRes.data?.data || serviceRes.data.data.length === 0) {
          console.warn("No delivery services available for this route");
          setShippingFee(30000); // Fallback fee
          setIsCalculatingShipping(false);
          return;
        }

        // Get the first available service
        const service = serviceRes.data.data[0];
        const service_id = service.service_id;
        console.log(
          `Selected service: ${service.short_name} (ID: ${service_id})`
        );

        // Step 2: Calculate shipping fee with detailed data, all numeric IDs
        console.log("Requesting shipping fee calculation...");
        const feeRequestData = {
          service_id: service_id,
          to_district_id: Number(selectedDistrict),
          to_ward_code: selectedWard,
          from_district_id: fromDistrictID,
          weight: totalWeight,
          length: 20,
          width: 15,
          height: 10,
          insurance_value: Math.min(totalPrice, 10000000), // Max 10M VND for insurance
          shop_id: shopID, // Make sure this is a NUMBER
        };

        console.log("Fee calculation request data:", feeRequestData);

        const feeRes = await axios.post(
          "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee",
          feeRequestData,
          { headers }
        );

        console.log("Fee calculation response:", feeRes.data);

        if (feeRes.data.code === 200) {
          setShippingFee(feeRes.data.data.total);
          console.log(`Shipping fee set to: ${feeRes.data.data.total}đ`);
        } else {
          console.warn(
            "GHN fee calculation returned non-200 code:",
            feeRes.data
          );

          // Use a dynamic fallback based on distance and weight
          const provinceFactor = provinces.findIndex(
            (p) => p.ProvinceID === Number(selectedProvince)
          );
          const baseFee = 15000; // Base fee for shipping
          const distanceFactor = Math.min(provinceFactor, 10) * 1500; // Up to 15,000đ extra for distance
          const weightFactor = Math.floor(totalWeight / 1000) * 5000; // 5,000đ per kg

          const estimatedFee = baseFee + distanceFactor + weightFactor;
          setShippingFee(estimatedFee);
          console.log(`Using estimated shipping fee: ${estimatedFee}đ`);
        }
      } catch (err) {
        console.error("Shipping fee calculation error:", err);
        if (err.response?.data) {
          console.error("Error details:", err.response.data);
        }

        // Fallback to a reasonable shipping fee
        setShippingFee(30000);
        console.log("Using fallback shipping fee: 30,000đ");
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    // Only calculate if we have complete address and items in cart
    if (
      cart.length > 0 &&
      selectedProvince &&
      selectedDistrict &&
      selectedWard
    ) {
      calculateShippingFee();
    } else {
      setShippingFee(0);
    }
  }, [
    selectedWard,
    selectedDistrict,
    selectedProvince,
    cart,
    totalPrice,
    provinces,
    districts,
    wards,
  ]);

  return (
    <div className="giohang_container">
      {cart.length > 0 ? (
        <>
          <div className="giohang_header_container">
            {cart.map((item, index) => (
              <div className="giohang_header" key={index}>
                <div className="giohang_header_top">
                  <div className="giohang_header_top_left">
                    <img
                      src={item.imgsanpham}
                      alt=""
                      width={100}
                      height={110}
                    />
                  </div>
                  <div className="giohang_header_top_right">
                    <div className="giohang_header_top_right_top">
                      <span>{item.namesanpham}</span>
                      <div className="mausac_container">
                        {item.mangmausac &&
                          item.mangmausac.map((mausac, row) => {
                            // Thêm debug để kiểm tra giá trị
                            console.log(`Màu sắc ${row}:`, mausac);

                            return (
                              <div
                                className={
                                  item.mausac === mausac.name
                                    ? `border_mausac border_mausac1`
                                    : `border_mausac`
                                }
                                key={row}
                                onClick={() => {
                                  // Debug trước khi gọi
                                  console.log("Đang chọn màu:", mausac);
                                  console.log(
                                    "dungluongId:",
                                    mausac.dungluongId || "không có"
                                  );

                                  changeColor(
                                    index,
                                    mausac.name,
                                    mausac.price,
                                    mausac._id,
                                    mausac.dungluongId,
                                    mausac.dungluongName
                                  );
                                }}
                              >
                                <div
                                  style={{
                                    backgroundColor: mausac.name.startsWith("#")
                                      ? mausac.name
                                      : "",
                                    position: "relative",
                                  }}
                                >
                                  {!mausac.name.startsWith("#") && (
                                    <span
                                      style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        fontSize: "10px",
                                      }}
                                    >
                                      {mausac.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    <div className="giohang_header_top_right_bottom">
                      <span>
                        {(item.pricemausac * item.soluong).toLocaleString()}đ
                      </span>
                      <div className="quantity">
                        <div
                          className="quantity_minus"
                          onClick={() => decreaseQuantity(index)}
                        >
                          -
                        </div>
                        <div className="quantity_number">{item.soluong}</div>
                        <div
                          className="quantity_plus"
                          onClick={() => increaseQuantity(index)}
                        >
                          +
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="giohang_header_bottom">
              <div className="giohang_header_bottom_left">
                <span>
                  <strong>Tạm tính </strong>({cart.length} sản phẩm)
                </span>
              </div>
              <div className="giohang_header_bottom_right">
                <span>{totalPrice.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
          <div className="giohang_content_container">
            <span>Thông tin khách hàng</span>
            <div className="giohang_thongtin_sex">
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={sex === "Anh"}
                  onClick={() => setsex("Anh")}
                />
                <label htmlFor="">Anh</label>
              </div>
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={sex === "Chị"}
                  onClick={() => setsex("Chị")}
                />
                <label htmlFor="">Chị</label>
              </div>
            </div>
            <div
              className={`giohang_thongtin_input ${
                nameValid ? "valid-input" : ""
              }`}
            >
              <div className={`div_thongtin_input ${nameError ? "error" : ""}`}>
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="người đặt"
                  value={name}
                  onChange={(e) => validateName(e.target.value)}
                  onBlur={(e) => validateName(e.target.value)}
                />
                {nameValid && (
                  <span className="valid-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
              </div>
            </div>
            {nameError && (
              <div className="error_message">
                <FontAwesomeIcon icon={faCircleExclamation} /> {nameError}
              </div>
            )}
            <div
              className={`giohang_thongtin_input ${
                nguoinhanvalid ? "valid-input" : ""
              }`}
            >
              <div
                className={`div_thongtin_input ${
                  nguoinhanerror ? "error" : ""
                }`}
              >
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="người nhận"
                  value={nguoinhan}
                  onChange={(e) => validatenguoinhan(e.target.value)}
                  onBlur={(e) => validatenguoinhan(e.target.value)}
                />
                {nguoinhanvalid && (
                  <span className="valid-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
              </div>
            </div>
            {nguoinhanerror && (
              <div className="error_message">
                <FontAwesomeIcon icon={faCircleExclamation} /> {nguoinhanerror}
              </div>
            )}
            <div
              className={`giohang_thongtin_input ${
                phoneValid ? "valid-input" : ""
              }`}
            >
              <div
                className={`div_thongtin_input ${phoneError ? "error" : ""}`}
              >
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => validatePhone(e.target.value)}
                  onBlur={(e) => validatePhone(e.target.value)}
                />
                {phoneValid && (
                  <span className="valid-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                )}
              </div>
            </div>
            {phoneError && (
              <div className="error_message">
                <FontAwesomeIcon icon={faCircleExclamation} /> {phoneError}
              </div>
            )}
          </div>
          <div className="giohang_content_container">
            <span>Hình thức nhận hàng</span>
            <div className="giohang_thongtin_sex">
              <div className="giohang_thongtin_sex_item">
                <input
                  type="radio"
                  checked={giaotannoi}
                  onClick={() => setgiaotannoi(true)}
                />
                <label htmlFor="">Giao tận nơi</label>
              </div>
            </div>

            <div className="address-selection-container">
              <div className="address-field">
                <label>Tỉnh/Thành phố</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className={provinceError ? "error" : ""}
                >
                  <option value="">-- Chọn tỉnh --</option>
                  {provinces.map((p) => (
                    <option key={p.ProvinceID} value={p.ProvinceID}>
                      {p.ProvinceName}
                    </option>
                  ))}
                </select>
                {provinceError && (
                  <div className="error_message">
                    <FontAwesomeIcon icon={faCircleExclamation} />{" "}
                    {provinceError}
                  </div>
                )}
              </div>

              <div className="address-field">
                <label>Quận/Huyện</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className={districtError ? "error" : ""}
                  disabled={!selectedProvince}
                >
                  <option value="">-- Chọn quận --</option>
                  {districts.map((d) => (
                    <option key={d.DistrictID} value={d.DistrictID}>
                      {d.DistrictName}
                    </option>
                  ))}
                </select>
                {districtError && (
                  <div className="error_message">
                    <FontAwesomeIcon icon={faCircleExclamation} />{" "}
                    {districtError}
                  </div>
                )}
              </div>

              <div className="address-field">
                <label>Xã/Phường</label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className={wardError ? "error" : ""}
                  disabled={!selectedDistrict}
                >
                  <option value="">-- Chọn xã/phường --</option>
                  {wards.map((w) => (
                    <option key={w.WardCode} value={w.WardCode}>
                      {w.WardName}
                    </option>
                  ))}
                </select>
                {wardError && (
                  <div className="error_message">
                    <FontAwesomeIcon icon={faCircleExclamation} /> {wardError}
                  </div>
                )}
              </div>
            </div>

            <div className="giohang_thongtin_input">
              <div className="div_thongtin_input">
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Ghi chú địa chỉ (nếu có)"
                  value={ghichu}
                  onChange={(e) => setghichu(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="giohang_content_container">
            <span>Sử dụng mã giảm giá</span>
            <div className="giohang_thongtin_input">
              <div
                className={`div_thongtin_input ${
                  voucherValidation?.valid === false ? "error" : ""
                }`}
              >
                <input
                  type="text"
                  className="input_giohang"
                  placeholder="Mã giảm giá"
                  value={magiamgia}
                  onChange={(e) => setmagiamgia(e.target.value)}
                  onBlur={() => validateVoucher(magiamgia)}
                />

                {validatingVoucher && (
                  <div className="validating-voucher">
                    <FontAwesomeIcon icon={faSpinner} spin />
                  </div>
                )}

                {voucherValidation?.valid && (
                  <div className="valid-voucher-icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </div>
                )}
              </div>
            </div>

            {voucherValidation && (
              <div
                className={`voucher-validation-message ${
                  voucherValidation.valid ? "valid" : "invalid"
                }`}
              >
                <FontAwesomeIcon
                  icon={
                    voucherValidation.valid
                      ? faCheckCircle
                      : faExclamationTriangle
                  }
                />
                <span>{voucherValidation.message}</span>

                {voucherValidation.valid && (
                  <div className="discount-preview">
                    Giảm: {voucherValidation.discountAmount?.toLocaleString()}đ
                  </div>
                )}

                {/* Hiển thị thông tin bổ sung cho voucher điểm thưởng */}
                {voucherValidation.isLoyaltyRedeemed &&
                  !voucherValidation.valid && (
                    <div className="loyalty-refund-info">
                      Điểm thưởng đã dùng để đổi voucher này sẽ được hoàn lại tự
                      động.
                    </div>
                  )}
              </div>
            )}

            <div className="giohang_thongtin_tongtien">
              <div className="div_thongtin_tongtien">
                <span>Tạm tính:</span>
              </div>
              <div className="div_thongtin_tongtien">
                <span className="thongtin_tongtien">
                  {totalPrice.toLocaleString()}đ
                </span>
              </div>
            </div>

            <div className="shipping-fee-section">
              <div className="shipping-fee-title">Phí vận chuyển:</div>
              <div className="shipping-fee-amount">
                {isCalculatingShipping ? (
                  <span>Đang tính...</span>
                ) : shippingFee > 0 ? (
                  <span>{shippingFee.toLocaleString()}đ</span>
                ) : (
                  <span>Vui lòng chọn địa chỉ giao hàng</span>
                )}
              </div>
            </div>

            <div className="giohang_thongtin_tongtien">
              <div className="div_thongtin_tongtien">
                <span>Tổng tiền:</span>
              </div>
              <div className="div_thongtin_tongtien">
                <span className="thongtin_tongtien">
                  {finalTotalPrice.toLocaleString()}đ
                </span>
              </div>
            </div>
          </div>
          <div className="giohang_content_container">
            <button className="btndathang" onClick={handelOpenModalTT}>
              Tiến hành đặt hàng
            </button>
            <div className="div_text_hinhthuc">
              Bạn có thể lựa chọn các hình thức thanh toán ở bước sau
            </div>
          </div>
          <ModalNhapThongTin
            isOpen={isOpenModaltt}
            onClose={() => setisOpenModaltt(false)}
            amount={finalTotalPrice}
            name={name}
            nguoinhan={nguoinhan}
            phone={phone}
            sex={sex}
            giaotannoi={giaotannoi}
            address={address}
            ghichu={ghichu}
            magiamgia={magiamgia}
            sanphams={sanphams}
            userId={user?._id || null}
          />
        </>
      ) : (
        <div className="giohang_no">
          <div className="giohang_no_icon">
            <FontAwesomeIcon icon={faCartShopping} />
          </div>
          <div className="div_giohang_no_text">
            <span className="giohang_no_text">Giỏ hàng của bạn chưa có</span>
            <span className="giohang_no_text">sản phẩm nào!</span>
          </div>
          <div>
            <p className="p_hotro">
              Hỗ trợ: <a href="tel:1900.6626">1900.6626 </a> (08h00 - 22h00)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GioHangLayout;
