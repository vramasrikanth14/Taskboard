import React, { useState, useEffect } from "react";
import axios from "axios";
import { Layout, Select, Table, Typography, Space } from "antd";
import { server } from "../constant";
import useTokenValidation from "./UseTockenValidation";


const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const AuditLog = () => {
 useTokenValidation();
  const [selectedProject, setSelectedProject] = useState("");
  const [userRole, setUserRole] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cards, setCards] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const { Title, Text } = Typography;

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

  const fetchProjects = async (organizationId) => {
    try {
      const projectsResponse = await axios.get(
        `${server}/api/projects/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProjects(projectsResponse.data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTasksAndCards = async (projectId) => {
    try {
      const tasksResponse = await axios.get(
        `${server}/api/projects/${projectId}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setTasks(tasksResponse.data.tasks);

      const cardsPromises = tasksResponse.data.tasks.map((task) =>
        axios.get(`${server}/api/tasks/${task.id}/cards`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
      );
      const cardsResponses = await Promise.all(cardsPromises);
      const allCards = cardsResponses.flatMap(
        (response) => response.data.cards
      );
      setCards(allCards);
    } catch (error) {
      console.error("Error fetching tasks and cards:", error);
    }
  };

  const fetchAuditLogs = async (projectId) => {
    try {
      const response = await axios.get(
        `${server}/api/projects/${projectId}/audit-logs`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const logsWithNames = response.data.map((log) => ({
        ...log,
        taskName: log.taskId ? log.taskId.name : null,
        cardName: log.cardId ? log.cardId.name : null,
      }));

      const sortedLogs = logsWithNames.sort(
        (a, b) => new Date(b.actionDate) - new Date(a.actionDate)
      );

      setAuditLogs(sortedLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    if (projectId) {
      fetchTasksAndCards(projectId);
      fetchAuditLogs(projectId);
    } else {
      setTasks([]);
      setCards([]);
      setAuditLogs([]);
    }
  };

  const columns = [
    // {
    //   title: "Project Name",
    //   dataIndex: "projectName",
    //   key: "projectName",
    //   render: () => projects.find((p) => p._id === selectedProject)?.name,
    // },
    {
      title: "Project Name",
      dataIndex: "projectName",
      key: "projectName",
      render: () => (
        <div style={{ maxWidth: '100px', overflow: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
          {projects.find((p) => p._id === selectedProject)?.name}
        </div>
      ),
    },
    // {
    //   title: "Task Name",
    //   dataIndex: "taskName",
    //   key: "taskName",
    //   render: (_, record) => 
    //     (record.entityType === "Task" || record.entityType === "Card") &&
    //     (record.taskName || record.cardName || `#${record.entityId.slice(-6)}`),
    // },
    {
      title: "Column Name",
      dataIndex: "taskName",
      key: "taskName",
      render: (_, record) => (
        (record.entityType === "Task" || record.entityType === "Card") && (
          <div style={{ maxWidth: '100px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
            {record.taskName || record.cardName || `#${record.entityId.slice(-6)}`}
          </div>
        )
      ),
    },
    // {
    //   title: "Card Name",
    //   dataIndex: "cardName",
    //   key: "cardName",
    //   render: (_, record) =>
    //     record.entityType === "Card" &&
    //     (record.cardName || `#${record.entityId.slice(-6)}`),
    // },
    {
      title: "Task Name",
      dataIndex: "cardName",
      key: "cardName",
      render: (_, record) => (
        record.entityType === "Card" && (
          <div style={{ maxWidth: '100px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
            {record.cardName || `#${record.entityId.slice(-6)}`}
          </div>
        )
      ),
    },

    {
      title: "Action By",
      dataIndex: "performedBy",
      key: "performedBy",
    },
    {
      title: "Activity Date",
      dataIndex: "actionDate",
      key: "actionDate",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Activity",
      dataIndex: "actionType",
      key: "actionType",
    },
    // {
    //   title: "Old Value",
    //   dataIndex: "oldValue",
    //   key: "oldValue",
    //   render: (_, record) =>
    //     record.changes.length > 0 && (
    //       <div>
    //         {record.changes[0].field}: {JSON.stringify(record.changes[0].oldValue)}
    //       </div>
    //     ),
    // },
    {
      title: "Old Value",
      dataIndex: "oldValue",
      key: "oldValue",
      render: (_, record) =>
        record.changes.length > 0 && (
          <div style={{ maxWidth: '100px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
            {record.changes[0].field}: {JSON.stringify(record.changes[0].oldValue)}
          </div>
        ),
    },
    {
      title: "New Value",
      dataIndex: "newValue",
      key: "newValue",
      render: (_, record) =>
        record.changes.length > 0 && (
          <div style={{ maxWidth: '100px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
            {record.changes[0].field}: {JSON.stringify(record.changes[0].newValue)}
          </div>
        ),
    },
  ];

  return (
    <Layout>
      <Content style={{ padding: "24px", backgroundColor: "white" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={4}>Audit Logs</Title>
            <Select
              style={{ width: 200 }}
              placeholder="Select a Project"
              onChange={handleProjectChange}
              value={selectedProject}
            >
              <Option value="">Select a Project</Option>
              {projects.map((project) => (
                <Option key={project._id} value={project._id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </div>

          {selectedProject ? (
            <Table
              columns={columns}
              dataSource={auditLogs}
              rowKey="_id"
              pagination={{ pageSize: 8 }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Text strong style={{ fontSize: 18 }}>
                No project selected. Please select a project.
              </Text>
            </div>
          )}
        </Space>
      </Content>
    </Layout>
  );
};

export default AuditLog;
