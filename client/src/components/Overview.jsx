import React, { useEffect, useState } from 'react';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card } from 'antd';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale, // Import CategoryScale
  LinearScale,
  BarElement
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

import { server } from '../constant';
import useTokenValidation from './UseTockenValidation';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Overview = () => {
  useTokenValidation();
  const [userRole, setUserRole] = useState("");
  const [organizationId, setOrganizationId] = useState(null);
  const [overviewData, setOverviewData] = useState({
    totalProjects: 0,
    totalTasks: 0,
    totalMembers: 0,
    totalCards: 0,
    projects: []
  });
  const [users, setUsers] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, inProgress: 0, completed: 0 });
  const [totalCardCount, setTotalCardCount] = useState(0);
  const [userCardCounts, setUserCardCounts] = useState({
    pending: 0,
    inprogress: 0,
    completed: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [cards, setCards] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRoleAndOrganization = async () => {
      try {
        const response = await axios.get(`${server}/api/role`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        // console.log("Role and Organization ID Response:", response.data);
        setUserRole(response.data.role);
        setOrganizationId(response.data.organizationId);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRoleAndOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      axios.get(`${server}/api/overview/${organizationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(response => {
          // console.log("Overview Data Response:", response.data);
          setOverviewData(response.data);
        })
        .catch(error => {
          console.error('There was an error fetching the overview data!', error);

        });




      axios.get(`${server}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(response => {
          // console.log("Users Data Response:", response.data);
          setUsers(response.data.users);
        })
        .catch(error => {
          console.error('There was an error fetching the users!', error);
        });
    }

  }, [organizationId]);

  const handleUserChange = async (event) => {
    const userId = event.target.value;
    setSelectedUser(userId);

    if (userId) {
      try {
        const response = await axios.get(`${server}/api/cards/user/${userId}`);
        const userCards = response.data;
        setCards(userCards);

        // Calculate card counts for the selected user
        const counts = userCards.reduce((acc, card) => {
          acc[card.status] = (acc[card.status] || 0) + 1;
          return acc;
        }, {});

        setTotalCardCount(userCards.length); // Total cards for the selected user
        setUserCardCounts({
          pending: counts['pending'] || 0,
          inprogress: counts['inprogress'] || 0,
          completed: counts['completed'] || 0,
        });

        // Render the bar chart when cards data changes
        setGroupedData(groupByMonthAndStatus(userCards));

      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    } else {
      setCards([]);
      setUserCardCounts({
        pending: 0,
        inprogress: 0,
        completed: 0,
      });
      setTotalCardCount(0);
      setGroupedData({});
    }
  };





  // Calculate sums for the pie chart
  const totalCards = overviewData.projects.reduce((acc, project) => acc + project.totalCards, 0);
  const totalPendingCards = overviewData.projects.reduce((acc, project) => acc + project.totalPendingCards, 0);
  const totalInProgressCards = overviewData.projects.reduce((acc, project) => acc + project.totalInProgressCards, 0);
  const totalCompletedCards = overviewData.projects.reduce((acc, project) => acc + project.totalCompletedCards, 0);
  const noDataColor = '#e5e7eb';

  const data = {
    labels: ['Pending', 'In-Progress', 'Completed'],
    datasets: [
      {
        label: 'Cards Overview',
        data: totalCards ? [totalPendingCards, totalInProgressCards, totalCompletedCards] : [1],
        backgroundColor: totalCards ? ['#f7665a', ' #efe152', '#10b981'] : [noDataColor], // Yellow for Pending, Orange for In Progress, Green for Completed
      }

    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
    },
  };

  const data1 = {
    labels: ['Pending', 'In-Progress', 'Completed'],
    datasets: [
      {
        label: 'User Cards Overview',
        data: totalCardCount ? [userCardCounts.pending, userCardCounts.inprogress, userCardCounts.completed] : [1],
        backgroundColor: totalCardCount ? ['#f7665a', ' #efe152', '#10b981'] : [noDataColor],
      },
    ],
  };




  const handleViewProjectTasks = (projectId) => {
    navigate(`/projects/${projectId}/view`);
  };

  // Function to group user cards by month and status for bar chart
  const groupByMonthAndStatus = (cards) => {
    const result = {};

    cards.forEach((card) => {
      const date = new Date(card.assignDate); // Use assignDate field
      const month = date.toLocaleString('default', { month: 'long' });
      const status = card.status.toLowerCase();

      if (!result[month]) {
        result[month] = { pending: 0, inprogress: 0, completed: 0 };
      }

      result[month][status] = (result[month][status] || 0) + 1;
    });

    return result;
  };

  // Prepare data for bar chart
  const [groupedData, setGroupedData] = useState({});
  const months = Object.keys(groupedData);
  const pendingData = months.map((month) => groupedData[month].pending);
  const inprogressData = months.map((month) => groupedData[month].inprogress);
  const completedData = months.map((month) => groupedData[month].completed);


  const barData = {
    labels: months,
    datasets: [
      {
        label: 'Pending',
        data: pendingData,
        backgroundColor: '#f7665a',
      },
      {
        label: 'In-Progress',
        data: inprogressData,
        backgroundColor: '#efe152',
      },
      {
        label: 'Completed',
        data: completedData,
        backgroundColor: '#10b981',
      },
    ],
  };

  const defaultDoughnutData = {
    labels: ['No Data'],
    datasets: [
      {
        data: [100],
        backgroundColor: ['#e2e8f0'], // Default color
      },
    ],
  };

  const defaultBarData = {
    labels: ['No Data'],
    datasets: [
      {
        label: 'No Data',
        data: [100],
        backgroundColor: '#e2e8f0', // Default color
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Card Status by Month',
      },
    },
  };


  if (overviewData.projects.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <h2 style={{ color: '#4a5568', fontSize: '24px', fontWeight: '600' }}>
          In the organization, there are no projects.
        </h2>
      </div>
    );
  }
  


  return (
    <div style={{ padding: '24px', backgroundColor: '#f7fafc', fontWeight: '600' }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
        {/* First Column - 4 Cards */}
        <div style={{ flex: 0.65 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
    <div
      style={{
        backgroundColor: 'white',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        borderRadius: '24px',
        padding: '10px',
        textAlign: 'center',
        width: '48%', // Adjusted to ensure both cards have the same width
        minWidth: '240px', // Prevent cards from collapsing below a certain width
        height: '140px',
        flexGrow: 1, // Prevent collapse
      }}
    >
      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#4a5568' }}>
        Total Projects
      </h3>
      <p style={{ marginTop: '16px', fontSize: '36px', fontWeight: '700', color: '#3b82f6' }}>
        +{overviewData.totalProjects}
      </p>
    </div>
    <div
      style={{
        backgroundColor: 'white',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        borderRadius: '24px',
        padding: '10px',
        textAlign: 'center',
        width: '48%', // Same width as the first card
        minWidth: '240px',
        height: '140px',
        flexGrow: 1,
      }}
    >
      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#4a5568' }}>
        Total Members
      </h3>
      <p style={{ marginTop: '16px', fontSize: '36px', fontWeight: '700', color: '#3b82f6' }}>
        +{overviewData.totalMembers}
      </p>
    </div>
  </div>
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
    <div
      style={{
        backgroundColor: 'white',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        borderRadius: '24px',
        padding: '10px',
        textAlign: 'center',
        width: '48%',
        minWidth: '240px',
        height: '140px',
        flexGrow: 1,
      }}
    >
      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#4a5568' }}>
        Total Tasks
      </h3>
      <p style={{ marginTop: '16px', fontSize: '36px', fontWeight: '700', color: '#3b82f6' }}>
        +{overviewData.totalCards}
      </p>
    </div>
    <div
      style={{
        backgroundColor: 'white',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        borderRadius: '24px',
        padding: '10px',
        textAlign: 'center',
        width: '48%',
        minWidth: '240px',
        height: '140px',
        flexGrow: 1,
      }}
    >
      <Pie data={data} options={options} />
    </div>
  </div>
</div>

        </div>

        {/* Second Column - User Details, Doughnut Chart, Bar Plot */}
        <div style={{ flex: 0.35 }}>
          <Card
            style={{ width: '100%', padding: '16px', height: '300px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '24px', }}
            bodyStyle={{ padding: '0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#4a5568' }}>User Details</h3>
              <select
                onChange={handleUserChange}
                value={selectedUser || ''}
                style={{ padding: '8px', fontSize: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: '100%' }}>
              <Doughnut data={selectedUser ? data1 : defaultDoughnutData} options={options} />
            </div>
          </Card>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#4a5568', marginBottom: '16px' }}>
          Project Details
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ maxHeight: '370px', overflowY: 'auto', scrollbarWidth: 'none' }}>
            <table
              style={{
                width: '100%',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontWeight: '600',
              }}
            >
              <thead className="top-0 z-10 sticky bg-gray-100">
                <tr>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left font-normal">
                    Project Name
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left font-normal">
                    Project Members
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left font-normal">
                    Total Tasks
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left font-normal">
                    Pending Tasks
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left font-normal">
                    In-Progress Tasks
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left font-normal">
                    Completed Tasks
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 text-left font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.projects.map((project, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#f7fafc' : 'white',
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = '#edf2f7')
                    }
                    onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      index % 2 === 0 ? '#f7fafc' : 'white')
                    }
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      {project.name}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      {project.projectMembers.length}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      {project.totalCards}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      {project.totalPendingCards}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      {project.totalInProgressCards}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      {project.totalCompletedCards}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                      <button
                        style={{ backgroundColor: '#3b82f6', color: 'white', padding: '4px 12px', borderRadius: '8px' }}
                        onClick={() => handleViewProjectTasks(project.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

};

export default Overview;