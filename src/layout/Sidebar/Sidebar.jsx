import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiMenu } from "react-icons/hi";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { PiPhoneFill } from "react-icons/pi";
import { HiArchiveBox } from "react-icons/hi2";
import { HiUserGroup } from "react-icons/hi2";
import { AiFillHome } from "react-icons/ai";
import { IoMdSettings } from "react-icons/io";

import "./style.scss";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { icon: <IoChatbubbleEllipses className="icon" />, label: "Sohbetler", path: "/sohbetler" },
    { icon: <PiPhoneFill className="icon" />, label: "Aramalar", path: "/aramalar" },
    { icon: <HiArchiveBox className="icon" />, label: "Arşivler", path: "/arsivler" },
    { icon: <HiUserGroup className="icon" />, label: "Gruplar", path: "/gruplar" },
    { icon: <AiFillHome className="icon" />, label: "Anasayfa", path: "/anasayfa" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`sidebar-container ${isOpen ? "open" : ""}`}>
      <div className="top-box">
        <button
          className={`nav-buttons ${isOpen ? "open" : ""}`}
          id="menu-btn"
          onClick={toggleSidebar}
        >
          <HiMenu className="icon" />
        </button>

        <div className="navigation-buttons">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`nav-buttons ${isOpen ? "open" : ""}`}
              onClick={() => handleNavigation(item.path)}
            >
              {item.icon}
              {isOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="bottom-box" style={{ width: isOpen ? "100%" : "" }}>
        <button
          className={`nav-buttons ${isOpen ? "open" : ""}`}
          onClick={() => handleNavigation("/ayarlar")}
        >
          <IoMdSettings className="icon" />
          {isOpen && <span>Ayarlar</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
