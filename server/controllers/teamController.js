// controllers/teamController.js
const Organization = require('../models/Organization');
const Team = require('../models/Team');
const User = require('../models/User');
const axios = require('axios');

const GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

exports.createTeam = async (req, res) => {
  const { organizationId } = req.params;
  const { teamName, addedBy } = req.body;

  try {
    const organization = await Organization.findById(organizationId).populate("teams");
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    let team = organization.teams.find((team) => team.name === teamName);
    if (team) {
      return res.status(400).json({ message: "Team with this name already exists" });
    }

    team = new Team({ name: teamName, users: [], addedBy, addedDate: new Date() });
    await team.save();

    organization.teams.push(team._id);
    await organization.save();

    const githubTeamResponse = await axios.post(
      `https://api.github.com/orgs/${organization.name}/teams`,
      { name: teamName, privacy: "closed" },
      { headers: { Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`, "Content-Type": "application/json" } }
    );

    team.slug = githubTeamResponse.data.slug;
    await team.save();

    res.status(200).json({ message: "Team created successfully", team, githubTeam: githubTeamResponse.data });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Error creating team", error: error.message });
  }
};

exports.getTeams = async (req, res) => {
  const { organizationId } = req.params;

  try {
    const organization = await Organization.findById(organizationId).populate("teams");
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const teams = organization.teams;
    res.status(200).json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: "Error fetching teams" });
  }
};

exports.deleteTeam = async (req, res) => {
  const { organizationId, teamId } = req.params;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const teamIndex = organization.teams.indexOf(teamId);
    if (teamIndex === -1) {
      return res.status(404).json({ message: "Team not found in this organization" });
    }

    organization.teams.splice(teamIndex, 1);
    await organization.save();

    await Team.findByIdAndDelete(teamId);

    const githubTeamResponse = await axios.delete(
      `https://api.github.com/orgs/${organization.name}/teams/${team.name}`,
      { headers: { Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`, "Content-Type": "application/json" } }
    );

    res.status(200).json({ message: "Team deleted successfully from MongoDB and GitHub" });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ message: "Error deleting team", error: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  const { organizationId, teamId } = req.params;
  const { teamName } = req.body;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const oldTeamName = team.name;
    team.name = teamName;
    await team.save();

    const githubTeamResponse = await axios.patch(
      `https://api.github.com/orgs/${organization.name}/teams/${oldTeamName}`,
      { name: teamName },
      { headers: { Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`, "Content-Type": "application/json" } }
    );

    res.status(200).json({ message: "Team updated successfully", team, githubTeam: githubTeamResponse.data });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ message: "Error updating team", error: error.message });
  }
};

exports.addUserToTeam = async (req, res) => {
  const { organizationId, teamId } = req.params;
  const { email, role } = req.body;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!organization.teams.includes(team._id)) {
      return res.status(400).json({ message: "Team does not belong to this organization" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({ message: "Admin users cannot be added to teams" });
    }

    if (user.status === "unverify") {
      return res.status(400).json({ message: "This user email is not verified. Please verify the email before adding into team." });
    }

    const userInTeam = team.users.find(u => u.user.toString() === user._id.toString());
    if (userInTeam) {
      return res.status(400).json({ message: "User is already in the team" });
    }

    team.users.push({ user: user._id, role: role || "USER" });
    await team.save();

    const githubTeamResponse = await axios.put(
      `https://api.github.com/orgs/${organization.name}/teams/${team.name}/memberships/${user.name}`,
      {},
      { headers: { Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`, "Content-Type": "application/json" } }
    );

    res.status(200).json({ message: "User added to team successfully in MongoDB and GitHub", team, githubTeam: githubTeamResponse.data });
  } catch (error) {
    console.error("Error adding user to team:", error);
    res.status(500).json({ message: "Error adding user to team", error: error.message });
  }
};

exports.getUsersInTeam = async (req, res) => {
  const { organizationId, teamId } = req.params;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const team = await Team.findById(teamId).populate("users.user", "name email status");
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!organization.teams.includes(team._id)) {
      return res.status(400).json({ message: "Team does not belong to this organization" });
    }

    const users = team.users.map(user => ({
      id: user.user._id,
      name: user.user.name,
      email: user.user.email,
      role: user.role,
      status: user.user.status,
    }));

    res.status(200).json({ teamName: team.name, users });
  } catch (error) {
    console.error("Error fetching team users:", error);
    res.status(500).json({ message: "Error fetching team users" });
  }
};

exports.removeUserFromTeam = async (req, res) => {
  const { organizationId, teamId, userId } = req.params;
  const { removedBy } = req.body;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!organization.teams.includes(team._id)) {
      return res.status(400).json({ message: "Team does not belong to this organization" });
    }

    const userIndex = team.users.findIndex(u => u.user.toString() === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found in the team" });
    }

    team.users.splice(userIndex, 1);
    team.removedBy = removedBy;
    team.removedDate = new Date();
    await team.save();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const githubTeamResponse = await axios.delete(
      `https://api.github.com/orgs/${organization.name}/teams/${team.name}/memberships/${user.name}`,
      { headers: { Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`, "Content-Type": "application/json" } }
    );

    res.status(200).json({ message: "User removed from team successfully in MongoDB and GitHub", removedBy });
  } catch (error) {
    console.error("Error removing user from team:", error.response ? error.response.data : error.message);
    res.status(500).json({ message: "Error removing user from team", error: error.message });
  }
<<<<<<< HEAD
};
=======
};
>>>>>>> f5006441aad4b7f5f174bc5593d81e9d42ca6fb6
