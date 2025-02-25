// // // //timesheet.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Table, Button, Dropdown, Menu, DatePicker, AutoComplete, Input, message } from 'antd';
import { FilterOutlined, SortAscendingOutlined, SortDescendingOutlined, SearchOutlined } from '@ant-design/icons';
import { server } from '../constant';
import useTokenValidation from '../components/UseTockenValidation';

const Timesheet = () => {
    useTokenValidation();
    const navigate = useNavigate();
    const [timesheetIds, setTimesheetIds] = useState([]);
    const [sortedData, setSortedData] = useState([]);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [filters, setFilters] = useState({
        weekStartDate: null,
        weekEndDate: null,
    });

    useEffect(() => {
        const fetchTimesheetIds = async () => {
            try {
                const response = await axios.get(`${server}/api/timesheets`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                if (response.data.success && response.data.timesheets.length > 0) {
                    setTimesheetIds(response.data.timesheets);
                    setSortedData(response.data.timesheets);
                }
            } catch (error) {
                console.error('Error fetching timesheet IDs:', error);
            }
        };

        fetchTimesheetIds();
    }, []);

    // const handleAddTimesheet = () => {
    //     navigate('/timesheetdetails/new');
    // };
    const handleAddTimesheet = async () => {
        try {
            // Fetch logged-in user data
            const response = await axios.get(`${server}/api/user`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.data.success) {
                const userData = response.data.user;
                navigate('/timesheetdetails/new', {
                    state: {
                        employeeName: userData.username,
                        employeeId: userData.employeeId,
                        department: userData.department,
                        teamLead: userData.teamLead
                    }
                });
            } else {
                console.error('Failed to fetch user data');
                message.error('Failed to fetch user data');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            message.error('Error fetching user data');
        }
    };

    const handleSort = (field, order) => {
        const sorted = [...sortedData].sort((a, b) => {
            if (order === 'ascend') {
                return a[field].localeCompare(b[field]);
            } else {
                return b[field].localeCompare(a[field]);
            }
        });
        setSortedData(sorted);
    };

    const handleDateSort = (field, order) => {
        const sorted = [...sortedData].sort((a, b) => {
            if (order === 'ascend') {
                return new Date(a[field]) - new Date(b[field]);
            } else {
                return new Date(b[field]) - new Date(a[field]);
            }
        });
        setSortedData(sorted);
    };

    const handleDateFilter = (date, dateType) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [dateType]: date,
        }));

        const filteredData = timesheetIds.filter(timesheet => {
            const startDate = new Date(timesheet.weekStartDate);
            const endDate = new Date(timesheet.weekEndDate);

            if (dateType === 'weekStartDate' && date) {
                return startDate.toDateString() === date.toDate().toDateString();
            }
            if (dateType === 'weekEndDate' && date) {
                return endDate.toDateString() === date.toDate().toDateString();
            }
            return true;
        });

        setSortedData(filteredData);
    };

    const createMenu = (field, isDate = false) => (
        <Menu>
            <Menu.Item key="1" icon={<SortAscendingOutlined />} onClick={() => {
                if (isDate) handleDateSort(field, 'ascend');
                else handleSort(field, 'ascend');
            }}>
                Sort Ascending
            </Menu.Item>
            <Menu.Item key="2" icon={<SortDescendingOutlined />} onClick={() => {
                if (isDate) handleDateSort(field, 'descend');
                else handleSort(field, 'descend');
            }}>
                Sort Descending
            </Menu.Item>
        </Menu>
    );

    // Function to handle the search suggestions
    const handleSearch = (value) => {
        if (value) {
            // Filter data based on the input and show suggestions
            const options = timesheetIds
                .filter(item =>
                    item._id.includes(value) || item.employeeName.includes(value)
                )
                .map(item => ({
                    label: (
                        <div>
                            <strong>Timesheet ID:</strong> {item._id}<br />
                            <strong>Employee Name:</strong> {item.employeeName}
                        </div>
                    ),
                    value: item._id, // You can use this to navigate when selected
                }));

            setFilteredOptions(options);
        } else {
            setFilteredOptions([]);
        }
    };

    // Function to handle selection from suggestions
    const handleSelect = (value) => {
        // When a suggestion is selected, filter the table to show the matching timesheet ID
        const filteredData = timesheetIds.filter(item => item._id === value);
        setSortedData(filteredData);
    };

    const columns = [

        {
            title: (<span>
                Employee ID
                <Dropdown overlay={createMenu('employeeID')} trigger={['click']}>
                    <FilterOutlined style={{ marginLeft: 8, cursor: 'pointer' }} />
                </Dropdown>
            </span>
            ),
            dataIndex: 'employeeID',
            key: 'employeeID'
        },
        {
            title: (
                <span>
                    Timesheet ID
                    <Dropdown overlay={createMenu('_id')} trigger={['click']}>
                        <FilterOutlined style={{ marginLeft: 8, cursor: 'pointer' }} />
                    </Dropdown>
                </span>
            ),
            dataIndex: '_id',
            key: '_id',
            render: (text) => (
                <a href={`/timesheetdetails/${text}`} className="text-blue-500 hover:underline">
                    {text}
                </a>
            ),
        },
        {
            title: (
                <span>
                    Employee Name
                    <Dropdown overlay={createMenu('employeeName')} trigger={['click']}>
                        <FilterOutlined style={{ marginLeft: 8, cursor: 'pointer' }} />
                    </Dropdown>
                </span>
            ),
            dataIndex: 'employeeName',
            key: 'employeeName',
        },
        {
            title: (
                <span>
                    Week Start Date
                    <DatePicker
                        style={{ marginLeft: 8 }}
                        onChange={(date) => handleDateFilter(date, 'weekStartDate')}
                    />
                    <Dropdown overlay={createMenu('weekStartDate', true)} trigger={['click']}>
                        <FilterOutlined style={{ marginLeft: 8, cursor: 'pointer' }} />
                    </Dropdown>
                </span>
            ),
            dataIndex: 'weekStartDate',
            key: 'weekStartDate',
            render: (date) => new Date(date).toLocaleDateString('en-IN'),
        },
        {
            title: (
                <span>
                    Week End Date
                    <DatePicker
                        style={{ marginLeft: 8 }}
                        onChange={(date) => handleDateFilter(date, 'weekEndDate')}
                    />
                    <Dropdown overlay={createMenu('weekEndDate', true)} trigger={['click']}>
                        <FilterOutlined style={{ marginLeft: 8, cursor: 'pointer' }} />
                    </Dropdown>
                </span>
            ),
            dataIndex: 'weekEndDate',
            key: 'weekEndDate',
            render: (date) => new Date(date).toLocaleDateString('en-IN'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Pending', value: 'Pending' },
                { text: 'In Progress', value: 'In Progress' },
                { text: 'Approved', value: 'Approved' }
            ],
            onFilter: (value, record) => record.status === value,
        }
    ];

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Timesheet</h1>

            {/* Search Input with Suggestions */}
            <AutoComplete
                options={filteredOptions}
                onSelect={handleSelect}
                onSearch={handleSearch}
                style={{ width: 300, marginBottom: 16 }}
            >
                <Input
                    placeholder="Search Timesheet ID or Employee Name"
                    prefix={<SearchOutlined />}
                />
            </AutoComplete>

            <div className="flex justify-end mb-4">
                <Button type="primary" onClick={handleAddTimesheet}>
                    Add Timesheet
                </Button>
            </div>

            <Table dataSource={sortedData} columns={columns} rowKey="_id" />
        </div>
    );
};

export default Timesheet;




