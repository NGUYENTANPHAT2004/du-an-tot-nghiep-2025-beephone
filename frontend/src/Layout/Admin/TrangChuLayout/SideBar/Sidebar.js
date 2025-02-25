import {
  faBars,
  faBlog,
  faMobile,
  faPercent,
  faChartLine,
  faReceipt,
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./SideBar.scss";
import { useState } from "react";

function Sidebar({ activeTab }) {
  const [istoggle, setIstoggle] = useState(true);

  const menus = [
    { name: "Sản Phẩm", icon: faMobile },
    { name: "Blog", icon: faBlog },
    { name: "Mã Giảm Giá", icon: faPercent },
    { name: "Đánh Giá", icon: faComments },
    { name: "Hóa đơn", icon: faReceipt },
    { name: "Doanh Thu", icon: faChartLine },
  ];

  return (
    <div className={`sidebar_container ${istoggle ? "open" : "closed"}`}>
      <div className="sidebar_header">
        <div className={`sidebar_logo ${istoggle ? "show" : "hide"}`}>
          <h3>Logo</h3>
        </div>
        <div className="sidebar_toggle" onClick={() => setIstoggle(!istoggle)}>
          <FontAwesomeIcon icon={faBars} />
        </div>
      </div>

      <div className="sidebar_body">
        {menus.map((menu, index) => (
          <a href={`/admin?tab=${menu.name}`}>
            <div
              className={
                activeTab === menu.name
                  ? "sidebar_item sidebar_item_active"
                  : "sidebar_item"
              }
              key={index}
            >
              <FontAwesomeIcon icon={menu.icon} className="sidebar_icon" />
              <span className={`sidebar_text ${istoggle ? "show" : "hide"}`}>
                {menu.name}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
