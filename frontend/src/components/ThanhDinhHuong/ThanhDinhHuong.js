import React from "react";
import "./ThanhDinhHuong.scss"; 
function ThanhDinhHuong({ breadcrumbs}) {
  return (
    <div className="app-container1">
      <nav className="breadcrumbs">
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={index}>
            {breadcrumb.link ? (
              <a href={breadcrumb.link} className="breadcrumb-link">
                {breadcrumb.label}
              </a>
            ) : (
              <span className="breadcrumb-current">{breadcrumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <span className="breadcrumb-separator">&gt;</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}

export default ThanhDinhHuong;
