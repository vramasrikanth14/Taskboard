//layout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";


const Layout = ({ children, user, onLogout }) => {


  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar user={user} onLogout={onLogout} />
        <div
          className="flex-1 h-[calc(100vh-80px)]"
          style={{
            backgroundSize: "cover",
            backgroundPosition: "center center",
            overflow: "auto",
            scrollbarWidth: "none"
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
