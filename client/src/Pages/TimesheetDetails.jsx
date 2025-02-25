//TimesheetDetails
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { server } from '../constant';
import moment from 'moment';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Row, Col, Button, DatePicker, Table, message, TimePicker, Select, Modal } from 'antd';
import useTokenValidation from '../components/UseTockenValidation';

const TimesheetDetails = () => {
    useTokenValidation();
    const { timesheetId } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const location = useLocation();
    const { Option } = Select;
    const [startDate, setStartDate] = useState(null);
    const [canApprove, setCanApprove] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [tableKey, setTableKey] = useState(0);
    const [reloadTrigger, setReloadTrigger] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [newRowKey, setNewRowKey] = useState(null);
    const [username, setUsername] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timesheetData, setTimesheetData] = useState({
        id: null,
        employeeName: '',
        employeeId: '',
        department: '',
        teamLead: '',
        weekStartDate: null,
        weekEndDate: null,
        status: ''
    });
    const [tableData, setTableData] = useState([]);
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(true);
    const [visible, setVisible] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [isDraftSaved, setIsDraftSaved] = useState(true);
    const [allDaysAdded, setAllDaysAdded] = useState(false);
    
    
    const isStatus = ( timesheetData.status==='Pending' || timesheetData.status==='In Progress' || timesheetData.status ==='Approved');

    // New function to check if all required days are present
    const checkAllDaysAdded = (data) => {
        const requiredDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const addedDays = data.map(row => row.day);
        return requiredDays.every(day => addedDays.includes(day));
    };

    useEffect(() => {
        setAllDaysAdded(checkAllDaysAdded(tableData));
        setSubmitDisabled(!allDaysAdded || !isDraftSaved);
    }, [tableData, isDraftSaved, allDaysAdded]);


    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const response = await axios.get(`${server}/api/role`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setUsername(response.data.username)
                setUserRole(response.data.role);
            } catch (error) {
                console.error("Error fetching user role:", error);
            }
        };

        fetchUserRole();
    }, []);

    useEffect(() => {
        const fetchTimesheetData = async () => {
            try {
                console.log('Fetching timesheet data for ID:', timesheetId);

                // Check if it's a new timesheet
                if (timesheetId === 'new') {
                    console.log('Creating new timesheet');
                    if (location.state) {
                        // Use the data passed from the Timesheet component for a new timesheet
                        const { employeeName, employeeId, department, teamLead } = location.state;
                        setTimesheetData(prevData => ({
                            ...prevData,
                            employeeName,
                            employeeId,
                            department,
                            teamLead,
                            status: 'draft',
                        }));
                        form.setFieldsValue({ employeeName, employeeId, department, teamLead });
                    }
                    setCanApprove(false);
                } else {
                    // Fetching data for an existing timesheet
                    console.log('Fetching existing timesheet');
                    const response = await axios.get(`${server}/api/timesheets/${timesheetId}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    });

                    if (response.data.success) {
                        const fetchedTimesheet = response.data.timesheet;
                        console.log('Fetched timesheet:', fetchedTimesheet);

                        // Populate the form and state with fetched timesheet data
                        const newTimesheetData = {
                            id: fetchedTimesheet._id,
                            employeeName: fetchedTimesheet.employeeName,
                            employeeId: fetchedTimesheet.employeeID,
                            department: fetchedTimesheet.department,
                            teamLead: fetchedTimesheet.teamLeadName,
                            weekStartDate: moment(fetchedTimesheet.weekStartDate),
                            weekEndDate: moment(fetchedTimesheet.weekEndDate),
                            status: fetchedTimesheet.status,
                        };

                        setTimesheetData(newTimesheetData);
                        form.setFieldsValue(newTimesheetData);

                        // Set the table data with the timesheet tasks
                        setTableData(
                            fetchedTimesheet.days.flatMap((day, dayIndex) =>
                                day.tasks.map((task, taskIndex) => ({
                                    key: `${dayIndex}-${taskIndex}`,
                                    taskId: task._id,
                                    day: day.dayOfWeek,
                                    taskName: task.taskName,
                                    taskDescription: task.taskDescription,
                                    startTime: task.startTime,
                                    endTime: task.endTime,
                                    breakHours: task.breakHours,
                                    totalhoursworked: task.totalhoursworked,
                                    notes: task.notes,
                                    isEditable: false,
                                }))
                            )
                        );

                        // Set canApprove based on the timesheet status
                        const canApproveStatus = fetchedTimesheet.status === 'In Progress';
                        console.log('Setting canApprove to:', canApproveStatus);
                        setCanApprove(canApproveStatus);
                        // Set isDraftSaved based on the timesheet status
                        setIsDraftSaved(fetchedTimesheet.status !== 'draft');
                        setIsSubmitted(fetchedTimesheet.status === 'In Progress' || fetchedTimesheet.status === 'Approved');
                    }
                }
            } catch (error) {
                console.error('Error fetching timesheet:', error);
                message.error('Failed to fetch timesheet data');
            }
        };

        fetchTimesheetData();
    }, [form, timesheetId, location.state, reloadTrigger]);
    const handleApprove = async () => {
        try {
            const response = await axios.post(
                `${server}/api/timesheet/${timesheetId}/approve`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.message === "Timesheet approved successfully") {
                message.success('Timesheet approved successfully');
                setTimesheetData(prevData => ({ ...prevData, status: 'Approved' }));
                setCanApprove(false);
            } else {
                message.error('Failed to approve timesheet');
            }
        } catch (error) {
            console.error('Error approving timesheet:', error);
            message.error('Failed to approve timesheet');
        }
    };

    const handleAddRow = () => {
        if (!isDraftSaved) {
            message.warning('Please save the draft before adding a new row.');
            return;
        }

        const newKey = `new-${Date.now()}`;
        const newRow = {
            key: newKey,
            taskId: null,
            day: '',
            taskName: '',
            taskDescription: '',
            startTime: '',
            endTime: '',
            breakHours: '',
            totalhoursworked: '',
            notes: '',
            isEditable: true,
        };

        setTableData([...tableData, newRow]);
        setNewRowKey(newKey);
        setIsDraftSaved(false);
    };

    const showModal = (taskId) => {
        console.log("Setting taskToDelete:", taskId);
        setTaskToDelete(taskId);
        setVisible(true);
    };

    const handleOk = async () => {
        console.log("Deleting task with ID:", taskToDelete);
        try {
            await axios.delete(`${server}/api/timesheet/${timesheetId}/task/${taskToDelete}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            message.success('Task deleted successfully');
            setTableData(tableData.filter(row => row.taskId !== taskToDelete));
        } catch (error) {
            console.error('Error deleting task:', error);
            message.error('Failed to delete task');
        } finally {
            setVisible(false);
            setTaskToDelete(null);
        }
    };

    const handleCancel = () => {
        setVisible(false);
        setTaskToDelete(null);
    };

    const handleCancelNewRow = () => {
        if (newRowKey) {
            setTableData(tableData.filter(row => row.key !== newRowKey));
            setNewRowKey(null);
            setIsDraftSaved(true);
        }
    };
    const handleSaveDraft = async () => {
        try {
            const formValues = await form.validateFields();
            const errorMessages = [];

            tableData.forEach((row, index) => {
                if (!row.taskName || !row.startTime || !row.endTime || !row.breakHours || !row.totalhoursworked || !row.notes) {
                    errorMessages.push(`Please enter all the fields`);
                }
            });

            if (errorMessages.length > 0) {
                message.error(errorMessages.join(' '));
                return;
            }

            const updatedData = tableData.map((row) => ({
                ...row,
                isEditable: false,
            }));

            const timesheetPayload = {
                employeeName: formValues.employeeName,
                employeeID: formValues.employeeId,
                department: formValues.department,
                teamLeadName: formValues.teamLead,
                weekStartDate: formValues.weekStartDate.format('YYYY-MM-DD'),
                weekEndDate: formValues.weekEndDate.format('YYYY-MM-DD'),
                status: "Pending",
                days: updatedData.reduce((acc, row) => {
                    const dayIndex = acc.findIndex(day => day.dayOfWeek === row.day);
                    const task = {
                        taskName: row.taskName,
                        taskDescription: row.taskDescription,
                        startTime: row.startTime,
                        endTime: row.endTime,
                        breakHours: row.breakHours,
                        totalhoursworked: row.totalhoursworked,
                        notes: row.notes,
                    };
                    if (dayIndex === -1) {
                        acc.push({ dayOfWeek: row.day, tasks: [task] });
                    } else {
                        acc[dayIndex].tasks.push(task);
                    }
                    return acc;
                }, []),
            };

            let response;
            if (timesheetId === 'new') {
                response = await axios.post(
                    `${server}/api/timesheet`,
                    timesheetPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                const newTimesheetId = response.data.timesheet._id;
                navigate(`/timesheetdetails/${newTimesheetId}`);
            } else {
                response = await axios.put(
                    `${server}/api/timesheet/${timesheetId}`,
                    timesheetPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
            }

            if (response.data.message === "Timesheet submitted successfully" || response.data.message === "Timesheet updated successfully") {
                message.success('Timesheet saved successfully');

                // Update all relevant states
                setTimesheetData({
                    ...timesheetData,
                    ...timesheetPayload,
                    status: 'Pending'
                });
                setTableData(updatedData);
                setIsDraftSaved(true);
                setNewRowKey(null);
                setIsFormDisabled(false);
                setSubmitDisabled(false);

                // Force re-render of form and table
                setFormKey(prevKey => prevKey + 1);
                setTableKey(prevKey => prevKey + 1);

                // Re-evaluate if all days are added
                setAllDaysAdded(checkAllDaysAdded(updatedData));

                // Force a re-fetch of data
                setReloadTrigger(prev => !prev);
            } else {
                message.error('Failed to save timesheet');
            }
        } catch (error) {
            console.error('Error saving timesheet:', error);
            message.error('Failed to save timesheet');
        }
    };
    const handleRowChange = (index, key, value) => {
        const newData = [...tableData];
        newData[index][key] = value;
        setTableData(newData);
    };
    const handleEditSave = async (record) => {
        const index = tableData.findIndex(item => item.key === record.key);
        const updatedData = [...tableData];

        if (record.isEditable) {
            // Save changes
            try {
                const taskData = {
                    dayOfWeek: record.day,
                    taskName: record.taskName,
                    taskDescription: record.taskDescription,
                    startTime: record.startTime,
                    endTime: record.endTime,
                    breakHours: record.breakHours,
                    totalhoursworked: record.totalhoursworked,
                    notes: record.notes,
                };

                let response;
                if (record.taskId) {
                    // If taskId exists, update the task
                    response = await axios.put(
                        `${server}/api/timesheet/${timesheetId}/task/${record.taskId}`,
                        taskData,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                            },
                        }
                    );
                } else {
                    // Else, create the task if taskId is null (new row)
                    response = await axios.post(
                        `${server}/api/timesheet/${timesheetId}/task`,
                        taskData,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                            },
                        }
                    );
                }

                if (response.data.message === "Task updated successfully" || response.data.message === "Task created successfully") {
                    message.success(response.data.message);
                    updatedData[index] = {
                        ...updatedData[index],
                        isEditable: false,
                        taskId: response.data.taskId || updatedData[index].taskId,
                    };
                    setTableData(updatedData);
                    if (record.key === newRowKey) {
                        setNewRowKey(null);
                        setIsDraftSaved(true);
                    }
                } else {
                    message.error('Failed to update/create task');
                }
            } catch (error) {
                console.error('Error updating/creating task:', error);
                message.error('Failed to update/create task');
            }
        } else {
            // Enter edit mode
            updatedData[index].isEditable = true;
            setTableData(updatedData);
        }
    };


    useEffect(() => {
        const requiredDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const addedDays = tableData.map(row => row.day);
        const allDaysAdded = requiredDays.every(day => addedDays.includes(day));
        setSubmitDisabled(!allDaysAdded);
    }, [tableData]);

    const columns = [
        {
            title: 'Day of Week',
            dataIndex: 'day',
            key: 'day',
            render: (text, record, index) =>
                record.isEditable ? (
                    <Select
                        value={text}
                        onChange={(value) => handleRowChange(index, 'day', value)}
                        placeholder="Select day"
                        style={{ width: '120px' }}
                    >
                        <Option value="Monday">Monday</Option>
                        <Option value="Tuesday">Tuesday</Option>
                        <Option value="Wednesday">Wednesday</Option>
                        <Option value="Thursday">Thursday</Option>
                        <Option value="Friday">Friday</Option>
                    </Select>
                ) : (
                    <span>{text}</span>
                ),
        },
        {
            title: 'Task Name',
            dataIndex: 'taskName',
            key: 'taskName',
            render: (text, record, index) =>
                record.isEditable ? (
                    <Input
                        value={text}
                        onChange={(e) => handleRowChange(index, 'taskName', e.target.value)}
                        placeholder="Enter task name"
                    />
                ) : (
                    <div style={{ maxWidth: '100px', overflow: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
                        {text}
                    </div>
                ),
        },
        {
            title: 'Task Description',
            dataIndex: 'taskDescription',
            key: 'taskDescription',
            render: (text, record, index) =>
                record.isEditable ? (
                    <Input
                        value={text}
                        onChange={(e) => handleRowChange(index, 'taskDescription', e.target.value)}
                        placeholder="Enter task description"
                    />
                ) : (
                    <div style={{ maxWidth: '100px', overflow: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
                        {text}
                    </div>
                ),
        },
        {
            title: 'Start Time',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (text, record, index) =>
                record.isEditable ? (
                    <TimePicker
                        value={text ? moment(text, 'HH:mm') : null}
                        onChange={(time, timeString) => handleRowChange(index, 'startTime', timeString)}
                        format="HH:mm"
                        placeholder="Select start time"
                    />
                ) : (
                    <span>{text}</span>
                ),
        },
        {
            title: 'End Time',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (text, record, index) =>
                record.isEditable ? (
                    <TimePicker
                        value={text ? moment(text, 'HH:mm') : null}
                        onChange={(time, timeString) => handleRowChange(index, 'endTime', timeString)}
                        format="HH:mm"
                        placeholder="Select end time"
                    />
                ) : (
                    <span>{text}</span>
                ),
        },
        {
            title: 'Break Hours',
            dataIndex: 'breakHours',
            key: 'breakHours',
            render: (text, record, index) =>
                record.isEditable ? (
                    <Input
                        value={text}
                        onChange={(e) => handleRowChange(index, 'breakHours', e.target.value)}
                        placeholder="Enter break hours"
                    />
                ) : (
                    <span>{text}</span>
                ),
        },
        {
            title: 'Total Hours Worked',
            dataIndex: 'totalhoursworked',
            key: 'totalhoursworked',
            render: (text, record, index) =>
                record.isEditable ? (
                    <Input
                        value={text}
                        onChange={(e) => handleRowChange(index, 'totalhoursworked', e.target.value)}
                        placeholder="Enter total hours worked"
                    />
                ) : (
                    <span>{text}</span>
                ),
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
            render: (text, record, index) =>
                record.isEditable ? (
                    <Input
                        value={text}
                        onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        placeholder="Enter notes"
                    />
                ) : (
                    <div style={{ maxWidth: '100px', overflow: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
                        {text}
                    </div>
                ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (text, record) => (
                <div>
                    {isDraftSaved && record.key !== newRowKey && (
                        <>
                            <Button
                                type="primary"
                                onClick={() => handleEditSave(record)}
                                style={{ marginRight: '8px' }}
                                disabled={isSubmitted}


                            >
                                {record.isEditable ? 'Save' : 'Edit'}
                            </Button>
                            {!record.isEditable && (
                                <Button
                                    type="danger"
                                    onClick={() => showModal(record.taskId)}
                                    style={{ color: 'red' }}
                                    disabled={isSubmitted}
                                >
                                    Delete
                                </Button>
                            )}
                        </>
                    )}
                    {record.key === newRowKey && (
                        <Button
                            type="default"
                            onClick={handleCancelNewRow}
                            style={{ marginRight: '8px' }}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            ),
        },
    ];


    const handleSubmit = async () => {
        try {
            const formValues = await form.validateFields();
            const updatedData = tableData.map((row) => ({
                ...row,
                isEditable: false,
            }));
            setTableData(updatedData);

            const timesheetPayload = {
                employeeName: formValues.employeeName,
                employeeID: formValues.employeeId,
                department: formValues.department,
                teamLeadName: formValues.teamLead,
                weekStartDate: formValues.weekStartDate.format('YYYY-MM-DD'),
                weekEndDate: formValues.weekEndDate.format('YYYY-MM-DD'),
                days: updatedData.reduce((acc, row) => {
                    const dayIndex = acc.findIndex(day => day.dayOfWeek === row.day);
                    const task = {
                        taskName: row.taskName,
                        taskDescription: row.taskDescription,
                        startTime: row.startTime,
                        endTime: row.endTime,
                        breakHours: row.breakHours,
                        totalhoursworked: row.totalhoursworked,
                        notes: row.notes,
                    };
                    if (dayIndex === -1) {
                        acc.push({ dayOfWeek: row.day, tasks: [task] });
                    } else {
                        acc[dayIndex].tasks.push(task);
                    }
                    return acc;
                }, []),
            };

            let response;
            if (timesheetId === 'new') {
                // Create a new timesheet
                response = await axios.post(
                    `${server}/api/timesheet`,
                    timesheetPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                const newTimesheetId = response.data.timesheet._id;

                // Submit the newly created timesheet
                await axios.post(
                    `${server}/api/timesheet/${newTimesheetId}/submit`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                navigate(`/timesheetdetails/${newTimesheetId}`);
            } else {
                // Update existing timesheet
                await axios.put(
                    `${server}/api/timesheet/${timesheetId}`,
                    timesheetPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                // Submit the updated timesheet
                response = await axios.post(
                    `${server}/api/timesheet/${timesheetId}/submit`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
            }

            if (response.data.message === "Timesheet submitted successfully") {
                message.success('Timesheet submitted successfully with "Inprogress" status');
                setIsFormDisabled(true);
                setTimesheetData(prevData => ({ ...prevData, status: 'inprogress' }));
            } else {
                message.error('Failed to submit timesheet');
            }
        } catch (error) {
            console.error('Error submitting timesheet:', error);
            message.error('Failed to submit timesheet');
        }
    };


    // // // Function to handle start date change and set end date
    const handleStartDateChange = (date) => {
        if (date) {
            const selectedDate = date.clone(); // Keep it as a moment object

            // Find the Monday of the week (Week Start Date)
            const startOfWeek = selectedDate.clone().day(1); // Monday as start of the week

            // Find the Friday of the week (Week End Date)
            const endOfWeek = selectedDate.clone().day(5); // Friday as end of the week

            // Set the start and end dates in the form
            form.setFieldsValue({
                weekStartDate: startOfWeek,
                weekEndDate: endOfWeek,
            });
        } else {
            form.resetFields(['weekStartDate', 'weekEndDate']);
        }
    };


    // Disable weekends (Saturday and Sunday) for the start date picker
    const disabledStartDate = (current) => {
        // Disable past dates and weekends (Saturday=6, Sunday=0)
        return current && (current.day() === 0 || current.day() === 6);
    };

    // Disable end date picker (it will always be auto-calculated)
    const disabledEndDate = () => true;

    return (
        <div className="p-4">
            <Modal
                title="Confirm Deletion"
                visible={visible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Yes"
                cancelText="No"
            >
                <p>Are you sure you want to delete this task?</p>
            </Modal>
            <h1 className="text-2xl font-bold mb-4">Enter Timesheet</h1>
            <Form form={form} onFinish={handleSubmit} layout="vertical" initialValues={timesheetData}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Employee Name"
                            name="employeeName"
                            rules={[{ required: true, message: 'Please enter employee name!' }]}
                            style={{ width: '100%' }}
                        >
                            <Input disabled={isFormDisabled || isStatus} placeholder="Enter Employee Name" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Employee ID"
                            name="employeeId"
                            rules={[{ required: true, message: 'Please enter employee ID!' }]}
                            style={{ width: '100%' }}
                        >
                            <Input disabled={isFormDisabled || isStatus} placeholder="Enter Employee ID" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Department"
                            name="department"
                            rules={[{ required: true, message: 'Please enter department!' }]}
                            style={{ width: '100%' }}
                        >
                            <Input disabled={isFormDisabled || isStatus} placeholder="Enter Department" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Team Lead"
                            name="teamLead"
                            rules={[{ required: true, message: 'Please enter team lead name!' }]}
                            style={{ width: '100%' }}
                        >
                            <Input disabled={isFormDisabled || isStatus} placeholder="Enter Team Lead Name" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Week Start Date"
                            name="weekStartDate"
                            rules={[{ required: true, message: 'Please select week start date!' }]}
                            style={{ width: '100%' }}
                        >
                            <DatePicker
                                disabled={isFormDisabled || isStatus}
                                placeholder="Select Week Start Date"
                                style={{ width: '100%' }}
                                onChange={handleStartDateChange}
                                disabledDate={disabledStartDate} // Disable weekends for start date
                                format="YYYY-MM-DD" // Define date format for the DatePicker
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Week End Date"
                            name="weekEndDate"
                            rules={[{ required: true, message: 'Please select week end date!' }]}
                            style={{ width: '100%' }}
                        >
                            <DatePicker
                                disabled={isFormDisabled || isStatus}
                                placeholder="Select Week End Date"
                                style={{ width: '100%' }}
                                disabledDate={disabledEndDate} // End date is auto-calculated
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24} style={{ textAlign: 'right' }}>
                        {timesheetData.employeeName === username && (
                            <Button
                                type="primary"
                                htmlType="button"
                                onClick={handleAddRow}
                                style={{ marginRight: '8px', backgroundColor: 'green' }}
                                disabled={!isDraftSaved || timesheetData.status === 'In Progress' || timesheetData.status === 'Approved'}
                            >
                                Add Row
                            </Button>
                        )}
                        {timesheetData.employeeName === username && (
                            <Button
                                type="primary"
                                onClick={handleSubmit}
                                disabled={submitDisabled || isFormDisabled || timesheetData.status === 'In Progress' || timesheetData.status === 'Approved'}
                                style={{ marginRight: '8px' }}
                            >
                                Submit
                            </Button>
                        )}
                        {timesheetData.employeeName === username && (
                            <Button
                                type="default"
                                htmlType="button"
                                onClick={handleSaveDraft}
                                disabled={isDraftSaved}
                            >
                                Save Draft
                            </Button>
                        )}
                        {userRole === 'ADMIN' && (
                            <Button
                                type="primary"
                                onClick={handleApprove}
                                style={{ marginLeft: '10px', backgroundColor: 'blue' }}
                                disabled={timesheetData.status === 'Approved' || timesheetData.status === 'Pending'}
                            >
                                Approve
                            </Button>
                        )}
                    </Col>
                </Row>
            </Form>
            <Table
                dataSource={tableData}
                columns={columns}
                pagination={false}
                style={{ marginTop: '20px' }}
                rowKey="key"
                key={tableKey}
            />
        </div>
    );
};

export default TimesheetDetails;
