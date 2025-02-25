// // // //rulespage.jsx with antd
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   ArrowRightOutlined,
//   PlusCircleOutlined,
//   ClockCircleOutlined,
//   CheckSquareOutlined,
//   DeleteOutlined,
//   ArrowLeftOutlined,
//   ToolOutlined,
// } from "@ant-design/icons";
// import {
//   Button,
//   Select,
//   Input,
//   Modal,
//   Card,
//   Steps,
//   Typography,
//   Space,
//   Dropdown,
//   Menu,
// } from "antd";
// import { server } from "../constant";
// import { useParams } from "react-router-dom";
// import useTokenValidation from "./UseTockenValidation";

// const { Option } = Select;
// const { Step } = Steps;
// const { Title, Text } = Typography;
// const { Option } = Select;
// const { Step } = Steps;
// const { Title, Text } = Typography;

// const TriggerOption = ({ icon: Icon, label, isSelected, onClick }) => (
//   <Button
//     icon={<Icon />}
//     className={`flex items-center justify-start w-full ${
//       isSelected ? "ant-btn-primary" : ""
//     }`}
//     onClick={onClick}
//   >
//     {label}
//   </Button>
// );

// const ActionOption = ({ icon: Icon, label, onClick }) => (
//   <Button
//     icon={<Icon />}
//     onClick={onClick}
//     className="flex flex-col items-center justify-center h-24 w-24"
//   >
//     <Text className="mt-2">{label}</Text>
//   </Button>
// );
// const ActionOption = ({ icon: Icon, label, onClick }) => (
//   <Button
//     icon={<Icon />}
//     onClick={onClick}
//     className="flex flex-col items-center justify-center h-24 w-24"
//   >
//     <Text className="mt-2">{label}</Text>
//   </Button>
// );

// function RulesButton({ tasks }) {
//   useTokenValidation();
//   const [isOpen, setIsOpen] = useState(false);
//   const [showRulesUI, setShowRulesUI] = useState(false);
//   const [showTriggers, setShowTriggers] = useState(false);
//   const [selectedTrigger, setSelectedTrigger] = useState("");
//   const [triggerCondition, setTriggerCondition] = useState("");
//   const [listName, setListName] = useState("");
//   const [triggerAdded, setTriggerAdded] = useState(false);
//   const [actionStep, setActionStep] = useState(false);
//   const [actionAdded, setActionAdded] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [selectedAction, setSelectedAction] = useState(null);
//   const [moveToList, setMoveToList] = useState("");
//   const [userEmail, setUserEmail] = useState("");
//   const [rules, setRules] = useState([]);
//   const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
//   const [ruleToDelete, setRuleToDelete] = useState(null);
//   const { projectId } = useParams();
//   const [cardStatuses, setCardStatuses] = useState([]);
//   const [createdByCondition, setCreatedByCondition] = useState("");
// function RulesButton({ tasks }) {
//   useTokenValidation();
//   const [isOpen, setIsOpen] = useState(false);
//   const [showRulesUI, setShowRulesUI] = useState(false);
//   const [showTriggers, setShowTriggers] = useState(false);
//   const [selectedTrigger, setSelectedTrigger] = useState("");
//   const [triggerCondition, setTriggerCondition] = useState("");
//   const [listName, setListName] = useState("");
//   const [triggerAdded, setTriggerAdded] = useState(false);
//   const [actionStep, setActionStep] = useState(false);
//   const [actionAdded, setActionAdded] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [selectedAction, setSelectedAction] = useState(null);
//   const [moveToList, setMoveToList] = useState("");
//   const [userEmail, setUserEmail] = useState("");
//   const [rules, setRules] = useState([]);
//   const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
//   const [ruleToDelete, setRuleToDelete] = useState(null);
//   const { projectId } = useParams();
//   const [cardStatuses, setCardStatuses] = useState([]);
//   const [createdByCondition, setCreatedByCondition] = useState("");

//   useEffect(() => {
//     const fetchUserEmail = async () => {
//       try {
//         const response = await axios.get(`${server}/api/user`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
//         setUserEmail(response.data.user.email);
//       } catch (error) {
//         console.error("Error fetching user data:", error);
//       }
//     };

//     fetchUserEmail();
//   }, []);

//   useEffect(() => {
//     const fetchRules = async () => {
//       try {
//         const response = await axios.get(`${server}/api/rules/${projectId}`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         setRules(response.data);
//       } catch (error) {
//         console.error("Error fetching rules:", error);
//       }
//     };
//   useEffect(() => {
//     const fetchRules = async () => {
//       try {
//         const response = await axios.get(`${server}/api/rules/${projectId}`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         setRules(response.data);
//       } catch (error) {
//         console.error("Error fetching rules:", error);
//       }
//     };

//     if (projectId) {
//       fetchRules();
//     }
//   }, [projectId]);

//   useEffect(() => {
//     const fetchCardStatuses = async () => {
//       try {
//         const response = await axios.get(`${server}/api/card-statuses`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
//         setCardStatuses(response.data.statuses);
//       } catch (error) {
//         console.error("Error fetching card statuses:", error);
//         setCardStatuses(["Completed", "Pending", "Inprogress"]);
//       }
//     };
//   useEffect(() => {
//     const fetchCardStatuses = async () => {
//       try {
//         const response = await axios.get(`${server}/api/card-statuses`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
//         setCardStatuses(response.data.statuses);
//       } catch (error) {
//         console.error("Error fetching card statuses:", error);
//         setCardStatuses(["Completed", "Pending", "Inprogress"]);
//       }
//     };

//     fetchCardStatuses();
//   }, []);
//     fetchCardStatuses();
//   }, []);

//   const openRulesUI = () => {
//     setIsOpen(false);
//     setShowRulesUI(true);
//   };

//   const handleAddTrigger = () => {
//     setShowTriggers(true);
//   };

//   const handleTriggerSelect = (trigger) => {
//     setSelectedTrigger(trigger);
//   };

//   const handleAddButtonClick = () => {
//     setTriggerAdded(true);
//     setActionStep(true);
//     setCurrentStep(1);
//   };
//   const handleAddButtonClick = () => {
//     setTriggerAdded(true);
//     setActionStep(true);
//     setCurrentStep(1);
//   };

//   const handleAddActionClick = () => {
//     setActionAdded(true);
//     setCurrentStep(2);
//   };
//   const handleAddActionClick = () => {
//     setActionAdded(true);
//     setCurrentStep(2);
//   };

//   const handleBack = () => {
//     if (currentStep === 1) {
//       setActionStep(false);
//       setTriggerAdded(false);
//       setCurrentStep(0);
//     } else if (currentStep === 2) {
//       setActionAdded(false);
//       setCurrentStep(1);
//     }
//   };
//   const handleBack = () => {
//     if (currentStep === 1) {
//       setActionStep(false);
//       setTriggerAdded(false);
//       setCurrentStep(0);
//     } else if (currentStep === 2) {
//       setActionAdded(false);
//       setCurrentStep(1);
//     }
//   };

//   const handleActionSelect = (action) => {
//     setSelectedAction(action);
//   };

//   const handleSaveRule = async () => {
//     try {
//       let triggerSentence = "";
//       if (selectedTrigger === "Card Move") {
//         triggerSentence = `When card status is marked as ${triggerCondition}`;
//       } else if (selectedTrigger === "Card Changes") {
//         triggerSentence = `When card is moved to ${triggerCondition}`;
//       }

//       let actionSentence = "";
//       if (selectedAction === "Move to List") {
//         actionSentence = `Move to column ${moveToList}`;
//       } else if (selectedAction === "Complete Task") {
//         actionSentence = `Mark the task as completed`;
//       } else if (selectedAction === "Delete Task") {
//         actionSentence = `Delete the task`;
//       } else if (selectedAction === "Assign Task") {
//         actionSentence = `Assign task to ${userEmail}`;
//       }
//       let actionSentence = "";
//       if (selectedAction === "Move to List") {
//         actionSentence = `Move to column ${moveToList}`;
//       } else if (selectedAction === "Complete Task") {
//         actionSentence = `Mark the task as completed`;
//       } else if (selectedAction === "Delete Task") {
//         actionSentence = `Delete the task`;
//       } else if (selectedAction === "Assign Task") {
//         actionSentence = `Assign task to ${userEmail}`;
//       }

//       const newRule = {
//         name: `${selectedTrigger} Rule`,
//         trigger: selectedTrigger,
//         triggerCondition,
//         listName,
//         action: selectedAction,
//         actionDetails: { moveToList },
//         createdBy: userEmail,
//         projectId,
//         createdByCondition,
//         triggerSentence,
//         actionSentence,
//       };
//       const newRule = {
//         name: `${selectedTrigger} Rule`,
//         trigger: selectedTrigger,
//         triggerCondition,
//         listName,
//         action: selectedAction,
//         actionDetails: { moveToList },
//         createdBy: userEmail,
//         projectId,
//         createdByCondition,
//         triggerSentence,
//         actionSentence,
//       };

//       const response = await axios.post(`${server}/api/rules`, newRule, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
//       const response = await axios.post(`${server}/api/rules`, newRule, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });

//       const savedRule = response.data;
//       setRules((prevRules) => [...prevRules, savedRule]);
//       const savedRule = response.data;
//       setRules((prevRules) => [...prevRules, savedRule]);

//       setCurrentStep(0);
//       setSelectedTrigger("");
//       setTriggerCondition("");
//       setCreatedByCondition("");
//       setShowTriggers(false);
//       setSelectedAction("");
//       setMoveToList("");
//       setUserEmail("");
//       setShowRulesUI(false);
//     } catch (error) {
//       console.error("Error saving rule:", error);
//     }
//   };
//       setCurrentStep(0);
//       setSelectedTrigger("");
//       setTriggerCondition("");
//       setCreatedByCondition("");
//       setShowTriggers(false);
//       setSelectedAction("");
//       setMoveToList("");
//       setUserEmail("");
//       setShowRulesUI(false);
//     } catch (error) {
//       console.error("Error saving rule:", error);
//     }
//   };

//   const openDeleteConfirmation = (ruleId) => {
//     setRuleToDelete(ruleId);
//     setShowDeleteConfirmation(true);
//   };
//   const openDeleteConfirmation = (ruleId) => {
//     setRuleToDelete(ruleId);
//     setShowDeleteConfirmation(true);
//   };

//   const closeDeleteConfirmation = () => {
//     setShowDeleteConfirmation(false);
//     setRuleToDelete(null);
//   };
//   const closeDeleteConfirmation = () => {
//     setShowDeleteConfirmation(false);
//     setRuleToDelete(null);
//   };

//   const confirmDelete = async () => {
//     if (ruleToDelete) {
//       try {
//         await axios.delete(`${server}/api/rules/${ruleToDelete}`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         setRules(rules.filter((rule) => rule._id !== ruleToDelete));
//         closeDeleteConfirmation();
//       } catch (error) {
//         console.error("Error deleting rule:", error);
//       }
//     }
//   };

//   const menu = (
//     <Menu>
//       <Menu.Item key="1" onClick={openRulesUI}>
//         RULES
//       </Menu.Item>
//     </Menu>
//   );
//   return (
//     <div className="relative">
//       {/* <Dropdown overlay={menu} trigger={['click']}>
//         <Button type="primary" shape="round">
//           Rules<ArrowRightOutlined />
//         </Button>
//       </Dropdown> */}
//       <Dropdown overlay={menu} trigger={["click"]}>
//         <Space direction="vertical" style={{ width: "100%" }}>
//           <Button
//             type="default"
//             icon={<ToolOutlined />}
//             className="flex flex-row justify-center items-center gap-2 p-2 rounded-md border-color-black-400 hover:bg-gray-200"
//             // style={{ height: '40px', display: 'flex', alignItems: 'center', width: '100%' }}
//           >
//             Automation
//           </Button>
//         </Space>
//       </Dropdown>

//       <Modal
//         visible={showRulesUI}
//         onCancel={() => setShowRulesUI(false)}
//         footer={null}
//         width="70%"
//       >
//         <Title level={2}>Create a Rule</Title>
//         <Steps current={currentStep} className="mb-6">
//           <Step title="Select trigger" />
//           <Step title="Select action" />
//           <Step title="Review and save" />
//         </Steps>

//         <Card
//           title="Existing Rules"
//           className="mb-6"
//           style={{ maxHeight: "200px", overflowY: "auto" }}
//         >
//           {rules.length === 0 ? (
//             <Text>No rules have been configured yet.</Text>
//           ) : (
//             rules.map((rule, index) => (
//               <Card.Grid key={index} className="w-full">
//                 <Space>
//                   <Text strong>
//                     {rule.triggerSentence || "No trigger sentence"} -
//                   </Text>
//                   <Text>{rule.actionSentence || "No action sentence"}</Text>
//                   <Button
//                     icon={<DeleteOutlined />}
//                     onClick={() => openDeleteConfirmation(rule._id)}
//                     type="text"
//                     danger
//                   />
//                 </Space>
//               </Card.Grid>
//             ))
//           )}
//         </Card>
//         {currentStep === 0 && (
//           <div style={{ maxHeight: "400px", overflowY: "auto" }}>
//             <Title level={3}>Select Trigger</Title>
//             {!showTriggers ? (
//               <Button type="primary" block onClick={handleAddTrigger}>
//                 + Add Trigger
//               </Button>
//             ) : (
//               <Space direction="vertical" className="w-full">
//                 <Space>
//                   <TriggerOption
//                     icon={ArrowRightOutlined}
//                     label="Card Move"
//                     isSelected={selectedTrigger === "Card Move"}
//                     onClick={() => handleTriggerSelect("Card Move")}
//                   />
//                   <TriggerOption
//                     icon={PlusCircleOutlined}
//                     label="Card Changes"
//                     isSelected={selectedTrigger === "Card Changes"}
//                     onClick={() => handleTriggerSelect("Card Changes")}
//                   />
//                 </Space>
//                 <Card size="small">
//                   {selectedTrigger === "Card Move" && (
//                     <Space direction="vertical" size="small">
//                       <Space>
//                         <Text>when card status mark as</Text>
//                         <Select
//                           value={triggerCondition}
//                           onChange={setTriggerCondition}
//                           style={{ width: 120 }}
//                         >
//                           {cardStatuses.map((status) => (
//                             <Option key={status} value={status.toLowerCase()}>
//                               {status}
//                             </Option>
//                           ))}
//                         </Select>
//                         <Select
//                           value={createdByCondition}
//                           onChange={setCreatedByCondition}
//                           style={{ width: 180 }}
//                         >
//                           <Option value="by me">by me</Option>
//                           <Option value="by anyone">by anyone</Option>
//                           <Option value="by anyone except me">
//                             by anyone except me
//                           </Option>
//                         </Select>
//                       </Space>
//                       <Text type="secondary">
//                         The rule will be triggered when a card is moved.
//                       </Text>
//                     </Space>
//                   )}
//                 </Card>
//                 <Space>
//                   <Button type="primary" onClick={handleAddButtonClick}>
//                     Add Trigger
//                   </Button>
//                   <Button onClick={() => setShowTriggers(false)}>Back</Button>
//                 </Space>
//               </Space>
//             )}
//           </div>
//         )}
//         {currentStep === 1 && (
//           <>
//             <Title level={3}>Select Action</Title>
//             <Space size="large" wrap>
//               <ActionOption
//                 icon={ClockCircleOutlined}
//                 label="Move to List"
//                 onClick={() => handleActionSelect("Move to List")}
//               />
//               <ActionOption
//                 icon={CheckSquareOutlined}
//                 label="Complete Task"
//                 onClick={() => handleActionSelect("Complete Task")}
//               />
//               <ActionOption
//                 icon={DeleteOutlined}
//                 label="Delete Task"
//                 onClick={() => handleActionSelect("Delete Task")}
//               />
//             </Space>
//             {selectedAction && (
//               <Card className="mt-4">
//                 {selectedAction === "Move to List" && (
//                   <>
//                     <Title level={4}>Move to column</Title>
//                     <Select
//                       style={{ width: "100%" }}
//                       value={moveToList}
//                       onChange={setMoveToList}
//                     >
//                       {tasks.map((task) => (
//                         <Option key={task.id} value={task.name}>
//                           {task.name}
//                         </Option>
//                       ))}
//                     </Select>
//                     <Text type="secondary">
//                       The card will be moved to the specified column.
//                     </Text>
//                   </>
//                 )}
//                 {selectedAction === "Complete Task" && (
//                   <Text type="secondary">
//                     The selected task will be marked as complete.
//                   </Text>
//                 )}
//                 {selectedAction === "Delete Task" && (
//                   <Text type="secondary">
//                     The selected task will be deleted.
//                   </Text>
//                 )}
//               </Card>
//             )}
//             <div className="mt-4 flex justify-between items-center">
//               <div>
//                 {selectedAction && (
//                   <Button type="primary" onClick={handleAddActionClick}>
//                     Add Action
//                   </Button>
//                 )}
//               </div>
//               <div>
//                 <Button onClick={handleBack}>Back</Button>
//               </div>
//             </div>
//           </>
//         )}
//         {currentStep === 2 && (
//           <div style={{ maxHeight: "400px", overflowY: "auto" }}>
//             <Title level={3}>Review and Save</Title>
//             <Card size="small">
//               <Title level={4}>Trigger</Title>
//               <Text>
//                 {selectedTrigger === "Card Move" && (
//                   <>
//                     When card status is marked as{" "}
//                     <Text strong>{triggerCondition}</Text>
//                   </>
//                 )}
//                 {selectedTrigger === "Card Changes" && (
//                   <>
//                     When card is moved to <Text strong>{triggerCondition}</Text>
//                   </>
//                 )}
//               </Text>
//               <Title level={4} className="mt-4">
//                 Action
//               </Title>
//               <Text>
//                 {selectedAction === "Move to List" && (
//                   <>
//                     Move to column <Text strong>{moveToList}</Text>
//                   </>
//                 )}
//                 {selectedAction === "Complete Task" && (
//                   <>Mark the task as completed</>
//                 )}
//                 {selectedAction === "Delete Task" && <>Delete the task</>}
//                 {selectedAction === "Assign Task" && (
//                   <>
//                     Assign task to <Text strong>{userEmail}</Text>
//                   </>
//                 )}
//               </Text>
//             </Card>
//             <Space className="mt-4">
//               <Button type="primary" onClick={handleSaveRule}>
//                 Save Rule
//               </Button>
//               <Button onClick={() => setCurrentStep(1)}>Back</Button>
//             </Space>
//           </div>
//         )}
//       </Modal>

//       <Modal
//         title="Confirm Deletion"
//         visible={showDeleteConfirmation}
//         onOk={confirmDelete}
//         onCancel={closeDeleteConfirmation}
//       >
//         <p>Are you sure you want to delete this rule?</p>
//       </Modal>
//     </div>
//   );
// }
//       <Modal
//         title="Confirm Deletion"
//         visible={showDeleteConfirmation}
//         onOk={confirmDelete}
//         onCancel={closeDeleteConfirmation}
//       >
//         <p>Are you sure you want to delete this rule?</p>
//       </Modal>
//     </div>
//   );
// }

// export default RulesButton;
