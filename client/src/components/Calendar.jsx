import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { server } from "../constant";

import { MdOutlineCancel } from "react-icons/md";
import {
  Calendar as AntCalendar,
  Badge,
  Button,
  Select,
  InputNumber,
  Table,
  Tooltip,
  Popover,
  Input,
  message
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import useTokenValidation from "./UseTockenValidation";

const { Option } = Select;

const Calendar = () => {
 useTokenValidation();
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [userRole, setUserRole] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const navigate = useNavigate();
  const [activeCardId, setActiveCardId] = useState(null);
  const [logHoursVisible, setLogHoursVisible] = useState(false);
  const [loggedHours, setLoggedHours] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchUserRoleAndOrganization = async () => {
      try {
        const response = await axios.get(`${server}/api/role`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUserRole(response.data.role);
        setOrganizationId(response.data.organizationId);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRoleAndOrganization();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!organizationId) return;

      try {
        const response = await axios.get(
          `${server}/api/calendar/${organizationId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setEvents(response.data);
        // console.log("projectid", response.data)
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [organizationId]);

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf("month").day();

  const datesArray = [...Array(daysInMonth)].map((_, index) =>
    currentMonth.date(index + 1).format("YYYY-MM-DD")
  );

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  const handleDateClick = (date) => {
    const eventsForSelectedDate = events.filter(
      (event) => dayjs(event.date).format("YYYY-MM-DD") === date
    );
    if (eventsForSelectedDate.length > 0) {
      navigate(`/calendar/${organizationId}/${date}`, { state: { events: eventsForSelectedDate } });
    }
  };
  

  const handleChangeMonth = (value) => {
    setCurrentMonth(currentMonth.month(value));
  };

  const handleChangeYear = (value) => {
    setCurrentMonth(currentMonth.year(value));
  };

  const generateDots = (eventsForDay) => {
    const statusCounts = {
      completed: 0,
      pending: 0,
      inprogress: 0,
    };

    eventsForDay.forEach((event) => {
      if (statusCounts.hasOwnProperty(event.status)) {
        statusCounts[event.status]++;
      }
    });

    return (
      <>
        {statusCounts.completed > 0 && (
          <Tooltip title={`${statusCounts.completed} completed card(s)`}>
            <span
              className="inline-block w-2 h-2 rounded-full mr-1 bg-green-500"
            ></span>
          </Tooltip>
        )}
        {statusCounts.inprogress > 0 && (
          <Tooltip title={`${statusCounts.inprogress} in-progress card(s)`}>
            <span
              className="inline-block w-2 h-2 rounded-full mr-1 bg-yellow-500"
            ></span>
          </Tooltip>
        )}
        {statusCounts.pending > 0 && (
          <Tooltip title={`${statusCounts.pending} pending card(s)`}>
            <span
              className="inline-block w-2 h-2 rounded-full mr-1 bg-orange-500"
            ></span>
          </Tooltip>
        )}
      </>
    );
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${server}/api/user`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.data.success) {
          setUserEmail(response.data.user.email);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        message.error("Failed to fetch user data");
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="p-4 text-md">
      <h2 className="text-2xl font-semibold mb-4 text-blue-600">Calendar</h2>
      <div className="fixed bottom-12 right-12 flex flex-row space-x-2 pr-[30%] pt-6 pb-24 justify-center">
        <div className="flex justify items-center space-x-2 ">
          <div className="w-2 h-2 bg-orange-500 rounded-full "></div>
          <span className="text-black">Pending</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-black">In Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-black">Completed</span>
        </div>
      </div>

      <div className="flex justify-right mb-4 items-right">
        <Button
          icon={<LeftOutlined />}
          onClick={handlePrevMonth}
          className="mr-2"
        />
        <Select
          className="mx-2"
          value={currentMonth.month()}
          onChange={handleChangeMonth}
          style={{ width: 120 }}
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <Option key={index} value={index}>
              {dayjs().month(index).format("MMMM")}
            </Option>
          ))}
        </Select>
        <InputNumber
          min={2000}
          max={2100}
          value={currentMonth.year()}
          onChange={handleChangeYear}
          className="mx-2"
        />
        <Button
          icon={<RightOutlined />}
          onClick={handleNextMonth}
        />
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold text-blue-600">
            {day}
          </div>
        ))}
        {[...Array(firstDayOfMonth)].map((_, index) => (
          <div key={index}></div>
        ))}
        {datesArray.map((date) => {
          const formattedDate = dayjs(date).format("YYYY-MM-DD");
          const isToday = formattedDate === dayjs().format("YYYY-MM-DD");
          const eventsForDay = events.filter(
            (event) => dayjs(event.date).format("YYYY-MM-DD") === formattedDate
          );
          const hasEvents = eventsForDay.length > 0;


          return (
            <div
              key={formattedDate}
              className={`border p-2 rounded-lg ${isToday ? "bg-blue-100" : "bg-white"
                } shadow-md hover:bg-blue-200 cursor-pointer`}
              onClick={() => handleDateClick(formattedDate)}
              title={hasEvents ? "" : "No tasks on this date"}
            >
              <div
                className={`font-medium ${isToday ? "text-blue-600" : "text-gray-800"
                  }`}
              >
                {dayjs(date).format("D")}
              </div>
              <div className="flex mt-1">{generateDots(eventsForDay)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;












