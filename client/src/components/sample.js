import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Dropdown, Menu, Select, Button, Modal, Input, DatePicker, Form, notification, message,Checkbox ,Collapse} from "antd";
import { DownOutlined, PlusOutlined, ExportOutlined, SearchOutlined, CalendarOutlined } from "@ant-design/icons";
import { server } from "../constant";
import moment from "moment";
import * as XLSX from 'xlsx';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const StatusSheet = () => {
    const { Panel } = Collapse;
    const [selectedUser, setSelectedUser] = useState(null);
    const [inputValue, setInputValue] = useState(''); // Define inputValue state
    const [modalStatus, setModalStatus] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [dataSource, setDataSource] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSubmitButton, setShowSubmitButton] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [tasks, setTasks] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [organizationId, setOrganizationId] = useState(null);
    const [createdBy, setCreatedBy] = useState(null);
    const [form] = Form.useForm(); // Add this line to create the form instance
    const [assignedEmail, setAssignedEmail] = useState("");
    const [selectedUserName, setSelectedUserName] = useState("");
    const [userProjects, setUserProjects] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [tableData, setTableData] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [dateFilter, setDateFilter] = useState(null);
    const [isExportModalVisible, setIsExportModalVisible] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedUsersForExport, setSelectedUsersForExport] = useState([]);
    const showExportModal = () => {
        setIsExportModalVisible(true);
    };

    const [assignedDate, setAssignedDate] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");

    const handleDateChange = (date) => {
        setAssignedDate(date);
    };


    const handleStatusChange = (status) => {
        setModalStatus(status);
        setSelectedStatus(status);
    };

    const resetModalState = () => {
        // Store the current assignedTo value
        const currentAssignedTo = form.getFieldValue('assignedTo');

        // Reset all form fields
        form.resetFields();

        // Restore the assignedTo value
        form.setFieldsValue({
            assignedTo: currentAssignedTo
        });

        // Reset other state
        setRows([]);
        setShowSubmitButton(false);
        setIsModalVisible(false);
    };
    // Fetch user role, organization ID, and projects
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const roleResponse = await axios.get(`${server}/api/role`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setUserRole(roleResponse.data.role);
                const orgId = roleResponse.data.organizationId;
                setOrganizationId(orgId);

                // Fetch users based on organization ID
                const usersResponse = await axios.get(`${server}/api/users`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setUsers(usersResponse.data.users);

                // Fetch projects using the new API endpoint
                await fetchProjects(orgId);

                // ... (keep other existing fetches if needed)
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    // Handle user selection
    const handleUserSelect = (userId) => {
        const selectedUser = users.find((user) => user._id === userId);
        setSelectedUser(userId);
        setSelectedUserName(selectedUser.username); // Update user name
        setAssignedEmail(selectedUser.email); // Store selected user's email
        form.setFieldsValue({ assignedTo: selectedUser.email });
        fetchTasks(selectedUser.email);
        // Set the email in the form
        form.setFieldsValue({ assignedEmail: selectedUser.email });
    };

    // Handle project selection
    const handleProjectSelect = (projectId) => {
        setSelectedProject(projectId);
    };

    const handleOk = async (values) => {
        try {
            const { assignedTo, estimatedHours, assignedDate } = values;

            // Prepare tasks data
            const tasks = rows.map((_, index) => ({
                taskName: values[`taskName_${index}`],
                assignedBy: values[`assignedBy_${index}`],
                projectId: values[`projectName_${index}`],
            }));

            // Prepare the payload
            const payload = {
                taskDetailsData: {
                    assignedTo, // This is now the email address
                    assignedDate: assignedDate.toISOString(),
                    estimatedHours,
                },
                tasks,
            };

            const response = await axios.post(
                `${server}/tasks-with-details`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            message.success("Tasks created successfully!");
            resetModalState();
            form.resetFields(['estimatedHours', 'assignedDate']);
            resetFormExceptAssignedTo();
            setRows([]);
            setIsModalVisible(false);

            // Fetch updated tasks
            fetchTasks(assignedTo);
        } catch (error) {
            console.error("Error creating tasks:", error);
            message.error(
                "Failed to create tasks: " +
                (error.response?.data?.error || "Unknown error")
            );
        }
    };
    const fetchTasks = async (assignedEmail) => {
        try {
            const response = await axios.get(`${server}/tasks-with-details`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                params: {
                    assignedTo: assignedEmail,
                },
            });

            const formattedData = response.data.map((task) => ({
                key: task._id,
                taskId: task.id,
                taskDetailsId: task.taskDetailsId,
                taskName: task.name,
                projectName: task.projectName || "N/A",
                assignedBy: task.assignedBy || "N/A",
                assignedTo: task.TaskId?.assignedTo || "N/A",
                assignedDate: moment(task.TaskId?.assignedDate).format("YYYY-MM-DD"),
                estimatedHours: task.TaskId?.estimatedHours || "N/A",
                status: task.status,
            }));

            const groupedData = groupDataByAssignedDate(formattedData);
            setDataSource(groupedData);
            setFilteredData(groupedData);  //added
        } catch (error) {
            console.error("Error fetching tasks:", error);
            message.error("Failed to fetch tasks");
        }
    };


    //added
    useEffect(() => {
        if (dataSource.length > 0) {
            const filtered = dataSource.map(dateGroup => ({
                ...dateGroup,
                tasks: dateGroup.tasks.filter(task =>
                    task.taskId.toString().toLowerCase().includes(searchValue.toLowerCase())
                )
            })).filter(dateGroup => dateGroup.tasks.length > 0);
            setFilteredData(filtered);
        }
    }, [searchValue, dataSource]);

    useEffect(() => {
        if (selectedUser) {
            fetchTasks(selectedUser.email);
        }
    }, [selectedUser]);

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    //added
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

    // Use fetchUserEmail inside useEffect
    useEffect(() => {
        fetchUserEmail();
    }, []);

    // // Handle status change
    const handleChangeStatus = async (taskId, newStatus) => {
        try {
            // Make the PUT request to update the status on the server
            const response = await fetch(`${server}/tasks-with-details/${taskId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }

            const updatedTask = await response.json();

            // Update the local state (dataSource) directly after status change
            setDataSource((prevDataSource) =>
                prevDataSource.map((dateGroup) => ({
                    ...dateGroup,
                    tasks: dateGroup.tasks.map((task) =>
                        task.key === taskId
                            ? { ...task, status: newStatus }
                            : task
                    )
                }))
            );

            setFilteredData((prevFilteredData) =>
                prevFilteredData.map((dateGroup) => ({
                    ...dateGroup,
                    tasks: dateGroup.tasks.map((task) =>
                        task.key === taskId ? { ...task, status: newStatus } : task
                    ),
                }))
            );

            //message.success("Task status updated successfully");
        } catch (err) {
            console.error(err.message);
            message.error("Failed to update status");
        }
    };

    const resetFormExceptAssignedTo = () => {
        const assignedTo = form.getFieldValue('assignedTo');
        form.resetFields();
        form.setFieldsValue({ assignedTo });
    };
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const groupDataByAssignedDate = (data) => {
        const groupedData = {};
        data.forEach(item => {
            if (!groupedData[item.assignedDate]) {
                groupedData[item.assignedDate] = {
                    assignedDate: item.assignedDate,
                    tasks: [item],
                    assignedTo: item.assignedTo,
                    estimatedHours: item.estimatedHours
                };
            } else {
                groupedData[item.assignedDate].tasks.push(item);
            }
        });
        return Object.values(groupedData);
    };

    const handleChangeStatusForDate = async (tasks, newStatus) => {
        try {
            // Create an array of promises for each task to update their status
            const updatePromises = tasks.map(task =>
                fetch(`${server}/tasks-with-details/${task.key}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                })
            );
    
            // Wait for all tasks to be updated
            await Promise.all(updatePromises);
    
            // Update the local state (dataSource) for all tasks in the current date group
            setDataSource((prevDataSource) =>
                prevDataSource.map((dateGroup) => ({
                    ...dateGroup,
                    tasks: dateGroup.tasks.map((task) =>
                        tasks.find((t) => t.key === task.key)
                            ? { ...task, status: newStatus }
                            : task
                    ),
                }))
            );
    
            message.success("All tasks status updated successfully");
        } catch (err) {
            console.error(err.message);
            message.error("Failed to update tasks status");
        }
    };

    const handleCreateProject = async () => {
        try {
            setLoading(true);

            const response = await axios.post(
                `${server}/projects`,
                {
                    name: newProjectName,
                    organizationId,
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            );
            message.success("Project created successfully!");
            setNewProjectName("");
            handleCreateProjectCancel();
            // Fetch updated projects list
            await fetchProjects(organizationId);
        } catch (error) {
            console.error("Error creating project:", error);
            message.error("Failed to create project");
        } finally {
            setLoading(false);
        }
    };
    const fetchProjects = async (orgId) => {
        try {
            const projectsResponse = await axios.get(
                `${server}/api/${orgId}/projects`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            setProjects(projectsResponse.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
            message.error("Failed to fetch projects");
        }
    };
    const userMenu = (
        <Menu onClick={(e) => handleUserSelect(e.key)}>
            {users.map((user) => (
                <Menu.Item key={user._id}>{user.username}</Menu.Item>
            ))}
        </Menu>
    );

    const [rows, setRows] = useState([]);
    const [isCreateProjectModalVisible, setCreateProjectModalVisible] =
        useState(false);
    const showCreateProjectModal = () => setCreateProjectModalVisible(true);
    const handleCreateProjectCancel = () => setCreateProjectModalVisible(false);

    const handleAddRow = () => {
        form
            .validateFields([
                `projectName_${rows.length - 1}`,
                `taskName_${rows.length - 1}`,
                `assignedBy_${rows.length - 1}`,
            ])
            .then(() => {
                // Add a new row if the current one is valid
                setRows([...rows, {}]);
                setShowSubmitButton(true); // Enable submit button
            })
            .catch(() => {
            });
    };

    const handleCancelRow = (index) => {
        form.resetFields([
            `projectName_${index}`,
            `taskName_${index}`,
            `assignedBy_${index}`,
        ]);
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);

        // Disable submit button if all rows are removed
        if (newRows.length === 0) {
            setShowSubmitButton(false);
        }
    };
    const handleModalClose = () => {
        resetFormExceptAssignedTo();
        setRows([]);
        setIsModalVisible(false);
        setShowSubmitButton(false); // Reset submit button visibility
        resetModalState();
    };

    const { Option } = Select;

    const [options, setOptions] = useState(
        users.map(user => ({ label: user.username, value: user.email }))
    );

    return (
        <div style={{ padding: "20px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: selectedUser ? "space-between" : "flex-end", // Adjusts layout based on selectedUser
                    marginBottom: "10px",
                    alignItems: "center",
                }}
            >
                {selectedUser && (
                    <div style={{ flexGrow: 1 }}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Search by Task ID"
                            style={{ width: "300px" }} // Search bar width
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </div>
                )}

                <div style={{ display: "flex", alignItems: "center" }}>
                    {userRole === "ADMIN" && selectedUser && (
                        <Button
                            style={{ marginRight: "10px" }}
                            type="primary"
                            onClick={() => setIsModalVisible(true)}
                        >
                            <PlusOutlined /> Add Task
                        </Button>
                    )}

                    {userRole === "ADMIN" && (
                        <Button
                            style={{ marginRight: "10px" }}
                            type="primary"
                            onClick={showExportModal}
                            icon={<ExportOutlined />}
                        >
                            Export Tasks
                        </Button>
                    )}

                    <Dropdown overlay={userMenu}>
                        <Button style={{ width: "160px" }}>
                            {selectedUserName || "Select User"} <DownOutlined />
                        </Button>
                    </Dropdown>
                </div>
            </div>

            <Modal
                title="Export Tasks"
                visible={isExportModalVisible}
                onCancel={handleExportModalCancel}
                footer={[
                    <Button key="cancel" onClick={handleExportModalCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="export"
                        type="primary"
                        onClick={exportToExcel}
                    >
                        Export
                    </Button>,
                ]}
            >
                <Form layout="vertical">
                    <Form.Item label="Select Users">
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Select users to export (leave empty to export all)"
                            onChange={handleUserSelectForExport}
                            optionFilterProp="children"
                            value={selectedUsersForExport}
                        >
                            {users.map((user) => (
                                <Option key={user._id} value={user._id}>
                                    {user.username}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="Assigned Date">
                        <DatePicker
                            style={{ width: '100%' }}
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"
                            value={assignedDate}
                        />
                    </Form.Item>

                    <Form.Item label="Status">
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Select status"
                            onChange={handleStatusChange}
                            value={modalStatus}
                        >
                            <Option value="">All</Option> {/* Option for all statuses */}
                            <Option value="Pending">Pending</Option>
                            <Option value="inprogress">In Progress</Option>
                            <Option value="completed">Completed</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>


            {/* Table */}
            <div style={{ margin: "0 auto" }} className="dark">
            {selectedUser ? (
                <Table
                dataSource={filteredData}
                    //dataSource={dataSource}
                    rowKey="assignedDate" // Ensure you have a unique key for each assigned date row
                    columns={[
                //         {
                //             title: "Assigned Date",
                //             dataIndex: "assignedDate",
                //             key: "assignedDate",
                //             sorter: (a, b) => moment(a.assignedDate).unix() - moment(b.assignedDate).unix(),
                //             sortDirections: ["ascend", "descend"],
                //             render: (text) => (
                //                 <div style={{ maxWidth: "100px", overflow: "auto", whiteSpace: "nowrap" }}>
                //                     {text}
                //                 </div>
                //             ),
                //         },
                //         {
                //             title: "Tasks",
                //             dataIndex: "tasks",
                //             key: "tasks",
                //             render: (tasks, record) => (
                //                 <Collapse defaultActiveKey={[]} expandIconPosition="right">
                //                     <Panel header={`Tasks (${tasks.length})`} key="1">
                //                         <Table
                //                             dataSource={tasks}
                //                             rowKey="taskId" // Ensure you have a unique key for the tasks
                //                             columns={[
                //                                 {
                //                                     title: "Task ID",
                //                                     dataIndex: "taskId",
                //                                     key: "taskId",
                //                                 },
                //                                 {
                //                                     title: "Task Name",
                //                                     dataIndex: "taskName",
                //                                     key: "taskName",
                //                                 },
                //                                 {
                //                                     title: "Project Name",
                //                                     dataIndex: "projectName",
                //                                     key: "projectName",
                //                                 },
                //                                 {
                //                                     title: "Assigned By",
                //                                     dataIndex: "assignedBy",
                //                                     key: "assignedBy",
                //                                 },
                //                                 {
                //                                     title: (
                //                                         <div style={{ display: "flex", alignItems: "center" }}>
                //                                             <span>Status</span>
                //                                             <Checkbox
                //                                                 style={{ marginLeft: 8 }}
                //                                                 onChange={(e) => {
                //                                                     if (e.target.checked) {
                //                                                         // When checkbox is checked, change status of all tasks in this date group to 'Completed'
                //                                                         tasks.forEach((task) => {
                //                                                             handleChangeStatus(task.key, "completed");
                //                                                         });
                //                                                     }
                //                                                 }}
                //                                             />
                //                                         </div>
                //                                     ),
                //                                     dataIndex: "status",
                //                                     key: "status",
                //                                     render: (status, task) => (
                //                                         <Select
                //                                             value={status}
                //                                             style={{ width: 120 }}
                //                                             onChange={(value) => {
                //                                                 handleChangeStatus(task.key, value);
                //                                             }}
                //                                             disabled={userRole !== "ADMIN"}
                //                                         >
                //                                             <Option value="pending">Pending</Option>
                //                                             <Option value="inprogress">In Progress</Option>
                //                                             <Option value="completed">Completed</Option>
                //                                         </Select>
                //                                     ),
                //                                 },
                //                             ]}
                //                             pagination={false}
                //                         />
                //                     </Panel>
                //                 </Collapse>
                //             ),
                //         },
                //         {
                //             title: "Assigned To",
                //             dataIndex: "assignedTo",
                //             key: "assignedTo",
                //         },
                //         {
                //             title: "Estimated Hours",
                //             dataIndex: "estimatedHours",
                //             key: "estimatedHours",
                //             sorter: (a, b) => a.estimatedHours - b.estimatedHours,
                //             sortDirections: ["ascend", "descend"],
                //         },
                //     ]}
                // />
                {
                    title: "Assigned Date",
                    dataIndex: "assignedDate",
                    key: "assignedDate",
                    width: "15%",
                    sorter: (a, b) => moment(a.assignedDate).unix() - moment(b.assignedDate).unix(),
                    sortDirections: ["ascend", "descend"],
                    render: (text) => (
                        <div style={{ maxWidth: "100px", overflow: "auto", whiteSpace: "nowrap" }}>
                            {text}
                        </div>
                    ),
                },
                {
                    title: "Tasks",
                    dataIndex: "tasks",
                    key: "tasks",
                    width: "55%",
                    render: (tasks, record) => (
                        <div style={{ width: '100%' }}>
                            <Collapse defaultActiveKey={[]} expandIconPosition="right">
                                <Panel header={`Tasks (${tasks.length})`} key="1">
                                    <Table
                                        dataSource={tasks}
                                        rowKey="taskId"
                                        pagination={false}
                                        columns={[
                                            {
                                                title: "Task ID",
                                                dataIndex: "taskId",
                                                key: "taskId",
                                                width: "15%",
                                            },
                                            {
                                                title: "Task Name",
                                                dataIndex: "taskName",
                                                key: "taskName",
                                                width: "25%",
                                            },
                                            {
                                                title: "Project Name",
                                                dataIndex: "projectName",
                                                key: "projectName",
                                                width: "25%",
                                            },
                                            {
                                                title: "Assigned By",
                                                dataIndex: "assignedBy",
                                                key: "assignedBy",
                                                width: "15%",
                                            },
                                            {
                                                title: (
                                                    <div style={{ display: "flex", alignItems: "center" }}>
                                                        <span>Status</span>
                                                        <Checkbox
                                                            style={{ marginLeft: 8 }}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    tasks.forEach((task) => {
                                                                        handleChangeStatus(task.key, "completed");
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                ),
                                                dataIndex: "status",
                                                key: "status",
                                                width: "20%",
                                                render: (status, task) => (
                                                    <Select
                                                        value={status}
                                                        style={{ width: '100%' }}
                                                        onChange={(value) => {
                                                            handleChangeStatus(task.key, value);
                                                        }}
                                                        disabled={userRole !== "ADMIN"}
                                                    >
                                                        <Option value="pending">Pending</Option>
                                                        <Option value="inprogress">In Progress</Option>
                                                        <Option value="completed">Completed</Option>
                                                    </Select>
                                                ),
                                            },
                                        ]}
                                    />
                                </Panel>
                            </Collapse>
                        </div>
                    ),
                },
                {
                    title: "Assigned To",
                    dataIndex: "assignedTo",
                    key: "assignedTo",
                    width: "15%",
                },
                {
                    title: "Estimated Hours",
                    dataIndex: "estimatedHours",
                    key: "estimatedHours",
                    width: "15%",
                    sorter: (a, b) => a.estimatedHours - b.estimatedHours,
                    sortDirections: ["ascend", "descend"],
                },
            ]}
        />
            ) : (
                <p
                    style={{
                        margin: "0 auto",
                        maxWidth: "95%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "10vh",
                    }}
                >
                    Please select a user to view tasks.
                </p>
            )}
        </div>
            {/* Modal for adding new tasks */}
            <Modal
                title="Add New Task"
                visible={isModalVisible}
                onCancel={handleModalClose} // Use a custom close handler
                footer={null}
                width={800}
                bodyStyle={{ maxHeight: "500px", overflowY: "scroll", padding: "20px" }}
                className="rounded-lg shadow-lg"
            >
                <Form form={form} layout="vertical" onFinish={handleOk}>
                    {/* Assigned To, Estimated Hours, Assigned Date */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <Form.Item
                            label="Assigned To"
                            name="assignedTo"
                            rules={[{ required: true, message: 'Please enter the assigned email' }]}
                        >
                            <Input placeholder="Enter email" disabled />
                        </Form.Item>
                        <Form.Item
                            label="Estimated Hours"
                            name="estimatedHours"
                            rules={[
                                { required: true, message: "Please enter the estimated hours" },
                                {
                                    validator: (_, value) => {
                                        if (value && parseFloat(value) > 0) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Estimated hours must be greater than 0'));
                                    },
                                },
                            ]}
                            className="w-full"
                        >
                            <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                placeholder="Enter estimated hours"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Assigned Date"
                            name="assignedDate"
                            rules={[
                                { required: true, message: "Please select the assigned date" },
                            ]}
                            className="w-full"
                        >
                            <DatePicker className="w-full" />
                        </Form.Item>
                    </div>

                    {/* Add Row Button */}
                    <Button
                        type="dashed"
                        onClick={() => {
                            form
                                .validateFields()
                                .then(() => {
                                    handleAddRow(); // Call handleAddRow only if validation passes
                                })
                                .catch((errorInfo) => {
                                    console.error("Validation Failed:", errorInfo);
                                });
                        }}
                        className="block w-full my-6"
                    >
                        + Add Task
                    </Button>

                    {/* Dynamically Added Rows */}
                    {rows.map((_, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-1 md:grid-cols-4 gap-3  items-center"
                        >
                            <Form.Item
                                label="Project Name"
                                name={`projectName_${index}`}
                                rules={[{ required: true, message: "Please select a project" }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Search or Create Project"
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                    onSelect={handleProjectSelect}
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <Button
                                                type="link"
                                                onClick={showCreateProjectModal}
                                                className="w-full text-left"
                                            >
                                                + Create New Project
                                            </Button>
                                        </>
                                    )}
                                >
                                    {projects.map((project) => (
                                        <Option key={project._id} value={project._id}>
                                            {project.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Task Name"
                                name={`taskName_${index}`}
                                rules={[
                                    { required: true, message: "Please enter a task name" },
                                ]}
                            >
                                <Input placeholder="Enter task name" />
                            </Form.Item>

                            <Form.Item
                                label="Assigned By"
                                name={`assignedBy_${index}`}
                                rules={[{ required: true, message: "Please select or enter the assigner" }]}
                            >
                                <Select
                                    placeholder="Select or enter an assigner"
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
                                                <Input
                                                    placeholder="Type assigner name"
                                                    style={{ flex: 1, marginRight: '8px' }}
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                />
                                                <Button
                                                    type="primary"
                                                    onClick={() => {
                                                        if (inputValue) {
                                                            const newOption = { label: inputValue, value: inputValue };
                                                            const updatedOptions = [
                                                                ...users.map((user) => ({ label: user.username, value: user.email })),
                                                                newOption,
                                                            ];
                                                            setOptions(updatedOptions);
                                                            form.setFieldValue(`assignedBy_${index}`, inputValue);
                                                            setInputValue(''); // Clear the input after adding
                                                        }
                                                    }}
                                                >
                                                    OK
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                >
                                    {users.map((user) => (
                                        <Select.Option key={user.id} value={user.email}>
                                            {user.username}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Button
                                type="primary"
                                danger
                                onClick={() => handleCancelRow(index)} // Add a handler to remove the row
                            >
                                Cancel
                            </Button>
                        </div>
                    ))}
                    {showSubmitButton && (
                        <Form.Item>
                            <Button type="primary" htmlType="submit" className="w-full">
                                Submit
                            </Button>
                        </Form.Item>
                    )}
                </Form>
            </Modal>

            {/* Create Project Modal */}
            <Modal
                title="Create New Project"
                visible={isCreateProjectModalVisible}
                onCancel={handleCreateProjectCancel}
                footer={[
                    <Button key="cancel" onClick={handleCreateProjectCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="create"
                        type="primary"
                        onClick={handleCreateProject}
                        loading={loading}
                    >
                        Create
                    </Button>,
                ]}
            >
                <Input
                    placeholder="Enter project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)} // Update state on input change
                />
            </Modal>
        </div>
    );
};

export default StatusSheet;