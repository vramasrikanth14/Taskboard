import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { server } from "../constant";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { Input, Button, Table, Modal, notification } from "antd";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

  const TeamMembersPage = () => {
  const location = useLocation();
  const { teamName, organizationId, teamId } = location.state || {};
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [addMemberError, setAddMemberError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const fetchUserRoleAndOrganization = async () => {
    try {
      const response = await axios.get(`${server}/api/role`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setUserRole(response.data.role);
    } catch (error) {
      console.error("Error fetching user role and organization:", error);
    }
  };
  useEffect(() => {
    fetchUserRoleAndOrganization();
  }, []);

  // Extract fetchMembers to be reused
  const fetchMembers = async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await axios.get(
        `${server}/api/organizations/${organizationId}/teams/${teamId}/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMembers(response.data.users || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching members:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []); // Empty dependency array to run once when component mounts

  const handleUsernameChange = async (event) => {
    setNewMemberUsername(event.target.value);
    if (event.target.value.length > 0) {
      try {
        const response = await axios.get(`${server}/api/users/search`, {
          params: { username: event.target.value, fields: "username status name" },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUsernameSuggestions(response.data.users || []);
      } catch (error) {
        console.error("Error fetching username suggestions:", error);
      }
    } else {
      setUsernameSuggestions([]);
    }
  };

  const handleAddMember = async () => {
    try {
      const response = await axios.post(
        `${server}/api/organizations/${organizationId}/teams/${teamId}/users`,
        { username: newMemberUsername, role: "USER" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data && response.data.user) {
        setMembers((prevMembers) => [...prevMembers, response.data.user]);
      } else {
        console.error("Unexpected response format:", response);
      }
      setNewMemberUsername("");
      setUsernameSuggestions([]);
      setAddMemberError(false);

      // Fetch the updated list of members
      fetchMembers();

    } catch (error) {
      console.error("Error adding member:", error);
      setAddMemberError(true);
    }
  };

  const openModal = (userId) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  const handleDeleteMember = async () => {
    // Close the modal immediately when delete is clicked
    closeModal();

    try {
      await axios.delete(
        `${server}/api/organizations/${organizationId}/teams/${teamId}/users/${selectedUserId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          data: { removedBy: localStorage.getItem("userId") },
        }
      );

      // Remove the member from the list after successful deletion
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== selectedUserId)
      );

      // Fetch the updated list of members
      fetchMembers();

    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          style={{ marginRight: "10px" }}
        />
        Loading...
      </div>
    );
  }
  
  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    ...(userRole === "ADMIN" ? [
      {
        title: "Action",
        key: "action",
        render: (_, record) => (
          <Button onClick={() => openModal(record.id)} type="text" danger>
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        ),
      }
    ] : [])
  ];

  return (
    <div className="min-h-full bg-light-white rounded-3xl p-8">
      <h1 className="text-2xl text-gray-500 font-semibold mb-4">
        Team Name: {teamName}
      </h1>

      <div className="flex items-start space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Enter member username"
          value={newMemberUsername}
          onChange={handleUsernameChange}
          className={`w-96 ${addMemberError ? "border-red-500" : ""}`}
        />
        {userRole === 'ADMIN' && (
          <Button onClick={handleAddMember} type="primary">
            Add
          </Button>
        )}

      </div>

      {usernameSuggestions.length > 0 && newMemberUsername.length > 0 && (
        <div className="relative">
          <ul className="absolute z-10 w-96 bg-white border border-gray-300 mt-1 rounded-xl shadow-lg max-h-60 overflow-auto">
            {usernameSuggestions
              .filter((user) => user.status === "VERIFIED") // Filter out unverified users
              .map((user) => (
                <li
                  key={user.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setNewMemberUsername(user.username);
                    setUsernameSuggestions([]);
                    setAddMemberError(false);
                  }}
                >
                  {user.username}
                </li>
              ))}
          </ul>
        </div>
      )}

      <Table
        dataSource={members}
        columns={columns}
        rowKey="id"
        className="mt-7"
      />

      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Cancel
          </Button>,

          <Button
            key="delete"
            onClick={handleDeleteMember}
            type="primary"
            danger
          >
            Delete
          </Button>
          ,
        ]}
        title="Delete Confirmation"
      >
        <p>Are you sure you want to delete this member?</p>
      </Modal>
    </div>
  );
};

export default TeamMembersPage;

