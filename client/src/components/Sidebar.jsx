import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  SquareKanban,
  PanelsTopLeft,
  CalendarDays,
  Users,
  FileText,
  ChevronsLeft,
  ChevronsRight,
  ShieldHalf,
  FileChartColumn,
  Clock
} from "lucide-react";
import task from "../assets/task.png";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getNavLinkClass = (path) => {
    return location.pathname === path
      ? "bg-gray-200 text-black font-bold w-full rounded-tl-3xl rounded-br-3xl"
      : "hover:font-semibold text-black";
  };

  const getIconClass = (path) => {
    return location.pathname === path
      ? "text-lg text-black"
      : "hover:font-semibold text-black";
  };

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div
      className={`h-full bg-white text-black flex flex-col shadow-md shadow-gray-400 relative transition-all duration-300 ${
        collapsed ? "w-8" : "w-[242px]"
      }`}
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center">
          {!collapsed && (
            <>
              <img src={task} alt="Logo" className="w-10 h-10 mr-3" />
              <h2 className="text-lg font-bold">TaskBoard</h2>
            </>
          )}
        </div>
        {/* <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-black"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight size={20} />
          ) : (
            <ChevronsLeft size={20} />
          )}
        </button> */}


        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-black absolute top-4 right-1"
          title="Collapse sidebar"
        >
          {collapsed ? (
            <ChevronsRight size={20} />
          ) : (
            <ChevronsLeft size={20}  />
          )}
        </button>
      </div>
      {!collapsed && (
      <ul className="flex-1 pt-8 p-4">
        {[
          { path: "/", icon: SquareKanban, label: "Overview" },
          { path: "/projects", icon: PanelsTopLeft, label: "Projects" },
          { path: "/calendar", icon: CalendarDays, label: "Calendar" },
          { path: "/members", icon: Users, label: "Members" },
          { path: "/Auditlog", icon: FileText, label: "Auditlog" },
          { path: "/Teamsorg", icon: ShieldHalf, label: "Teams" },
          { path: "/statussheet", icon: FileChartColumn, label: "StatusSheet" },
          { path: "/timesheet", icon: Clock, label: "Time Sheet" },
        ].map(({ path, icon: Icon, label }) => (
          <li
            key={path}
            className={`p-4 pl-12 flex items-center cursor-pointer text-base ${getNavLinkClass(path)}`}
            onClick={() => handleNavigation(path)}
          >
            <Icon className={`mr-3 ${getIconClass(path)}`} size={18} />
            {!collapsed && <span className="block">{label}</span>}
          </li>
        ))}
      </ul>
       )}
    </div>
  );
};

export default Sidebar;