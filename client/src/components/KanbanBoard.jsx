//kanban.jsx
import React, { useState, useRef, useEffect } from "react";
import Board, { moveCard, moveColumn } from "@lourenci/react-kanban";
import io from "socket.io-client";
import { Dropdown, Menu } from "antd"; //added
import { InfoCircleOutlined } from "@ant-design/icons";
import * as XLSX from 'xlsx';
import { DownloadOutlined } from '@ant-design/icons';
import { DownOutlined } from "@ant-design/icons"; //added
import moment from 'moment';
import {
  BsClockHistory,
  BsPencilSquare,
  BsThreeDotsVertical,
  BsTrash,
  BsX,
} from "react-icons/bs";
import { Tooltip } from "antd";
import "@lourenci/react-kanban/dist/styles.css";
import { useParams } from "react-router-dom";
import { server } from "../constant";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../components/Style.css";
import useTokenValidation from "./UseTockenValidation";
import { RxActivityLog } from "react-icons/rx";
import { notification } from "antd";
import { MdOutlineContentCopy } from "react-icons/md";
import RulesButton from "./RulePage";
import { FaPlus } from "react-icons/fa";
import { FcEmptyTrash } from "react-icons/fc";
import { MdCancel } from "react-icons/md";
import { Popover, Button, Space, Modal, Form, Input, Select, DatePicker } from "antd";
import { MoreOutlined, SettingOutlined, ToolOutlined } from "@ant-design/icons";
import { SquareMenu } from "lucide-react";
import { Plus } from "lucide-react";
import { X } from "lucide-react";
import { BsFillPencilFill } from "react-icons/bs";
import BackgroundChange from "./BackgroundChange";
import { Bell, SquareChevronDown } from "lucide-react";
import { Drawer, Typography, Progress, List, Avatar, Tabs } from "antd";
import { CloseOutlined, CommentOutlined } from "@ant-design/icons";

import { FastAverageColor } from "fast-average-color";


const initialBoard = {
  columns: [],
};

function KanbanBoard() {
  useTokenValidation();

  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [boardData, setBoardData] = useState(initialBoard);
  const [socket, setSocket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const containerRef = useRef(null);
  const { projectId } = useParams();
  const [bgUrl, setBgUrl] = useState("");
  const [username, setUsername] = useState(""); // For displaying the username
  const { RangePicker } = DatePicker;
  const [renameColumnError, setRenameColumnError] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [newColumnModalVisible, setNewColumnModalVisible] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [showRenameConfirmation, setShowRenameConfirmation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [renameCardModalVisible, setRenameCardModalVisible] = useState(false);
  const [renameCardTitle, setRenameCardTitle] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [memberAdded, setMemberAdded] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [renameCardDescription, setRenameCardDescription] = useState("");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const suggestionListRef = useRef(null);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [textColor, setTextColor] = useState("black"); //added
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [team, setTeam] = useState("");
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState({});
  const [renameCardErrors, setRenameCardErrors] = useState({
    title: "",
    description: "",
  });
  const [addCardErrors, setAddCardErrors] = useState({
    title: "",
    description: "",
    email: "",
  });
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [emailError, setemailError] = useState("");
  const [startDateError, setstartDateError] = useState("");
  const [assignDate, setAssignDate] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repository, setRepository] = useState("");
  const newRepoRef = useRef(null);
  const existingRepoRef = useRef(null);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [copiedButton, setCopiedButton] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [tempColumnName, setTempColumnName] = useState("");

  const [newColumnError, setNewColumnError] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [userComment, setUserComment] = useState("");
  const [comments, setComments] = useState([]);
  const [assignedTo, setAssignedTo] = useState([]);
  const [createdBy, setcreatedBy] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [utilizedHours, setUtilizedHours] = useState(0);
  const [remainingHours, setRemainingHours] = useState(0);
  const [endDate, setEndDate] = useState("");
  const [endDateError, setEndDateerror] = useState("");
  const [estimatedHoursError, setestimatedHoursError] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionError, setdescriptionerror] = useState("");

  const { TextArea } = Input;
  const { Text, Title, Paragraph } = Typography;
  const [taskLogs, setTaskLogs] = useState([]);
  const { Option } = Select;
  const [selectedCard, setSelectedCard] = useState(null);
  const [exportDueDate, setExportDueDate] = useState(null); // Add this state
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  const [startDate, setStartDate] = useState("");

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };
  const showAboutModal = () => {
    setAboutModalVisible(true);
  };

  const handleAboutModalClose = () => {
    setAboutModalVisible(false);
  };

  const handleCardClick = (cardId, columnId, projectId) => {
    navigate(`/rename-card/${columnId}/cards/${cardId}`);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };
  const handleTeamsClick = () => {
    navigate(`/projects/${projectId}/teams`);
  };

  const [userRole, setUserRole] = useState("");

  const location = useLocation();
  //added
  const [showBackgroundChange, setShowBackgroundChange] = useState(false);

  //added for antd drawer
  const [visible, setVisible] = useState(false);

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const isProjectRoute = location.pathname.startsWith("/projects/");
  //added
  const handleBackgroundChangeClick = () => {
    setShowBackgroundChange(true);
  };


  const [exportStatus, setExportStatus] = useState(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDateRange, setExportDateRange] = useState(null);
  const [exportAssignedTo, setExportAssignedTo] = useState('');

  const handleExport = () => {
    setExportModalVisible(true);
  };

  const handleExportConfirm = () => {
    // Prepare the data for export
    let exportData = boardData.columns.flatMap(column =>
      column.cards.map(card => ({
        'Column Name': column.title,
        'Card ID': card.cardId,
        'Card Title': card.title,
        'Card Description': card.description,
        'Status': card.status,
        'Assigned To': card.assignedTo,
        'Assign Date': moment(card.assignDate).format('YYYY-MM-DD HH:mm'),
        'Due Date': moment(card.dueDate).format('YYYY-MM-DD HH:mm')
      }))
    );
  
    // Apply filters
    if (exportStatus) {
      exportData = exportData.filter(item => item.Status === exportStatus);
    }
  
    // Apply single date filter based on Due Date
    if (exportDueDate) {
      const selectedDueDate = exportDueDate.format('YYYY-MM-DD');
      exportData = exportData.filter(item => moment(item['Due Date']).isSame(selectedDueDate, 'day'));
    }
  
    if (username) {
      exportData = exportData.filter(item =>
        item['Assigned To'].toLowerCase() === username.toLowerCase()
      );
    }
  
    // Create a new workbook
    const wb = XLSX.utils.book_new();
  
    // Create a sheet for each column
    boardData.columns.forEach(column => {
      const columnData = exportData.filter(item => item['Column Name'] === column.title);
  
      // Create a worksheet with the header
      const wsData = columnData.length > 0 ? columnData : [{}]; // Ensure at least one row exists
      const ws = XLSX.utils.json_to_sheet(wsData);
  
      // Capitalize column headers and calculate widths
      const headers = Object.keys(wsData[0]);
      const colWidths = headers.map(header => {
        const headerLength = header.length; // Length of header
        const dataLength = Math.max(...wsData.map(item => item[header]?.toString().length || 0)); // Length of longest data
        return Math.max(headerLength, dataLength) + 2; // Add some padding
      });
  
      // Set the column widths
      ws['!cols'] = colWidths.map(width => ({ width }));
  
      // Append the worksheet to the workbook with the column title as the sheet name
      XLSX.utils.book_append_sheet(wb, ws, column.title);
    });
  
    // Save the file
    XLSX.writeFile(wb, `kanban_export_${username || exportStatus || 'all'}.xlsx`);
  
    // Reset state
    setExportModalVisible(false);
    setExportStatus(null);
    setExportDueDate(null);
    setUsername('');
  };
  
  
  
  



  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await axios.get(`${server}/api/role`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        setUserRole(response.data.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    const newSocket = io(`${server}`);
    setSocket(newSocket);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("connection", () => {
        console.log("connected");
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on("cardCreated", ({ taskId, card }) => {
        setBoardData((prevState) => ({
          ...prevState,
          columns: prevState.columns.map((column) =>
            column.id === taskId
              ? { ...column, cards: [...column.cards, card] }
              : column
          ),
        }));
      });

      socket.on("cardRenamed", ({ cardId, newTitle, newDescription }) => {
        setBoardData((prevState) => ({
          ...prevState,
          columns: prevState.columns.map((column) => ({
            ...column,
            cards: column.cards.map((card) =>
              card.id === cardId
                ? { ...card, title: newTitle, description: newDescription }
                : card
            ),
          })),
        }));
      });

      socket.on("taskAdded", ({ projectId: updatedProjectId, task }) => {
        if (updatedProjectId === projectId) {
          setBoardData((prevState) => ({
            ...prevState,
            columns: [
              ...prevState.columns,
              { id: task._id, title: task.name, cards: [] },
            ],
          }));
        }
      });

      socket.on(
        "taskRenamed",
        ({ projectId: updatedProjectId, taskId, newName }) => {
          if (updatedProjectId === projectId) {
            setBoardData((prevState) => ({
              ...prevState,
              columns: prevState.columns.map((column) =>
                column.id === taskId ? { ...column, title: newName } : column
              ),
            }));
          }
        }
      );

      socket.on("taskDeleted", ({ projectId: updatedProjectId, taskId }) => {
        if (updatedProjectId === projectId) {
          setBoardData((prevState) => ({
            ...prevState,
            columns: prevState.columns.filter((column) => column.id !== taskId),
          }));
        }
      });

      socket.on(
        "taskMoved",
        ({ projectId: updatedProjectId, taskId, newIndex }) => {
          if (updatedProjectId === projectId) {
            setBoardData((prevState) => {
              const updatedColumns = [...prevState.columns];
              const taskIndex = updatedColumns.findIndex(
                (column) => column.id === taskId
              );
              if (taskIndex !== -1) {
                const [movedTask] = updatedColumns.splice(taskIndex, 1);
                updatedColumns.splice(newIndex, 0, movedTask);
              }
              return { ...prevState, columns: updatedColumns };
            });
          }
        }
      );

      socket.on("cardDeleted", ({ taskId, cardId }) => {
        setBoardData((prevState) => ({
          ...prevState,
          columns: prevState.columns.map((column) =>
            column.id === taskId
              ? {
                ...column,
                cards: column.cards.filter((card) => card.id !== cardId),
              }
              : column
          ),
        }));
      });

      socket.on("cardMoved", ({ cardId, sourceTaskId, destinationTaskId }) => {
        console.log("Card moved event received:", {
          cardId,
          sourceTaskId,
          destinationTaskId,
        });
        setBoardData((prevState) => {
          if (!prevState || !prevState.columns) {
            console.error("Invalid board state:", prevState);
            return prevState;
          }

          const updatedColumns = prevState.columns.map((column) => {
            if (column.id === sourceTaskId) {
              return {
                ...column,
                cards: column.cards.filter((card) => card.id !== cardId),
              };
            }
            if (column.id === destinationTaskId) {
              const movedCard = prevState.columns
                .find((col) => col.id === sourceTaskId)
                ?.cards.find((card) => card.id === cardId);

              if (!movedCard) {
                console.error("Moved card not found:", {
                  cardId,
                  sourceTaskId,
                });
                return column;
              }

              return {
                ...column,
                cards: [...column.cards, movedCard],
              };
            }
            return column;
          });
          return { ...prevState, columns: updatedColumns };
        });
      });
    }
    return () => {
      if (socket) {
        socket.off("cardCreated");
        socket.off("taskAdded");
        socket.off("taskDeleted");
        socket.off("taskRenamed");
        socket.off("taskMoved");
        socket.off("cardMoved");
        socket.off("cardDeleted");
        socket.off("cardRenamed");
      }
    };
  }, [socket, projectId]);

  //
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await axios.get(`${server}/api/user`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUserEmail(response.data.user.email);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserEmail();
  }, []);

  //
  useEffect(() => {
    const fetchUserRoleAndOrganization = async () => {
      try {
        const response = await axios.get(`${server}/api/role`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser({ role: response.data.role, email: response.data.email });
        fetchProjects(response.data.organizationId);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRoleAndOrganization();
  }, []);

  const openGitModal = () => {
    setIsGitModalOpen(true);
  };
  const closeGitModal = () => {
    setIsGitModalOpen(false);
  };
  const copyToClipboard = (text, buttonId) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopiedButton(buttonId);
          setTimeout(() => setCopiedButton(null), 2000);
        },
        (err) => {
          console.error("Could not copy text: ", err);
        }
      );
    } else {
      let textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedButton(buttonId);
        setTimeout(() => setCopiedButton(null), 2000);
      } catch (err) {
        console.error("Fallback: Could not copy text: ", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const fetchProjects = async (organizationId) => {
    try {
      const response = await axios.get(
        `${server}/api/projects/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProjects(response.data.projects);
      const project = response.data.projects.find(
        (project) => project._id === projectId
      );
      if (project) {
        setProjectName(project.name);
        setProjectManager(project.projectManagerName);
        setRepoName(project.repoName); // Store repoName
        setRepository(project.repository); // Store repository
        setProjectDescription(project.description);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Function to get the user object from local storage
  const getUserFromLocalStorage = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  };

  // Inside your component
  const userFromLocalStorage = getUserFromLocalStorage();
  const emailFromLocalStorage = userFromLocalStorage
    ? userFromLocalStorage.email
    : null;

  const canShowActions =
    userFromLocalStorage &&
    (user.role === "ADMIN" ||
      emailFromLocalStorage ===
      projects.find((project) => project._id === projectId)?.projectManager);

  // Update fetchTasks function to include cards
  async function fetchTasks() {
    try {
      const response = await fetch(
        `${server}/api/projects/${projectId}/tasks`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const { tasks, bgUrl } = await response.json();

      const columns = await Promise.all(
        tasks.map(async (task) => {
          const cardsResponse = await fetch(
            `${server}/api/tasks/${task.id}/cards`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (!cardsResponse.ok) {
            throw new Error("Failed to fetch cards for task " + task.name);
          }

          const { cards } = await cardsResponse.json();

          return {
            id: task.id,
            title: task.name,
            cards: cards.map((card) => {
              const utilizedHours = card.utilizedHours || 0;
              const estimatedHours = card.estimatedHours || 0;
              const remainingHours = estimatedHours - utilizedHours;

              return {
                id: card.id,
                title: card.name || "",
                description: card.description || "",
                columnId: task.id,
                assignedTo: card.assignedTo,
                createdBy: card.createdBy,
                status: card.status,
                assignDate: card.assignDate,
                dueDate: card.dueDate,
                comments: card.comments || [],
                activities: card.activities || [],
                taskLogs: card.taskLogs || [],
                estimatedHours: estimatedHours,
                utilizedHours: utilizedHours,
                remainingHours: remainingHours,
                cardId: card.uniqueId,
              };
            }),
          };
        })
      );

      setBgUrl(bgUrl);
      console.log(bgUrl);
      setBoardData({ columns });

      if (bgUrl && bgUrl.raw) {
        const fac = new FastAverageColor();
        fac
          .getColorAsync(bgUrl.raw)
          .then((color) => {
            const isLight =
              color.value[0] * 0.299 +
              color.value[1] * 0.587 +
              color.value[2] * 0.114 >
              186;
            setTextColor(isLight ? "black" : "white");
          })
          .catch((error) => {
            console.error("Error extracting color:", error);
          });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  useEffect(() => {
    // console.log("Current bgUrl:", bgUrl);
  }, [bgUrl]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMemberAdded(false); // Reset the state
    setEmail("");
    setTeam("");
  };

  const openRenameCardModal = (
    columnId,
    cardId,
    currentTitle,
    currentDescription,
    currentComments,
    currentActivities,
    currentTaskLogs,
    estimatedHours, // New parameter
    utilizedHours, // New parameter
    assignedTo, // New parameter
    createdBy,
    dueDate
  ) => {
    console.log("openRenameCardModal called with:", cardId, currentComments);

    setSelectedColumnId(columnId);
    setSelectedCardId(cardId);
    setRenameCardTitle(currentTitle);
    setRenameCardDescription(currentDescription);
    setComments(currentComments || []); // Ensure comments are set correctly
    setRenameCardModalVisible(true);
    setActivities(currentActivities || []);
    setTaskLogs(currentTaskLogs || []);

    // Calculate remaining hours
    const remainingHours = estimatedHours - utilizedHours;

    // Set the actual hours to be displayed
    setEstimatedHours(estimatedHours);
    setUtilizedHours(utilizedHours);
    setRemainingHours(remainingHours);

    //added
    setAssignedTo(assignedTo);
    setcreatedBy(createdBy);
    setDueDate(dueDate);
  };

  const clearFieldsAndRefresh = async () => {
    // Clear input fields
    if (document.forms[0]) {
      document.forms[0].reset();
    }
    // Clear fields and close the modal after successful card addition
    setTitle("");
    setEmail(""); // Clear email
    setUsername(""); // Clear username
    setStartDate("");
    setEndDate("");
    setEstimatedHours("");
    setDescription("");
    setEmailSuggestions([]); // Clear suggestions

    // Clear fields and close the modal after successful card addition
    setTitle("");
    setEmail(""); // Clear email
    setUsername(""); // Clear username
    setStartDate("");
    setEndDate("");
    setEstimatedHours("");
    setDescription("");
    setEmailSuggestions([]); // Clear suggestions


    // Close the modal
    setModalVisible(false);

    // Refresh board data
    await fetchTasks();
  };

  // // Update handleAddCard function
  const handleAddCard = async (e) => {
    e.preventDefault();
    const cardTitle = e.target.title.value.trim() || "";
    const cardDescription = e.target.description.value.trim() || "";
    const assignDate = e.target.assignDate.value;
    const dueDate = e.target.dueDate.value;
    const estimatedHoursInput = e.target.estimatedHours.value.trim();
    const estimatedHours = parseFloat(estimatedHoursInput);


    if (
      !cardTitle ||
      !cardDescription ||
      !selectedColumnId ||
      !email ||
      !assignDate ||
      !dueDate ||
      estimatedHoursInput === "" ||
      estimatedHours <= 0
    ) {
      notification.warning({
        message:
          estimatedHours <= 0
            ? "Estimated hours must be greater than 0"
            : "Please fill in all fields",
      });
      return;
    }


    try {
      const createdBy = await fetchUserEmail();


      const searchResponse = await fetch(
        `${server}/api/projects/${projectId}/users/search?email=${email}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );


      if (!searchResponse.ok) {
        throw new Error("User is not part of the project");
      }


      const { users } = await searchResponse.json();
      if (users.length === 0) {
        notification.warning({
          message: "The entered email is not part of the project",
        });
        return;
      }


      const response = await fetch(
        `${server}/api/tasks/${selectedColumnId}/cards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: cardTitle,
            description: cardDescription,
            assignedTo: email,
            assignDate: assignDate,
            dueDate: dueDate,
            estimatedHours: estimatedHours,
            createdBy: createdBy,
          }),
        }
      );


      if (!response.ok) {
        throw new Error("Failed to add card");
      }

      // Clear fields and close the modal after successful card addition

      // Clear fields and close the modal after successful card addition
      setTitle("");
      setEmail(""); // Clear email
      setUsername(""); // Clear username
      setEmail(""); // Clear email
      setUsername(""); // Clear username
      setStartDate("");
      setEndDate("");
      setEstimatedHours("");
      setDescription("");
      setEmailSuggestions([]); // Clear suggestions

      e.target.reset(); // Reset the form

      setModalVisible(false); // Close the modal

      await fetchTasks(); // Fetch the updated tasks

      setEmailSuggestions([]); // Clear suggestions

      e.target.reset(); // Reset the form

      setModalVisible(false); // Close the modal

      await fetchTasks(); // Fetch the updated tasks

      notification.success({
        message: "Task added Successfully",
      });
    } catch (error) {
      console.error("Error adding card:", error);
      alert(error.message);
    }
  };



  const handleEmailChange = async (e) => {
    const emailInput = e.target.value;
    setEmail(emailInput);

    if (!emailInput) {
      setEmailSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `${server}/api/projects/${projectId}/users/search?email=${emailInput}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch email suggestions");
      }

      const { users } = await response.json();

      // Filter out duplicate emails
      const uniqueUsers = users.filter(
        (user, index, self) =>
          index === self.findIndex((t) => t.email === user.email)
      );

      setEmailSuggestions(uniqueUsers);
    } catch (error) {
      console.error("Error fetching email suggestions:", error);
      setEmailSuggestions([]);
    }
  };

  const handleUsernameChange = async (e) => {
    const usernameInput = e.target.value;
    setUsername(usernameInput);

    if (!usernameInput) {
      setUsernameSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `${server}/api/projects/${projectId}/users/search?username=${usernameInput}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch username suggestions");
      }

      const { users } = await response.json();

      // Filter out duplicate usernames
      const uniqueUsers = users.filter(
        (user, index, self) =>
          index === self.findIndex((t) => t.username === user.username)
      );

      setUsernameSuggestions(uniqueUsers);
    } catch (error) {
      console.error("Error fetching username suggestions:", error);
      setUsernameSuggestions([]);
    }
  };


  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }

    const updateContainerWidth = () => {
      if (containerRef.current) {
        const boardWidth = containerRef.current.scrollWidth;
        containerRef.current.style.width = `${boardWidth}px`;
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);

    return () => {
      window.removeEventListener("resize", updateContainerWidth);
    };
  }, [projectId]);

  useEffect(() => {
    if (!newColumnModalVisible || !modalVisible) {
      fetchTasks();
    }
  }, [newColumnModalVisible, modalVisible]);

  //Polling function
  const pollForUpdates = async () => {
    await fetchTasks();
  };

  // Set up polling
  useEffect(() => {
    const intervalId = setInterval(pollForUpdates, 5000);

  // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const handleCardMove = async (card, source, destination) => {
    // Optimistically update the UI
    // Optimistically update the UI
    const updatedBoard = moveCard(boardData, source, destination);
    setBoardData(updatedBoard);


    const movedBy = await fetchUserEmail();


    try {
      // Check if the card is being moved within the same column (reordering)
      // Check if the card is being moved within the same column (reordering)
      if (source.fromColumnId === destination.toColumnId) {
        const response = await axios.put(
          `${server}/api/tasks/${source.fromColumnId}/cards/${card.id}/reorder`,
          {
            oldIndex: source.fromPosition,
            newIndex: destination.toPosition,
            movedBy,
            movedDate: new Date().toISOString(),
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        );

        if (response.status !== 200) {
          throw new Error("Failed to reorder card");
        }
      } else {
        // Moving card to a different column
        const response = await axios.put(
          `${server}/api/cards/${card.id}/move`,
          {
            sourceTaskId: source.fromColumnId,
            destinationTaskId: destination.toColumnId,
            sourceIndex: source.fromPosition,
            destinationIndex: destination.toPosition,
            movedBy,
            movedDate: new Date().toISOString(),
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        );

        if (response.status !== 200) {
          throw new Error("Failed to move card");
        }
      }

      // Refetch the board data to ensure frontend and backend are in sync
      await fetchTasks();
    } catch (error) {
      console.error("Error moving/reordering card:", error);
      // Revert the frontend state if the backend update fails
      setBoardData(boardData);
    }
  };


  //coloumn rename automatic
  const handleColumnNameBlur = async (columnId) => {
    if (tempColumnName.trim() === "") {
      notification.error({
        message: "Column name cannot be empty",
      });
      setEditingColumnId(null);
      return;
    }

    setEditingColumnId(null);
    const column = boardData.columns.find((col) => col.id === columnId);
    if (column && tempColumnName !== column.title) {
      try {
        let updatedBy = await fetchUserEmail();
        const response = await fetch(
          `${server}/api/projects/${projectId}/tasks/${columnId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              name: tempColumnName,
              updatedBy: updatedBy,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to rename column");
        }

        setBoardData((prevState) => ({
          ...prevState,
          columns: prevState.columns.map((col) =>
            col.id === columnId ? { ...col, title: tempColumnName } : col
          ),
        }));

        // notification.success({
        //   message: 'Column Renamed Successfully',
        // });
      } catch (error) {
        console.error("Error renaming column:", error);
        notification.error({
          message: "Failed to rename column",
        });
      }
    } else {
      setTempColumnName("");
    }
  };

  const confirmRemoveCard = (columnId, cardId) => {
    setCardToDelete({ columnId, cardId });
    setShowDeleteConfirmation(true);
  };

  // Update handleRemoveCard function
  const handleRemoveCard = async () => {
    if (cardToDelete) {
      const { columnId, cardId } = cardToDelete;
      try {
        // Fetch the logged-in user's email
        const deletedBy = await fetchUserEmail();

        const response = await fetch(
          `${server}/api/tasks/${columnId}/cards/${cardId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ deletedBy: deletedBy }), // Include deletedBy
          }
        );

        if (!response.ok) {
          throw new Error("Failed to remove card");
        }

        setBoardData((prevState) => ({
          ...prevState,
          columns: prevState.columns.map((column) =>
            column.id === columnId
              ? {
                ...column,
                cards: column.cards.filter((card) => card.id !== cardId),
              }
              : column
          ),
        }));

        setShowDeleteConfirmation(false);
        setCardToDelete(null);

        // Show success message
        setShowSuccessMessage(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
        notification.success({
          message: "task deleted Successfully",
        });
      } catch (error) {
        console.error("Error removing card:", error);
      }
    }
  };

  const handleColumnMove = async (column, source, destination) => {
    const updatedBoard = moveColumn(boardData, source, destination);
    setBoardData(updatedBoard);

    let movedBy;
    try {
      movedBy = await fetchUserEmail();
    } catch (error) {
      console.error("Error fetching logged-in user's email:", error);
      // Revert the frontend state in case of error
      setBoardData(moveColumn(updatedBoard, destination, source));
      return;
    }

    const movedDate = new Date().toISOString();

    try {
      const response = await fetch(
        `${server}/api/projects/${projectId}/tasks/${column.id}/move`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            newIndex: destination.toPosition,
            movedBy,
            movedDate,
          }), // Include movedBy and movedDate
        }
      );

      if (!response.ok) throw new Error("Failed to move column");
    } catch (error) {
      console.error("Error moving column:", error);
      // Revert the frontend state in case of error
      setBoardData(moveColumn(updatedBoard, destination, source));
    }
  };

  const fetchUserEmail = async () => {
    try {
      const response = await axios.get(`${server}/api/user`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data.user.email; // Return the email
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error; // Propagate the error
    }
  };

  // // update add coloumn
  const handleAddColumn = () => {
    setNewColumnError(false);
    setNewColumnModalVisible(true);
  };

  const handleAddColumnSubmit = async () => {
    const trimmedColumnName = newColumnName.trim();
    if (!trimmedColumnName) {
      setNewColumnError(true);
      return;
    }

    setLoading(true);
    let createdBy;
    try {
      createdBy = await fetchUserEmail(); // Assume fetchUserEmail is a function that gets the user's email
    } catch (error) {
      console.error("Error fetching logged-in user's email:", error);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${server}/api/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: trimmedColumnName,
            createdBy: createdBy,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      const { task } = await response.json();
      setBoardData((prevState) => ({
        ...prevState,
        columns: [
          ...prevState.columns,
          { id: task._id, title: task.name, cards: [], createdBy: createdBy },
        ],
      }));
      notification.success({ message: "Column created successfully" });
      setNewColumnModalVisible(false);
      setNewColumnName("");
      setNewColumnError(false);
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setLoading(false);
    }
  };
  // Update the handleRenameColumn function
  const handleRenameColumn = async (newColumnName) => {
    if (selectedColumnId && newColumnName) {
      let updatedBy;
      try {
        updatedBy = await fetchUserEmail();
      } catch (error) {
        console.error("Error fetching logged-in user's email:", error);
        return;
      }

      try {
        const response = await fetch(
          `${server}/api/projects/${projectId}/tasks/${selectedColumnId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ name: newColumnName, updatedBy: updatedBy }), // Include updatedBy
          }
        );

        if (!response.ok) {
          throw new Error("Failed to rename column");
        }

        setBoardData((prevState) => ({
          ...prevState,
          columns: prevState.columns.map((column) =>
            column.id === selectedColumnId
              ? { ...column, title: newColumnName }
              : column
          ),
        }));
        notification.success({
          message: "Column Renamed Successfully",
        });
      } catch (error) {
        console.error("Error renaming column:", error);
      }
    }
    closeModal();
  };

  const handleRemoveColumn = async (columnId) => {
    let deletedBy;
    try {
      deletedBy = await fetchUserEmail();
    } catch (error) {
      console.error("Error fetching logged-in user's email:", error);
      return;
    }

    try {
      const response = await fetch(
        `${server}/api/projects/${projectId}/tasks/${columnId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ deletedBy }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove column");
      }

      setBoardData((prevState) => ({
        ...prevState,
        columns: prevState.columns.filter((column) => column.id !== columnId),
      }));

      setShowDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 3000);
      notification.success({
        message: "Column Deleted Successfully",
      });
    } catch (error) {
      console.error("Error removing column:", error);
      notification.error({
        message: "Failed to delete column",
        description: error.message,
      });
    }
  };
  const showRemoveColumnConfirmation = (columnId) => {
    Modal.confirm({
      title: "Are you sure you want to remove this column?",
      onOk() {
        handleRemoveColumn(columnId);
      },
    });
  };

  const openModal = (columnId, type) => {
    console.log(columnId);
    setSelectedColumnId(columnId);
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedColumnId(null);
    setModalType(null);
  };

  // useEffect(() => {
  //   async function fetchProjectDetails() {
  //     try {
  //       const response = await fetch(`${server}/api/projects/${projectId}`, {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //       });

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch project details");
  //       }

  //       const project = await response.json();
  //       setProjectName(project.name);
  //       console.log(project.projectManager);
  //       setProjectManager(project.projectManger);
  //     } catch (error) {
  //       console.error("Error fetching project details:", error);
  //     }
  //   }

  //   fetchProjectDetails();
  // }, [server, projectId]); // Dependencies for useEffect

  async function handleChangeStatus(cardId, newStatus) {
    try {
      // Fetch the user's email (updatedBy)
      const updatedBy = await fetchUserEmail();
      // Get the current date and time (updatedDate)
      const updatedDate = new Date().toISOString();

      // Make the PUT request to update the card status
      const response = await fetch(`${server}/api/cards/${cardId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus, updatedBy, updatedDate }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update the local state
      setBoardData((prevState) => {
        const updatedColumns = prevState.columns.map((column) => {
          const updatedCards = column.cards.map((card) => {
            if (card.id === cardId) {
              return { ...card, status: newStatus, updatedBy, updatedDate };
            }
            return card;
          });
          return { ...column, cards: updatedCards };
        });

        return { ...prevState, columns: updatedColumns };
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  //added
  const statusMenu = (cardId) => (
    <Menu
      onClick={(e) => handleChangeStatus(cardId, e.key)}
      items={[
        { key: "pending", label: "Pending" },
        { key: "inprogress", label: "Inprogress" },
        { key: "completed", label: "Completed" },
      ]}
    />
  );

  const renderCard = (card, { dragging }) => (
    <div
      className={`react-kanban-card ${dragging ? "dragging" : ""}`}
      style={{ borderRadius: "10px", maxWidth: "750px", overflow: "hidden" }}
      onClick={() => handleCardClick(card.id, card.columnId, projectId)}
    >
      <div className="p-4">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          key={card.id}
        >
          {/* <Tooltip title={card.title}> */}
          <div className="react-kanban-card__title truncate">
            {card.title && card.title.length > 20
              ? card.title.slice(0, 20) + "..."
              : card.title}
          </div>

          <div className="react-kanban-card__assignedTo flex items-center">
            {card.assignedTo && (
              <Tooltip title={card.assignedTo}>
                <div className="profile-picture w-6 h-6 rounded-full bg-blue-400 text-white flex justify-center items-center font-bold ml-2 relative">
                  <span className="cursor-pointer">
                    {card.assignedTo.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="react-kanban-card__dueDate">
          {card.dueDate && (
            <div className="text-sm text-gray-500">
              Due Date:{" "}
              {new Date(card.dueDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="react-kanban-card__status">
              <Select
                value={card.status}
                onChange={(value) => handleChangeStatus(card.id, value)}
                onClick={(e) => e.stopPropagation()} // Prevent modal from opening
                style={{ width: 110, height: 25 }} // Adjust width as needed
              >
                <Option value="pending">Pending</Option>
                <Option value="inprogress">In Progress</Option>
                <Option value="completed">Completed</Option>
              </Select>
            </div>
            <Tooltip title={`Card ID: ${card.cardId}`}>
              <div style={{ marginLeft: "10px", font: "small-caption" }}>
                <h1>ID:{card.cardId}</h1>
              </div>
            </Tooltip>
          </div>

          {canShowActions && (
            <button
              className="delete-card-button"
              onClick={(e) => {
                e.stopPropagation(); // Prevent click event from bubbling up
                confirmRemoveCard(card.columnId, card.id);
              }}
              style={{
                marginRight: "10px",
                color: "red",
                paddingTop: "5px",
                marginLeft: "30%",
                marginTop: "3%",
              }}
            >
              {/* <BsTrash /> */}
            </button>
          )}
          <button
            className="delete-card-button"
            onClick={(e) => {
              e.stopPropagation(); // Prevent click event from bubbling up
              openRenameCardModal(
                card.columnId,
                card.id,
                card.title,
                card.description,
                card.comments,
                card.activities,
                card.taskLogs
              );
            }}
            style={{ color: "black", marginTop: "4%" }}
          >
            {/* <BsFillPencilFill /> */}
          </button>
        </div>
      </div>
    </div>
  );

  const fetchTasks1 = async () => {
    try {
      const response = await axios.get(
        `${server}/api/projects/${projectId}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setTasks(response.data.tasks);
      console.log("tasks1 done");
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };
  useEffect(() => {
    fetchTasks1();
  }, [boardData]);

  return (
    <div
      className="  bg-light-multicolor h-[calc(100vh-57px)] rounded-xl "
      style={
        bgUrl
          ? {
            backgroundImage: `url(${bgUrl.raw})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: "100%",
          }
          : {}
      }
    >
      <div className="flex justify-between items-center  bg-gray-500 bg-opacity-20 pl-2 pb-2 ">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: textColor }}>
            Project : <span className="font-normal">{projectName}</span>
          </h1>
          <h1 className="text-xl font-semibold" style={{ color: textColor }}>
            Project Manager :{" "}
            <span className="font-normal">{projectManager}</span>
          </h1>
        </div>
        <div className="flex space-x-2 ">
          <Button
            type="primary"
            icon={<Plus />}
            onClick={handleAddColumn}
            style={{ borderRadius: "8px" }}
          >
            New Column
          </Button>

          <>
            <Button
              type="text"
              icon={<SquareMenu style={{ color: textColor }} />}
              onClick={showDrawer}
            />

            <Drawer
              title="Settings"
              placement="right"
              onClose={onClose}
              visible={visible}
              width={300} // Adjust width as needed
            >
              {showBackgroundChange && (
                <BackgroundChange
                  onClose={() => setShowBackgroundChange(false)} // Close BackgroundChange without closing Drawer
                  onImageSelect={onClose} // Close the Drawer when an image is selected
                />
              )}
              <Space direction="vertical" style={{ width: "100%" }}>
                <button
                  type="button" // Changed to 'button' for semantic correctness
                  className="flex flex-row items-left justify-left gap-2 p-2 rounded-md border-color-black-400 hover:bg-gray-200"
                  onClick={() => {
                    openGitModal();
                    onClose(); // Close the Drawer after opening Git Modal
                  }}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    paddingRight: "25px",
                  }}
                >
                  <SettingOutlined
                    style={{
                      fontSize: 20,
                      display: "flex",
                      justifyItems: "left",
                    }}
                  />
                  Git Configuration
                </button>
                {isProjectRoute && (
                  <button
                    type="button"
                    className="flex flex-row items-left justify-left gap-2 p-2 rounded-md border-color-black-400 hover:bg-gray-200"
                    onClick={() => setShowBackgroundChange(true)} // Only show BackgroundChange
                    style={{
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <SquareChevronDown style={{ fontSize: 20 }} />
                    Change Background
                  </button>
                )}

                <RulesButton
                  tasks={tasks}
                  className="flex flex-row justify-center items-center gap-2 p-2 rounded-md border-color-black-400 hover:bg-gray-200"
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                  }}
                />
                <button
                  type="button"
                  className="flex flex-row justify-left items-center gap-2 p-2 rounded-md border-color-black-400 hover:bg-gray-200"
                  onClick={showAboutModal}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    fontSize: 15,
                  }}
                >
                  <InfoCircleOutlined style={{ fontSize: 20 }} />
                  About
                </button>

                <button
                  type="button"
                  className="flex flex-row justify-left items-center gap-2 p-2 rounded-md border-color-black-400 hover:bg-gray-200"
                  onClick={handleExport}
                  style={{
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    fontSize: 15,
                  }}
                >
                  <DownloadOutlined style={{ fontSize: 20 }} />
                  Export to Excel
                </button>
              </Space>
            </Drawer>

            <Modal
              title="Export Tasks"
              visible={exportModalVisible}
              onCancel={() => setExportModalVisible(false)}
              footer={[
                <Button key="cancel" onClick={() => setExportModalVisible(false)}>
                  Cancel
                </Button>,
                <Button key="export" type="primary" onClick={handleExportConfirm}>
                  Export
                </Button>,
              ]}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <p>Filter by Status:</p>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Select a status"
                    onChange={(value) => setExportStatus(value)}
                    allowClear
                  >
                    <Option value="pending">Pending</Option>
                    <Option value="inprogress">In Progress</Option>
                    <Option value="completed">Completed</Option>
                  </Select>
                </div>

                <div>
                  <p>Filter by Assigned To (Username):</p>
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="Enter username"
                    className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {usernameSuggestions.length > 0 && (
                    <ul className="absolute bg-white border border-gray-300 rounded-md mt-2 w-80 z-10">
                      {usernameSuggestions.map((suggestion) => (
                        <li
                          key={suggestion.username}
                          onClick={() => {
                            setUsername(suggestion.username);
                            setUsernameSuggestions([]);
                          }}
                          className="p-2 hover:bg-gray-200 rounded-md cursor-pointer"
                        >
                          {suggestion.username}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
      <p>Filter by Due Date:</p>
      <DatePicker
        style={{ width: '100%' }}
        onChange={(date) => setExportDueDate(date)}
        format="DD-MM-YYYY"   
      />
    </div>

              </Space>
            </Modal>

            <Modal
              title="About Project"
              visible={aboutModalVisible}
              onCancel={handleAboutModalClose}
              footer={null}
            >
              <Title level={4}>Project: {projectName}</Title>
              <Paragraph>Project description: {projectDescription}</Paragraph>
            </Modal>
          </>
        </div>
      </div>
      <div ref={containerRef} className="overflow-x-auto">
        <Board
          onCardDragEnd={handleCardMove}
          onColumnDragEnd={handleColumnMove}
          renderColumn={(card, columnId) => (
            <div
              style={{
                backgroundColor: "white",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                padding: "0.5rem",
                marginBottom: "0.5rem",
                width: "300px",
                height: "130px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: "20px",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <h3
                  className="font-bold"
                  style={{ fontSize: "1rem", marginBottom: "0.5rem" }}
                >
                  {card.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#4A5568" }}>
                  {card.description}
                </p>
              </div>
              <div
                style={{ display: "flex", justifyContent: "space-between" }}
              ></div>
            </div>
          )}
          renderColumnHeader={({ title, id }) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "300px",
                // position:"fixed",
                position: "sticky",
                // zIndex: 1000,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",

                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                  backgroundColor: "#F7FAFC",

                  backgroundColor: "#ededed",
                }}
                onDoubleClick={() => {
                  setEditingColumnId(id);
                  setTempColumnName(title);
                }}
              >
                {editingColumnId === id ? (
                  <input
                    type="text"
                    value={tempColumnName}
                    onChange={(e) => setTempColumnName(e.target.value)}
                    onBlur={() => handleColumnNameBlur(id)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleColumnNameBlur(id);
                      }
                    }}
                    autoFocus
                    className="w-full p-1 border rounded"
                  />
                ) : (
                  <span className="truncate max-w-[200px]" title={title}>
                    {title}
                  </span>
                )}
                {canShowActions && (
                  <Popover
                    content={
                      <div>
                        <Button
                          type="text"
                          block
                          onClick={() => showRemoveColumnConfirmation(id)}
                        >
                          Remove Column
                        </Button>
                      </div>
                    }
                    trigger="click"
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 focus:outline-none p-2 rounded-full"
                    />
                  </Popover>
                )}
              </div>
              {canShowActions && (
                <button
                  onClick={() => openModal(id, "addCard")}
                  style={{
                    width: "100%",
                    backgroundColor: "white",
                    borderBottomLeftRadius: "0.375rem",
                    borderBottomRightRadius: "0.375rem",
                    padding: "0.5rem",
                    color: "#5f5e5e",
                    textAlign: "center",
                    paddingLeft: "50%",
                  }}
                >
                  <FaPlus />
                </button>
              )}
            </div>
          )}
          renderCard={renderCard}
        >
          {boardData}
        </Board>
      </div>

      {modalVisible && modalType === "addCard" && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              clearFieldsAndRefresh();
            }
          }}
        >
          <div className="bg-white w-[800px] p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add New Card</h2>
            <form onSubmit={handleAddCard}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Card Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Card Title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value.trimStart())}
                  />
                  {titleError && (
                    <p className="text-red-500 text-sm mt-1">{titleError}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="assignedUsername"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Assigned (Username)
                  </label>

                  <input
                    type="text"
                    value={username} // Show the selected username
                    onChange={handleUsernameChange} // Updated function to handle username changes
                    placeholder="Enter username"
                    className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {emailError && ( // This can be renamed to usernameError for clarity if necessary
                    <p className="text-red-500 text-sm mt-1">{emailError}</p>
                  )}
                  {usernameSuggestions.length > 0 && ( // Changed from emailSuggestions to usernameSuggestions
                    <ul className="absolute bg-white border border-gray-300 rounded-md mt-2 w-80 z-10">
                      {usernameSuggestions.map((suggestion) => (
                        <li
                          key={suggestion.username} // Using username as key now
                          onClick={() => {
                            setUsername(suggestion.username); // Set the selected username
                            setEmail(suggestion.email); // Keep the associated email internally if needed
                            setUsernameSuggestions([]); // Clear suggestions after selection
                          }}
                          className="p-2 hover:bg-gray-200 rounded-md cursor-pointer"
                        >
                          {suggestion.username} {/* Display only the username */}
                        </li>
                      ))}
                    </ul>
                  )}

                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="assignDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    name="assignDate"
                    required
                    className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().slice(0, 16)} // Disable past dates
                    value={startDate}
                    onChange={handleStartDateChange}
                  />
                  {startDateError && (
                    <p className="text-red-500 text-sm mt-1">
                      {startDateError}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="dueDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    required
                    className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={startDate || new Date().toISOString().slice(0, 16)} // Disable past dates and enforce start date restriction
                    value={endDate}
                    onChange={handleEndDateChange}
                  />
                  {endDateError && (
                    <p className="text-red-500 text-sm mt-1">{endDateError}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="estimatedHours"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Estimated Hours"
                    required
                    min="0"
                    step="0.1"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                  />
                  {estimatedHoursError && (
                    <p className="text-red-500 text-sm mt-1">
                      {estimatedHoursError}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Card Description
                  </label>
                  <textarea
                    name="description"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Card Description"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value.trimStart())}
                  />
                  {descriptionError && (
                    <p className="text-red-500 text-sm mt-1">
                      {descriptionError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={clearFieldsAndRefresh}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-3xl">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this card?</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-3xl mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveCard}
                className="bg-red-500 text-white px-4 py-2 rounded-3xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccessMessage && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg">
            <p className="font-semibold">Card deleted successfully</p>
          </div>
        </div>
      )}

      {newColumnModalVisible && (
        <Modal
          title="Add New Column"
          visible={newColumnModalVisible}
          onCancel={() => setNewColumnModalVisible(false)}
          footer={null}
        >
          <Form onFinish={handleAddColumnSubmit}>
            <Form.Item
              validateStatus={newColumnError ? "error" : ""}
              help={newColumnError ? "Please enter a column name" : ""}
            >
              <Input
                value={newColumnName}
                onChange={(e) => {
                  setNewColumnName(e.target.value.trimStart());
                  setNewColumnError(false);
                }}
                placeholder="Column Name"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <div className="flex justify-end">
                <Button
                  onClick={() => setNewColumnModalVisible(false)}
                  style={{ marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Add Column
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      )}

      {modalVisible && modalType === "options" && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-lg font-bold mb-4">Column Options</h2>
            <button
              onClick={() => setShowConfirmation(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-3xl w-full mb-2"
            >
              Remove Column
            </button>
            <button
              onClick={closeModal}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-3xl w-full mb-2"
            >
              Cancel
            </button>
            <button onClick={closeModal} className="absolute top-0 right-0 m-4">
              <BsX className="text-gray-500" />
            </button>
          </div>
          {showConfirmation && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <p className="text-lg font-bold mb-4">
                  Are you sure you want to remove this column?
                </p>
                <div className="flex justify-between">
                  <button
                    onClick={handleRemoveColumn}
                    className="bg-red-500 text-white px-10 py-2 rounded-full"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="bg-gray-300 text-gray-700 px-10 py-2 rounded-full"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
          {showRenameConfirmation && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <p className="text-lg font-bold mb-4">
                  Are you sure want to rename this column ?
                </p>
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      handleRenameColumn(newColumnName);
                      setShowRenameConfirmation(false);
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded-3xl"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowRenameConfirmation(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-3xl"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {isGitModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className={`bg-white p-6 rounded-lg shadow-lg w-2/3 h-5/6 overflow-y-auto relative transition-transform transition-opacity duration-300 ease-out transform ${isGitModalOpen ? "scale-100 opacity-100" : "scale-90 opacity-0"
              }`}
          >
            <button
              onClick={closeGitModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-semibold mb-6 border-b pb-2">
              Git Configuration
            </h2>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Quick setup — if you've done this kind of thing before
              </p>
              <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md shadow-sm">
                <code className="text-sm overflow-x-auto">{repository}</code>
                <button
                  onClick={() => copyToClipboard(repository, "button1")}
                  className="ml-2 p-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  {copiedButton === "button1" ? (
                    "Copied"
                  ) : (
                    <MdOutlineContentCopy />
                  )}
                </button>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                ...or create a new repository on the command line
              </p>
              <div className="relative bg-gray-100 p-3 rounded-md shadow-sm">
                <pre ref={newRepoRef} className="whitespace-pre-wrap">
                  <code>
                    {`echo "# ${repoName}" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin ${repository}
git push -u origin main`}
                  </code>
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(newRepoRef.current.innerText, "button2")
                  }
                  className="absolute right-2 top-2 bg-gray-200 hover:bg-gray-300 p-1 rounded"
                >
                  {copiedButton === "button2" ? (
                    "Copied"
                  ) : (
                    <MdOutlineContentCopy />
                  )}
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">
                ...or push an existing repository from the command line
              </p>
              <div className="relative bg-gray-100 p-3 rounded-md shadow-sm">
                <pre ref={existingRepoRef} className="whitespace-pre-wrap">
                  {`git remote add origin ${repository}
git branch -M main
git push -u origin main`}
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(
                      existingRepoRef.current.innerText,
                      "button3"
                    )
                  }
                  className="absolute right-2 top-2 bg-gray-200 hover:bg-gray-300 p-1 rounded"
                >
                  {copiedButton === "button3" ? (
                    "Copied"
                  ) : (
                    <MdOutlineContentCopy />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KanbanBoard;