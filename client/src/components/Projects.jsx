import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { server } from "../constant";

import { BsThreeDotsVertical as EllipsisVertical } from "react-icons/bs";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { images as staticImages } from "../assets/Images";
import dayjs from "dayjs";
import {
  Card,
  Modal,
  Input,
  Button,
  DatePicker,
  Select,
  notification,
  Tooltip,
  Image,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { BsFillPencilFill } from "react-icons/bs";
import { FastAverageColor } from "fast-average-color";
const { TextArea } = Input;
const { Option } = Select;

const Projects = () => {
 
  const [cards, setCards] = useState([]);
  const [showTooltipIndex, setShowTooltipIndex] = useState(null);
  const [editableCard, setEditableCard] = useState(null);
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState("");
  const [descriptionInputValue, setDescriptionInputValue] = useState("");
  const [renameIndex, setRenameIndex] = useState(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [userRole, setUserRole] = useState("");
  const [organizationId, setOrganizationId] = useState(null);
  const [newCardErrors, setNewCardErrors] = useState({
    name: false,
    description: false,
    email: false,
    startDate: false,
    projectManager:false,
  });
  const [projectManager, setProjectManager] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [renameInputError, setRenameInputError] = useState(false);
  const [descriptionInputError, setDescriptionInputError] = useState(false);
  const [projectManagerError, setProjectManagerError] = useState(false);
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [teamInputError, setTeamInputError] = useState(false);
  const [teamInputErrorMessage, setTeamInputErrorMessage] = useState("");
  const [teamInputValue, setTeamInputValue] = useState("");
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [addProjectModalVisible, setAddProjectModalVisible] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    projectManager: "",
    startDate: null,
    teams: "",
  });
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(true);
  //added
  const fac = new FastAverageColor();
  const [unsplashImages, setUnsplashImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [bgImageError, setBgImageError] = useState(false);

  // Add this function to fetch images from Unsplash
  const fetchUnsplashImages = async () => {
    try {
      const response = await axios.get(
        "https://api.unsplash.com/photos/random",
        {
          params: {
            count: 6,
            client_id: "rn5n3NUhw16AjjwCfCt3e1TKhiiKHCOxBdEp8E0c-KY", // Replace with your Unsplash API key
          },
        }
      );
      setUnsplashImages(response.data);
    } catch (error) {
      console.error("Error fetching Unsplash images:", error);
      setUnsplashImages(staticImages);
    }
  };

  // Call this function when the modal opens
  useEffect(() => {
    if (addProjectModalVisible) {
      fetchUnsplashImages();
    }
  }, [addProjectModalVisible]);

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
        fetchProjects(response.data.organizationId);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRoleAndOrganization();
  }, []);

  const filterProjectManager = (input, option) => {
    return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  }

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

      const projectsWithColors = await Promise.all(
        response.data.projects.map(async (project) => {
          if (project.bgUrl && project.bgUrl.thumb) {
            try {
              const color = await fac.getColorAsync(project.bgUrl.thumb);
              return {
                ...project,
                textColor: color.isDark ? "white" : "black",
              };
            } catch (error) {
              console.error("Error calculating color:", error);
              return {
                ...project,
                textColor: "black", // default color if there's an error
              };
            }
          }
          return {
            ...project,
            textColor: "black", // default color if there's no background image
          };
        })
      );

      setCards(projectsWithColors);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(
          `${server}/api/organizations/${organizationId}/teams`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setAvailableTeams(response.data.teams || []);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (organizationId) {
      fetchTeams();
    }
  }, [organizationId]);

  const handleCardClick = async (projectId) => {
    try {
      navigate(`/projects/${projectId}/tasks`);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const checkDuplicateProjectName = async (name, excludeProjectId = null) => {
    try {
      const response = await axios.get(
        `${server}/api/projects/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const existingProjects = response.data.projects;
      return existingProjects.some(
        (project) =>
          project.name.toLowerCase().replace(/\s+/g, "") ===
          name.toLowerCase().replace(/\s+/g, "") &&
          project._id !== excludeProjectId
      );
    } catch (error) {
      console.error("Error checking for duplicate project name:", error);
      return false;
    }
  };

  const handleAddCard = () => {
    setAddProjectModalVisible(true);
    setNewProject({
      name: "",
      description: "",
      projectManager: "",
      startDate: null,
      teams: [],
      bgUrl: "",
    });
    setNewCardErrors({
      name: false,
      description: false,
      email: false,
      startDate: false,
      projectManager:false,
    });
  };

  const handleSaveNewCard = async () => {
    const newErrors = { ...newCardErrors };
    let hasError = false;

    if (!newProject.name.trim()) {
      newErrors.name = true;
      hasError = true;
    }
    if (!newProject.description.trim()) {
      newErrors.description = true;
      hasError = true;
    }
    if (
      !newProject.projectManager ||
      !isValidEmail(newProject.projectManager)
    ) {
      newErrors.projectManager = true;
      hasError = true;
    }
    if (!newProject.startDate) {
      newErrors.startDate = true;
      hasError = true;
    }
    if (newProject.teams.length === 0) {
      setTeamInputError(true);
      hasError = true;
    }

    if (!selectedImage) {
      setBgImageError(true);
      hasError = true;
    }

    if (hasError) {
      setNewCardErrors(newErrors);
      return;
    }

    if (!newProject.teams) {
      setTeamInputError(true);
      hasError = true;
    }

    const isDuplicate = await checkDuplicateProjectName(newProject.name);
    if (isDuplicate) {
      setNewCardErrors({ ...newErrors, name: true });
      notification.warning({
        message: "Project name taken. Choose another",
      });
      return;
    }

    try {
      const response = await axios.get(`${server}/api/users/search`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        params: {
          email: newProject.projectManager,
          fields: "email status name",
        },
      });

      if (response.data.users.length === 0) {
        setNewCardErrors({ ...newErrors, email: true });
        setProjectManagerError(true);
        return;
      }

      const statusResponse = await axios.get(`${server}/api/user-status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        params: { email: newProject.projectManager },
      });

      if (statusResponse.data.status === "unverified") {
        setNewCardErrors({ ...newErrors, email: true });
        notification.warning({
          message: "Verify email before creating project",
        });
        return;
      }

      const createdBy = await fetchUserEmail();

      const projectResponse = await axios.post(
        `${server}/api/projects`,
        {
          organizationId: organizationId,
          name: newProject.name.trim(),
          description: newProject.description.trim(),
          projectManager: newProject.projectManager,
          startDate: newProject.startDate,
          // teams: newProject.teams,
          teams: [newProject.teams],
          createdBy: createdBy,
          bgUrl: selectedImage
            ? {
              raw: selectedImage.urls.raw,
              thumb: selectedImage.urls.thumb,
              full: selectedImage.urls.full,
              regular: selectedImage.urls.regular,
            }
            : null,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log(projectResponse.data);

      const newProjectData = projectResponse.data.project;
      setCards((prevCards) => [
        ...prevCards,
        {
          ...newProjectData,
          projectManagerStatus: projectResponse.data.projectManagerStatus,
        },
      ]);
      setAddProjectModalVisible(false);
      fetchProjects(organizationId);
    } catch (error) {
      console.error("Error creating new project:", error);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await axios.delete(`${server}/api/projects/${cardId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCards((prevCards) => prevCards.filter((card) => card._id !== cardId));
      setShowTooltipIndex(null);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };
  const handleDelete = (index) => {
    setDeleteIndex(index);
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = () => {
    handleDeleteCard(cards[deleteIndex]._id);
    setDeleteDialogVisible(false);
    setDeleteIndex(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogVisible(false);
    setDeleteIndex(null);
  };

  const handleRenameCard = (index) => {
    setRenameIndex(index);
    setRenameInputValue(cards[index].name);
    setDescriptionInputValue(cards[index].description);
    setProjectManager(cards[index].projectManager);
    setRenameDialogVisible(true);
  };

  const handleSaveRename = async () => {
    if (!renameInputValue) {
      setRenameInputError(true);
      return;
    }
    if (!descriptionInputValue) {
      setDescriptionInputError(true);
      return;
    }
    if (!projectManager) {
      setProjectManagerError(true);
      return;
    }
    if (projectManagerError) {
      return;
    }

    let updatedBy;
    try {
      updatedBy = await fetchUserEmail();
    } catch (error) {
      console.error("Error fetching logged-in user's email:", error);
      return;
    }

    const isDuplicate = await checkDuplicateProjectName(
      renameInputValue,
      cards[renameIndex]._id
    );
    if (isDuplicate) {
      setRenameInputError(true);
      notification.warning({
        message: "Name already exists. Choose another",
      });
      return;
    }

    try {
      const response = await axios.put(
        `${server}/api/projects/${cards[renameIndex]._id}`,
        {
          name: renameInputValue,
          description: descriptionInputValue,
          projectManager: projectManager,
          updatedBy: updatedBy,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const updatedProject = response.data.project;

      setCards((prevCards) =>
        prevCards.map((card) =>
          card._id === updatedProject._id ? updatedProject : card
        )
      );

      setRenameDialogVisible(false);
      setRenameIndex(null);
      setShowTooltipIndex(null);
    } catch (error) {
      console.error("Error renaming project:", error);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTooltipIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDropdownVisibleChange = async (open) => {
    if (open) {
      try {
        const response = await axios.get(`${server}/api/users/search`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: { organizationId: organizationId }, // Add necessary parameters
        });

        if (response.data.users.length > 0) {
          const suggestions = response.data.users.map((user) => ({
            username: user.username,
            email: user.email,
          }));

          setEmailSuggestions(suggestions); // Set username and email as suggestions
          setProjectManagerError(false);
        } else {
          setEmailSuggestions([]);
          setProjectManagerError(true);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setEmailSuggestions([]);
        setProjectManagerError(true);
      }
    }
    //   else {
    //    setEmailSuggestions([]); // Clear suggestions when dropdown closes
    //  }
  };

  const handleProjectManagerChange = async (value) => {
    setNewProject((prev) => ({ ...prev, projectManager: value }));
    setProjectManagerError(false);
  
    if (value) {
      try {
        const response = await axios.get(`${server}/api/users/search`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: { organizationId: organizationId }, // Add necessary parameters
        });

        if (response.data.users.length > 0) {
          const suggestions = response.data.users.map((user) => ({
            username: user.username, // Fetch the username
            email: user.email,
          }));
          
          setEmailSuggestions(suggestions); // Set username and email as suggestions
          setProjectManagerError(false);
        } else {
          setEmailSuggestions([]);
          setProjectManagerError(true);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setEmailSuggestions([]);
        setProjectManagerError(true);
      }
    }
    //   else {
    //    setEmailSuggestions([]); // Clear suggestions when dropdown closes
    //  }
  };




  const isValidEmail = (email) => {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const fetchUserEmail = async () => {
    try {
      const response = await axios.get(`${server}/api/user`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data.user.email;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };
  // if (!cards.length) {
  //   return (
  //     <div
  //       style={{
  //         display: "flex",
  //         justifyContent: "center",
  //         alignItems: "center",
  //         height: "100vh",
  //       }}
  //     >
  //       <FontAwesomeIcon
  //         icon={faSpinner}
  //         spin
  //         style={{ marginRight: "10px" }}
  //       />
  //       Loading...
  //     </div>
  //   );
  // }
  const filterTeams = (input, option) => {
    return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  };
  return (
    <div className="min-h-full bg-light-white rounded-3xl p-8">
      <div className="flex justify-between items-center mb-4">
        {userRole === "ADMIN" && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCard}
            disabled={isAddingCard}
          >
            Add Project
          </Button>
        )}
      </div>

      <div className="flex flex-wrap justify-start">
        {cards.map((card, index) => (
          <Card
            key={card._id}
            className="m-4 w-64 cursor-pointer relative"
            hoverable
            onClick={() => handleCardClick(card._id)}
            style={{
              backgroundImage: card.bgUrl.thumb
                ? `url(${card.bgUrl.thumb})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex justify-between items-center">

              <h3
                className="font-bold truncate"
                style={{
                  color: card.textColor,
                  maxWidth: "80%", // Limit width to allow space for ellipsis button
                }}
              >
                {card.name}
              </h3>

              {userRole !== "USER" && (
                <button
                  className="border-none rounded-md cursor-pointer p-2 flex items-center hover:bg-white hover:scale-105 transition-all duration-200 ease-in-out shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltipIndex(
                      showTooltipIndex === index ? null : index
                    );
                  }}
                >
                  <EllipsisVertical style={{ color: card.textColor }} />
                </button>
              )}
            </div>

            <p
              className="truncate"
              style={{
                color: card.textColor,
                maxWidth: "100%",
              }}
            >
              {card.description}
            </p>

            <div className="mt-2 flex justify-between items-center">
              <p
                className=" rounded-md text-sm inline-block"
                style={{ color: card.textColor }}
              >
                Start Date: {dayjs(card.startDate).format("DD/MM/YYYY")}
              </p>
              <Tooltip title={card.projectManagerName}>
                <div
                  className="w-5 h-5 bg-blue-600 flex items-center justify-center rounded-full text-xs"
                  style={{ color: card.textColor }}
                >
                  {card.projectManagerName.charAt(0).toUpperCase()}
                </div>
              </Tooltip>
            </div>
            {card.projectManagerStatus === "unverify" && (
              <span className="text-yellow-500">(Unverified)</span>
            )}
            {showTooltipIndex === index && (
              <div
                ref={dropdownRef}
                className="absolute right-6 top-10 ml-2 w-36 bg-white border rounded-md shadow-lg z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  type="text"
                  block
                  icon={<BsFillPencilFill />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameCard(index);
                    setShowTooltipIndex(null);
                  }}
                >
                  Rename
                </Button>
                <Button
                  type="text"
                  block
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(index);
                    setShowTooltipIndex(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal
        title="Add New Project"
        visible={addProjectModalVisible}
        onOk={handleSaveNewCard}
        onCancel={() => setAddProjectModalVisible(false)}
        width={700}
        bodyStyle={{
          maxHeight: "70vh", // Limit the modal body height to 70% of the viewport height
          overflowY: "auto", // Enable vertical scrolling within the modal body
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) =>
                setNewProject((prev) => ({ ...prev, name: e.target.value }))
              }
              className={newCardErrors.name ? "border-red-500" : ""}
            />
            {newCardErrors.name && (
              <p className="text-red-500">Project Name is required</p>
            )}
          </div>

          <div>
            <TextArea
              placeholder="Project Description"
              value={newProject.description}
              onChange={(e) =>
                setNewProject((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className={` ${newCardErrors.description ? "border-red-500" : ""
                }`}
            />
            {newCardErrors.description && (
              <p className="text-red-500">Project Description is required</p>
            )}
          </div>
          <div>
            <Select
           className={`w-full ${newCardErrors.projectManager ? "border-red-500" : ""}`}
           placeholder="Select a Project Manager"
           value={newProject.projectManager.length > 0 ? newProject.projectManager : null}
              onChange={handleProjectManagerChange}
              onSearch={handleProjectManagerChange}
              onDropdownVisibleChange={handleDropdownVisibleChange} // Fetch suggestions when dropdown is visible
              filterOption={filterProjectManager}
              optionFilterProp="children"
              listHeight={120}
              maxTagCount={4}
              maxTagTextLength={20}
              showSearch
            >
              {emailSuggestions.map((suggestion, index) => (
                <Select.Option key={index} value={suggestion.email}>
                  {suggestion.username}
                </Select.Option>
              ))}
            </Select>

            {newCardErrors.projectManager && (
    <p className="text-red-500">Project Manager is required</p>
  )}
          </div>

          <div>
            <DatePicker
              className="w-full"
              placeholder="Start Date"
              value={newProject.startDate ? dayjs(newProject.startDate) : null}
              onChange={(date) =>
                setNewProject((prev) => ({
                  ...prev,
                  startDate: date ? date.toDate() : null,
                }))
              }
              disabledDate={(current) => {
                // Disable past dates
                return current && current < dayjs().startOf("day");
              }}
            />
            {newCardErrors.startDate && (
              <p className="text-red-500">Start Date is required</p>
            )}
          </div>

          <div className="col-span-2">
            <Select
              className="w-full"
              placeholder="Search and select a team"
              value={newProject.teams}
              onChange={(value) => {
                setNewProject((prev) => ({ ...prev, teams: value }));
                setTeamInputError(false);
              }}
              showSearch
              filterOption={filterTeams}
              optionFilterProp="children"
              listHeight={120} // This sets the height of the dropdown list
              maxTagCount={4} // This limits the number of visible selected tags
              maxTagTextLength={20} // This truncates long team names in the tags
            >
              {availableTeams.map((team) => (
                <Option key={team._id} value={team._id}>
                  {team.name}
                </Option>
              ))}
            </Select>
            {teamInputError && (
              <p className="text-red-500">At least one team is required</p>
            )}
          </div>

          <div className="col-span-2 mt-4">
            <h4>Select Background Image</h4>
            <div className="flex flex-wrap justify-center items-center overflow-y-auto max-h-40">
              {unsplashImages.map((image) => (
                <div
                  key={image.id}
                  className={`m-2 cursor-pointer ${selectedImage === image ? "border-4 border-blue-500" : ""
                    }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image.urls.thumb}
                    alt={image.alt_description}
                    width={80}
                    height={80}
                    preview={false}
                  />
                </div>
              ))}
            </div>
            {bgImageError && (
              <p className="text-red-500">Background image is required</p>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="Rename Project"
        visible={renameDialogVisible}
        onOk={handleSaveRename}
        onCancel={() => setRenameDialogVisible(false)}
      >
        <Input
          placeholder="Project Name"
          value={renameInputValue}
          onChange={(e) => {
            setRenameInputValue(e.target.value.trimStart());
            setRenameInputError(false);
          }}
          className={renameInputError ? "border-red-500" : ""}
        />
        {renameInputError && (
          <p className="text-red-500">Project Name is required</p>
        )}

        <TextArea
          placeholder="Project Description"
          value={descriptionInputValue}
          onChange={(e) => {
            setDescriptionInputValue(e.target.value.trimStart());
            setDescriptionInputError(false);
          }}
          className={`mt-4 ${descriptionInputError ? "border-red-500" : ""}`}
        />
        {descriptionInputError && (
          <p className="text-red-500">Project Description is required</p>
        )}
      </Modal>


      <Modal
        title="Confirm Project Deletion"
        visible={deleteDialogVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
      >
        <p>Are you sure you want to delete this project?</p>
      </Modal>
    </div>
  );
};
export default Projects;