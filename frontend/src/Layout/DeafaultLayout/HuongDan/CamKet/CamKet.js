import React from "react";
import "./CamKet.scss";

const CamKet = () => {
    return (
        <div id="camket">
            <div className="camket-title">CAM KẾT VÀ QUY ĐỊNH CHUNG</div>
            <div className="camket-description">
                Các sản phẩm của cơ sở Shopdunk chúng tôi đều được điêu khắc công phu, tỉ mỉ đến từng chi tiết nhỏ nhằm nâng cao thương hiệu, uy tín và đảm bảo chất lượng khi đến tay khách hàng.
            </div>
            <img
                src="https://dogovinhdinh.vn/wp-content/uploads/2020/10/camket.png"
                alt="Logo"
                className="img-camket"
            />
            <div className="camket-subtitle">1. Cam kết về chính sách bán hàng:</div>
            <div className="camket-description">
                Với chính sách bán hàng luôn đặt chữ Tâm và Tín lên hàng đầu. Chúng tôi cam kết:
                <ul className="camket-list1">
                    <li>
                        Bán hàng đúng chất lượng, đúng như hình ảnh và kích thước trên website. Không bán hàng Giả, Hàng Nhái,
                        Hàng quốc cấm hay Lừa đảo chiếm đoạt tài sản của khách hàng.
                    </li>
                    <li>
                        Tư vấn cho khách hàng lựa chọn sản phẩm hiệu quả và phù hợp nhất cho mỗi nhu cầu của từng khách hàng.
                    </li>
                    <li>
                        Luôn giữ bí mật thông tin khách mua hàng, giao hàng nhanh chóng, an toàn và kín đáo
                        (Nếu như khách hàng yêu cầu).
                    </li>
                </ul>
            </div>
            
            <img
                src="https://dogovinhdinh.vn/wp-content/uploads/2020/10/quydinhchung.jpg"
                alt="Logo"
                className="img-camket"
            />
            <div className="camket-subtitle">2. Quy định chung cho người mua hàng:</div>
            <div className="camket-description">
                <p>Để đảm bảo giao dịch được thành công và đảm bảo quyền lợi và nghĩa vụ của cả bên Bán và bên Mua, đề nghị quý khách vui lòng tuân thủ theo các quy định sau đây:</p>

                <p>Quý khách hàng giao dịch mua bán tại website này phải đồng ý rằng:</p>
                <ul className="camket-list2">
                    <li>Quý khách là một cá nhân hoặc doanh nghiệp.</li>
                    <li>Có đầy đủ năng lực hành vi dân sự.</li>
                    <li>
                        Phải nghiêm túc và hoàn toàn chịu trách nhiệm khi thực hiện bất kỳ giao dịch mua bán tại trang web này đều phù hợp, tuân thủ theo quy định của pháp luật.
                    </li>
                    <li>
                        Các thông tin mà quý khách cung cấp cho Đồ gỗ Vĩnh Đính là thông tin chính xác, đầy đủ và đúng sự thật.
                    </li>
                    <li>
                        Xem hình ảnh và đọc kỹ các thông tin mô tả về sản phẩm cần mua. Nếu có điều gì không rõ, hãy liên lạc ngay với chúng tôi để được tư vấn.
                    </li>
                    <li>
                        Quý khách chỉ Đặt hàng khi đã thống nhất về Giá cả, hiểu được chính sách Thanh toán, Vận chuyển và Giao nhận và nhận thấy website của chúng tôi đáng để quý khách tin tưởng.
                    </li>
                    <li>
                        Không hủy đặt hàng sau khi chúng tôi đã liên hệ thông báo: Hàng đang được vận chuyển hàng tới cho quý khách.
                        (Lý do: Tất cả phí vận chuyển chúng tôi đều thanh toán. Quý khách hủy đặt hàng đồng nghĩa chúng tôi bị thiệt hại về chi phí vận chuyển đi và chuyển hoàn toàn. Đồng thời mất thời gian của chúng tôi. Điều này thể hiện đạo đức, tư cách của người mua hàng). Nếu trường hợp này xảy ra liên tục nhiều lần, thông tin địa chỉ và số điện thoại của quý khách sẽ được gửi đến cơ quan pháp luật, quý khách sẽ phải chịu trách nhiệm trước pháp luật về hành vi lừa đảo, quấy nhiễu người bán hàng.
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default CamKet;
