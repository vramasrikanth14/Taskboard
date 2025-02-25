// // //rulespage.jsx with antd
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowRightOutlined,
  PlusCircleOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import {
  Button,
  Select,
  Input,
  Modal,
  Card,
  Steps,
  Typography,
  Space,
  Dropdown,
  Menu,
  message,
} from "antd";
import { server } from "../constant";
import { useParams } from "react-router-dom";


const { Option } = Select;
const { Step } = Steps;

const { Title, Text } = Typography;

const TriggerOption = ({ icon: Icon, label, isSelected, onClick }) => (
  <Button
    icon={<Icon />}
    className={`flex items-center justify-start w-full ${
      isSelected ? "ant-btn-primary" : ""
    }`}
    onClick={onClick}
  >
    {label}
  </Button>
);

const ActionOption = ({ icon: Icon, label, onClick }) => (
  <Button
    icon={<Icon />}
    onClick={onClick}
    className="flex flex-col items-center justify-center h-24 w-24"
  >
    <Text className="mt-2">{label}</Text>
  </Button>
);

function RulesButton({ tasks }) {

  const [isOpen, setIsOpen] = useState(false);
  const [showRulesUI, setShowRulesUI] = useState(false);
  const [showTriggers, setShowTriggers] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState("");
  const [triggerCondition, setTriggerCondition] = useState("");
  const [listName, setListName] = useState("");
  const [triggerAdded, setTriggerAdded] = useState(false);
  const [actionStep, setActionStep] = useState(false);
  const [actionAdded, setActionAdded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAction, setSelectedAction] = useState(null);
  const [moveToList, setMoveToList] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [rules, setRules] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const { projectId } = useParams();
  const [cardStatuses, setCardStatuses] = useState([]);
  const [createdByCondition, setCreatedByCondition] = useState("");

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

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await axios.get(`${server}/api/rules/${projectId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setRules(response.data);
      } catch (error) {
        console.error("Error fetching rules:", error);
      }
    };

    if (projectId) {
      fetchRules();
    }
  }, [projectId]);

  useEffect(() => {
    const fetchCardStatuses = async () => {
      try {
        const response = await axios.get(`${server}/api/card-statuses`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setCardStatuses(response.data.statuses);
      } catch (error) {
        console.error("Error fetching card statuses:", error);
        setCardStatuses(["Completed", "Pending", "Inprogress"]);
      }
    };

    fetchCardStatuses();
  }, []);

  const openRulesUI = () => {
    setIsOpen(false);
    setShowRulesUI(true);
  };

  const handleAddTrigger = () => {
    setShowTriggers(true);
  };

  const handleTriggerSelect = (trigger) => {
    setSelectedTrigger(trigger);
  };

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const handleAddButtonClick = () => {
    if (isButtonDisabled) return; // Prevent multiple clicks

    if (
      selectedTrigger === "Card Move" &&
      (!triggerCondition || !createdByCondition)
    ) {
      setIsButtonDisabled(true);
      message.warning(
        "Please select all required fields before adding the trigger."
      );
      setTimeout(() => setIsButtonDisabled(false), 3000); // Re-enable after 2 seconds
      return;
    }

    // Proceed with adding the trigger if validation passes
    setTriggerAdded(true);
    setActionStep(true);
    setCurrentStep(1);
  };

  const [isActionButtonDisabled, setIsActionButtonDisabled] = useState(false);

  const handleAddActionClick = () => {
    if (isActionButtonDisabled) return; // Prevent multiple clicks

    if (selectedAction === "Move to List" && !moveToList) {
      setIsActionButtonDisabled(true);
      message.warning("Please select a column to move the task.");
      setTimeout(() => setIsActionButtonDisabled(false), 3000); // Re-enable after 2 seconds
      return;
    }

    // Proceed with adding the action if validation passes
    setActionAdded(true);
    setCurrentStep(2);
  };
  // const handleAddButtonClick = () => {
  //   if (
  //     selectedTrigger === "Card Move" &&
  //     (!triggerCondition || !createdByCondition)
  //   ) {
  //     message.warning("Please select all required fields before adding the trigger.");
  //     return;
  //   }

  //   // Proceed with adding the trigger
  //   // Your existing code for handling the trigger addition
  // };

  const handleBack = () => {
    if (currentStep === 1) {
      setActionStep(false);
      setTriggerAdded(false);
      setCurrentStep(0);
    } else if (currentStep === 2) {
      setActionAdded(false);
      setCurrentStep(1);
    }
  };

  const handleActionSelect = (action) => {
    setSelectedAction(action);
  };

  const handleSaveRule = async () => {
    try {
      let triggerSentence = "";
      if (selectedTrigger === "Card Move") {
        triggerSentence = `When card status is marked as ${triggerCondition}`;
      } else if (selectedTrigger === "Card Changes") {
        triggerSentence = `When card is moved to ${triggerCondition}`;
      }

      let actionSentence = "";
      if (selectedAction === "Move to List") {
        actionSentence = `Move to column ${moveToList}`;
      } else if (selectedAction === "Complete Task") {
        actionSentence = `Mark the task as completed`;
      } else if (selectedAction === "Delete Task") {
        actionSentence = `Delete the task`;
      } else if (selectedAction === "Assign Task") {
        actionSentence = `Assign task to ${userEmail}`;
      }

      const newRule = {
        name: `${selectedTrigger} Rule`,
        trigger: selectedTrigger,
        triggerCondition,
        listName,
        action: selectedAction,
        actionDetails: { moveToList },
        createdBy: userEmail,
        projectId,
        createdByCondition,
        triggerSentence,
        actionSentence,
      };

      const response = await axios.post(`${server}/api/rules`, newRule, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const savedRule = response.data;
      setRules((prevRules) => [...prevRules, savedRule]);

      setCurrentStep(0);
      setSelectedTrigger("");
      setTriggerCondition("");
      setCreatedByCondition("");
      setShowTriggers(false);
      setSelectedAction("");
      setMoveToList("");
      setUserEmail("");
      setShowRulesUI(false);
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  };

  const openDeleteConfirmation = (ruleId) => {
    setRuleToDelete(ruleId);
    setShowDeleteConfirmation(true);
  };

  const closeDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
    setRuleToDelete(null);
  };

  const confirmDelete = async () => {
    if (ruleToDelete) {
      try {
        await axios.delete(`${server}/api/rules/${ruleToDelete}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setRules(rules.filter((rule) => rule._id !== ruleToDelete));
        closeDeleteConfirmation();
      } catch (error) {
        console.error("Error deleting rule:", error);
      }
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={openRulesUI}>
        RULES
      </Menu.Item>
    </Menu>
  );
  return (
    <div className="relative">
      {/* <Dropdown overlay={menu} trigger={['click']}>
        <Button type="primary" shape="round">
          Rules<ArrowRightOutlined />
        </Button>
      </Dropdown> */}
      <Dropdown overlay={menu} trigger={["click"]}>
        <button
          type="button"
          className="flex flex-row items-left justify-left gap-2 p-2 rounded-md border-color-black-400 hover:bg-gray-200"
          style={{
            height: "40px",
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          <ToolOutlined style={{ fontSize: 20 }} />
          Automation
        </button>
      </Dropdown>

      <Modal
        visible={showRulesUI}
        onCancel={() => setShowRulesUI(false)}
        footer={null}
        width="70%"
        centered
        className="rounded-lg shadow-lg"
      >
        <Title level={2} className="text-center  ">
          Create a Rule
        </Title>
        <Steps current={currentStep} className="mb-6">
          <Step title="Select trigger" />
          <Step title="Select action" />
          <Step title="Review and save" />
        </Steps>

        <Card
          title="Existing Rules"
          className="mb-6"
          bodyStyle={{ padding: 0 }}
        >
          {rules.length === 0 ? (
            <Text className="p-4 block text-center text-gray-500">
              No rules have been configured yet.
            </Text>
          ) : (
            <div className="h-40 overflow-y-auto">
              {rules.map((rule, index) => (
                <Card
                  key={index}
                  className="w-full h-12 relative flex items-center justify-between"
                >
                  <div className="flex flex-grow items-center overflow-hidden">
                    <Text strong className="truncate mr-2">
                      {rule.triggerSentence || "No trigger sentence"} -
                    </Text>
                    <Text className="truncate">
                      {rule.actionSentence || "No action sentence"}
                    </Text>
                  </div>
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                    <Button
                      icon={<DeleteOutlined />}
                      onClick={() => openDeleteConfirmation(rule._id)}
                      type="text"
                      danger
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {currentStep === 0 && (
          <div className="max-h-96 overflow-y-auto">
            <Title level={3}>Select Trigger</Title>
            {!showTriggers ? (
              <Button
                type="primary"
                block
                onClick={handleAddTrigger}
                className="my-4"
              >
                + Add Trigger
              </Button>
            ) : (
              <Space direction="vertical" className="w-full">
                <Space>
                  <TriggerOption
                    icon={ArrowRightOutlined}
                    label="Card Move"
                    isSelected={selectedTrigger === "Card Move"}
                    onClick={() => handleTriggerSelect("Card Move")}
                  />
                  {/* <TriggerOption
                    icon={PlusCircleOutlined}
                    label="Card Changes"
                    isSelected={selectedTrigger === "Card Changes"}
                    onClick={() => handleTriggerSelect("Card Changes")}
                  /> */}
                </Space>
                {selectedTrigger === "Card Move" && (
                  <Card size="small" className="mt-4">
                    <Space direction="vertical" size="small" className="w-full">
                      <Space className="w-full">
                        <Text>when card status mark as</Text>
                        <Select
                          value={triggerCondition}
                          onChange={setTriggerCondition}
                          className="w-32"
                          placeholder="Select status"
                        >
                          {cardStatuses.map((status) => (
                            <Option key={status} value={status.toLowerCase()}>
                              {status}
                            </Option>
                          ))}
                        </Select>
                        <Select
                          value={createdByCondition}
                          onChange={setCreatedByCondition}
                          className="w-40"
                          placeholder="Select creator"
                        >
                          <Option value="by me">by me</Option>
                          <Option value="by anyone">by anyone</Option>
                          <Option value="by anyone except me">
                            by anyone except me
                          </Option>
                        </Select>
                      </Space>
                      <Text type="secondary" className="text-sm">
                        The rule will be triggered when a card is moved.
                      </Text>
                    </Space>
                  </Card>
                )}
                {selectedTrigger && (
                  <Space className="mt-4 flex justify-between">
                    <Button
                      type="primary"
                      onClick={handleAddButtonClick}
                      disabled={isButtonDisabled}
                    >
                      Add Trigger
                    </Button>
                    <Button onClick={() => setShowTriggers(false)}>Back</Button>
                  </Space>
                )}
              </Space>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <>
            <Title level={3} className="mb-6 text-center">
              Select Action
            </Title>
            <Space direction="vertical" className="w-full">
              <Space>
                <Button
                  className="custom-button"
                  icon={<ClockCircleOutlined />}
                  onClick={() => handleActionSelect("Move to List")}
                >
                  Move to List
                </Button>
                {/* <Button
                  className="custom-button"
                  icon={<CheckSquareOutlined />}
                  onClick={() => handleActionSelect("Complete Task")}
                >
                  Complete Task
                </Button> */}
                {/* <Button
                  className="custom-button"
                  icon={<DeleteOutlined />}
                  onClick={() => handleActionSelect("Delete Task")}
                >
                  Delete Task
                </Button> */}
              </Space>
            </Space>

            {selectedAction && (
              <div>
                {selectedAction === "Move to List" && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Title
                        level={4}
                        className="mb-4"
                        style={{ marginRight: "8px" }}
                      >
                        Move to Column
                      </Title>
                      <Select
                        style={{ width: "20%" }}
                        value={moveToList}
                        onChange={setMoveToList}
                        className="mb-4 mt-2"
                        placeholder="Select a column"
                      >
                        {tasks.map((task) => (
                          <Option key={task.id} value={task.name}>
                            {task.name}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <Text type="secondary" className="text-sm">
                      The card will be moved to the specified column.
                    </Text>
                  </div>
                )}
                {selectedAction === "Complete Task" && (
                  <Text type="secondary" className="text-sm">
                    The selected task will be marked as complete.
                  </Text>
                )}
                {selectedAction === "Delete Task" && (
                  <Text type="secondary" className="text-sm">
                    The selected task will be deleted.
                  </Text>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-between items-center">
              <div>
                {selectedAction && (
                  <Button
                    type="primary"
                    onClick={handleAddActionClick}
                    disabled={isActionButtonDisabled}
                  >
                    Add Action
                  </Button>
                )}
              </div>
              <div>
                <Button onClick={handleBack}>Back</Button>
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <div className="max-h-96 overflow-y-auto">
            <Title level={3} className="mb-4">
              Review and Save
            </Title>
            <Card size="small">
              <Title level={4}>Trigger</Title>
              <Text>
                {selectedTrigger === "Card Move" && (
                  <>
                    When card status is marked as{" "}
                    <Text strong>{triggerCondition}</Text>
                  </>
                )}
                {selectedTrigger === "Card Changes" && (
                  <>
                    When card is moved to <Text strong>{triggerCondition}</Text>
                  </>
                )}
              </Text>
              <Title level={4} className="mt-4">
                Action
              </Title>
              <Text>
                {selectedAction === "Move to List" && (
                  <>
                    Move to column <Text strong>{moveToList}</Text>
                  </>
                )}
                {selectedAction === "Complete Task" && (
                  <>Mark the task as completed</>
                )}
                {selectedAction === "Delete Task" && <>Delete the task</>}
                {selectedAction === "Assign Task" && (
                  <>
                    Assign task to <Text strong>{userEmail}</Text>
                  </>
                )}
              </Text>
            </Card>
            <Space className="mt-4 flex justify-between">
              <Button type="primary" onClick={handleSaveRule}>
                Save Rule
              </Button>
              <Button onClick={() => setCurrentStep(1)}>Back</Button>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title="Confirm Deletion"
        visible={showDeleteConfirmation}
        onOk={confirmDelete}
        onCancel={closeDeleteConfirmation}
      >
        <p>Are you sure you want to delete this rule?</p>
      </Modal>
    </div>
  );
}

export default RulesButton;