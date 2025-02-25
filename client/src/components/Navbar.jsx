import { useState, useEffect, useRef } from "react";
import { MdOutlineCancel } from "react-icons/md";
import { AiOutlinePlus } from "react-icons/ai";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Popover, Button, Input, message, Search, Modal } from "antd";
import { Bell, Eye, EyeOff } from "lucide-react";
import { server } from "../constant";


const Navbar = ({ user, onLogout, onSelectBackground }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(false);
  const [customImages, setCustomImages] = useState([]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [userName,setUserName] = useState();
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const notificationCount = notifications.filter(
    (notification) => !notification.readStatus
  ).length;
  const [organizationName, setOrganizationName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const { Search } = Input;
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const searchRef = useRef(null);
  //added
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    };

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      valid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
      valid = false;
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
      valid = false;
    }

    if (!confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your new password';
      valid = false;
    } else if (confirmNewPassword !== newPassword) {
      newErrors.confirmNewPassword = 'Password do not match with new password';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };


  //added
  // const handleModalClose = () => {
  //   // Reset all fields and visibility states when closing the modal
  //   setCurrentPassword('');
  //   setNewPassword('');
  //   setConfirmNewPassword('');
  //   setShowCurrentPassword(false);
  //   setShowNewPassword(false);
  //   setShowConfirmNewPassword(false);
  //   setShowPasswordModal(false);
  // };

  const handleModalClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setErrors({});  // Assuming errors is an object, reset it as well
    setShowPasswordModal(false);
  };




  // Handle password update
  const handlePasswordUpdate = async () => {

    if (validateForm()) {
      if (newPassword === currentPassword) {
        message.error("New password cannot be the same as the current password");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        message.error("New passwords do not match with the new Password");
        return;
      }

      try {
        const response = await axios.post(
          `${server}/api/users/${user._id}/update-password`,
          { currentPassword, newPassword },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        message.success('Password updated successfully');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } catch (error) {
        console.error('Error updating password:', error);
        if (error.response && error.response.data) {
          message.error(error.response.data.message);
        } else {
          message.error('Error updating password');
        }
      }
    }
  };



  const dropdownRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Close the dropdown if clicked outside
        setSearchResults([]);
      }
    };

    // Add the event listener for clicks outside
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Debounced function to avoid API calls on every keystroke
  const debouncedSearch = (query) => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      handleSearch(query);
    }, 100); // Adjust the debounce delay as needed
  };

  const handleSearch = async (trimmedSearchQuery) => {
    if (!trimmedSearchQuery) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(
        `${server}/api/organizations/${organizationId}/cards`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const filteredCards = response.data.cards.filter((card) =>
        card.uniqueId.toLowerCase().includes(trimmedSearchQuery.toLowerCase())
      );
      if (filteredCards.length === 0) {
        setErrorMessage("No matching card found");
        setTimeout(() => {
          setErrorMessage("");
        }, 1000); // Hide the error message after 1 second
      }

      setSearchResults(filteredCards);
    } catch (error) {
      console.error("Error searching cards:", error);
      message.error("An error occurred while searching for cards");
    }
  };

  const handleCardClick = (cardId, columnId) => {
    navigate(`/rename-card/${columnId}/cards/${cardId}`);
    setSearchResults([]);
    setSearchQuery("");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = user?._id;
        if (!userId) {
          console.error("User ID is not available");
          return;
        }

        const response = await axios.post(
          `${server}/api/notifications/unread`,
          { userId },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.notifications) {
          setNotifications(response.data.notifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [user, server]);

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
        setOrganizationName(response.data.organizationName);
        setUserName(response.data.username)
        console.log("username", response.data.username);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRoleAndOrganization();
  }, []);

  const handleNotificationClick = async (notificationId) => {
    try {
      await axios.patch(
        `${server}/api/notifications/${notificationId}`,
        { readStatus: true },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification._id !== notificationId
        )
      );
    } catch (error) {
      console.error("Error updating notification read status:", error);
    }
  };

  const formatDate = (date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${dayOfMonth}-${month}-${year}, ${day}`;
  };

  const confirmLogout = () => {
    onLogout();
    setShowLogoutConfirmation(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  const handleOpenSidebar = () => {
    setShowSidebar(true);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
  };
  const getFirstLetter = () => {
    return user?.email ? user.email.charAt(0).toUpperCase() : "";
  };

  const isProjectRoute = location.pathname.startsWith("/projects/");

  const profileContent = (
    <div className="w-60  ">
      <div className="px-4 py-2 text-sm text-gray-700">{user?.email}</div>
      <div className="border-t"></div>
      {showLogoutConfirmation ? (
        <div className="">
          <p className="text-sm justify-center items-center mb-2">
            Are you sure you want to logout?
          </p>
          <div className="flex justify-between space-x-2">
            <Button
              onClick={confirmLogout}
              className="bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
            >
              Yes
            </Button>
            <Button
              onClick={cancelLogout}
              className="bg-gray-500 text-white hover:bg-gray-600 transition-colors text-sm"
            >
              No
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Button
            onClick={() => setShowPasswordModal(true)}
            className="w-full text-left px-4 py-2 text-sm text-white bg-blue-400 mb-2"
          >
            Update Password
          </Button>
          <Button
            onClick={() => setShowLogoutConfirmation(true)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700"
          >
            Logout
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex items-center justify-between h-14 text-base p-4 sticky top-0 z-10 border-1 shadow-sm">
      <div className="flex items-center">
        <div className="ml-3">
          <h1 className="font-semibold text-2xl">HI! {userName}</h1>
          <h3 className="font-medium text-md">
            <span className="text-gray-500">{formatDate(currentTime)}</span>
          </h3>
        </div>
      </div>
      <div className="flex items-center flex-grow justify-center space-x-20">
        <div className="relative w-full max-w-xs">
          <Search
            placeholder="Search by task ID"

            value={searchQuery}
            onChange={(e) => {
              const trimmedSearchQuery = e.target.value.trim();
              // Filter out non-numeric characters
              const numericSearchQuery = trimmedSearchQuery.replace(
                /[^0-9]/g,
                ""
              );
              setSearchQuery(numericSearchQuery);
              debouncedSearch(numericSearchQuery);
            }}
            onSearch={() => handleSearch(searchQuery)}
            style={{ width: "100%", padding: "8px" }}
            className="mr-4"
            enterButton
          />
          {errorMessage && (
            <div className="absolute z-10 mt-2 w-full bg-white text-black text-center rounded-md shadow-lg border border-red-500">
              {errorMessage}
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto" ref={dropdownRef} style={{ scrollbarWidth: 'none' }}>
              {searchResults.map((card) => (
                <div
                  key={card.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCardClick(card.id, card.taskId)}
                >
                  <div className="text-gray-800 font-medium">
                    Task: {card.name}
                  </div>
                  <div className="text-gray-500 text-sm">
                    ID: {card.uniqueId}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* <Modal
            title="Update Password"
            visible={showPasswordModal}
            onCancel={handleModalClose}
            footer={null}
          >
            <div className="relative mb-4">
              <Input
                placeholder="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff /> : <Eye />}
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
              )}
            </div>

            <div className="relative mb-4">
              <Input
                placeholder="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff /> : <Eye />}
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div className="relative mb-4">
              <Input
                placeholder="Confirm New Password"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              >
                {showConfirmNewPassword ? <EyeOff /> : <Eye />}
              </div>
              {errors.confirmNewPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmNewPassword}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="primary"
                onClick={handlePasswordUpdate}
                className="bg-blue-500 text-white hover:bg-blue-600 transition-colors px-4 py-2 rounded"
              >
                Update
              </Button>
              <Button
                onClick={handleModalClose}
                className="bg-gray-500 text-white hover:bg-gray-600 transition-colors px-4 py-2 rounded"
              >
                Cancel
              </Button>
            </div>
          </Modal> */}

          <Modal
            title="Update Password"
            visible={showPasswordModal}
            onCancel={handleModalClose}
            footer={null}
          >
            <div className="relative mb-4">
              <Input
                placeholder="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff /> : <Eye />}
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
              )}
            </div>

            <div className="relative mb-4">
              <Input
                placeholder="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff /> : <Eye />}
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div className="relative mb-4">
              <Input
                placeholder="Confirm New Password"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              >
                {showConfirmNewPassword ? <EyeOff /> : <Eye />}
              </div>
              {errors.confirmNewPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmNewPassword}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="primary"
                onClick={handlePasswordUpdate}
                className="bg-blue-500 text-white hover:bg-blue-600 transition-colors px-4 py-2 rounded"
              >
                Update
              </Button>
              <Button
                onClick={handleModalClose}
                className="bg-gray-500 text-white hover:bg-gray-600 transition-colors px-4 py-2 rounded"
              >
                Cancel
              </Button>
            </div>
          </Modal>

        </div>
      </div>

      <h1 className="font-semibold text-1xl m-4">{organizationName}</h1>
      {isProjectRoute && (
        <div className="relative inline-block group">
          <button
            className="text-black text-xl hover:text-gray-800 hover:bg-gray-200 focus:outline-none p-1 rounded-full mr-4"
            onClick={handleOpenSidebar}
          >
            {/* <SquareChevronDown size={20} /> */}
          </button>
          <span className="invisible absolute right-full bg-gray-700 text-white text-sm rounded opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100">
            {/* Change background */}
          </span>
        </div>
      )}

      <Popover
        placement="bottomRight"
        title="Notifications"
        content={
          <div
            style={{ maxHeight: "350px", overflowY: "auto", width: "400px" }}
          >
            {notifications.length === 0 ? (
              <p className="text-gray-500">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="flex items-start mb-4 cursor-pointer hover:bg-gray-100 transition-colors border rounded-xl py-2 px-2"
                  onClick={() => handleNotificationClick(notification._id)}
                >
                  <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full mr-4 flex-shrink-0">
                    {notification.assignedByEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-gray-700">
                    <p>
                      <strong>{notification.assignedByEmail}</strong>{" "}
                      {notification.message}
                    </p>
                    {notification.createdAt && (
                      <div className="text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        }
        trigger="click"
      >
        <div className="relative hover:text-gray-800 hover:bg-gray-200 focus:outline-none p-1 rounded-full mr-4">
          <Bell size={20} className="cursor-pointer text-gray-700" />
          {notificationCount > 0 && (
            <span className="absolute top-0 left-4 bg-red-500 text-white text-xs font-semibold rounded-full w-4 mr-0 mb-6 h-4 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </div>
      </Popover>

      <Popover placement="bottomRight" content={profileContent} trigger="click">
        <div className="w-8 h-8 bg-[#8AAAE5] text-white flex items-center justify-center rounded-full font-semibold text-xl cursor-pointer">
          {getFirstLetter()}
        </div>
      </Popover>

      {showSidebar && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="bg-transparent w-80 p-4 rounded-tl-3xl shadow-lg relative overflow-y-auto"
            style={{ maxHeight: "100vh", backdropFilter: "blur(10px)" }}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded"
              onClick={handleCloseSidebar}
            >
              <MdOutlineCancel size={30} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Navbar;