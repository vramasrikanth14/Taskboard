const Project = require('../models/Project');
const Organization = require('../models/Organization');
const Team = require('../models/Team');
const User = require('../models/User');
const AuditLog = require('../models/Auditlog');
const sendEmail = require('server.js');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;
const GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

// Create a new project
exports.createProject = async (req, res) => {
  const {
    organizationId,
    name,
    description,
    projectManager,
    startDate,
    createdBy,
    teams,
  } = req.body;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const projectManagerUser = await User.findOne({ email: projectManager });
    if (!projectManagerUser) {
      return res.status(404).json({ message: "Project manager not found" });
    }

    const createProjectUser = await User.findOne({ email: createdBy });
    if (!createProjectUser) {
      return res.status(404).json({ message: "Creator not found" });
    }

    let teamNames = [];
    if (teams && teams.length > 0) {
      const existingTeams = await Team.find({ _id: { $in: teams } });
      if (existingTeams.length !== teams.length) {
        return res.status(404).json({ message: "Some teams not found" });
      }
      teamNames = existingTeams.map((team) => team.slug);
    }

    const newProject = new Project({
      name,
      description,
      projectManager,
      organization: organization._id,
      teams: teams || [],
      tasks: [],
      startDate,
      createdBy,
      bgUrl: "",
      repository: "",
      repoName: "",
    });

    await newProject.save();

    const auditLog = new AuditLog({
      entityType: "Project",
      entityId: newProject._id,
      actionType: "create",
      actionDate: new Date(),
      performedBy: createProjectUser.name,
      changes: [],
    });

    await auditLog.save();

    organization.projects.push(newProject._id);
    await organization.save();

    if (teams && teams.length > 0) {
      await Team.updateMany(
        { _id: { $in: teams } },
        { $push: { projects: newProject._id } }
      );
    }

    const token = jwt.sign(
      {
        projectId: newProject._id,
        name: newProject.name,
        description: newProject.description,
        projectManager: newProject.projectManager,
      },
      secretKey,
      { expiresIn: "1h" }
    );

    const link = `http://localhost:3000/project?token=${token}`;
    const emailText = `Dear Project Manager,\n\nA new project has been created.\n\nProject Name: ${name}\nDescription: ${description}\n\nPlease click the following link to view the project details: ${link}\n\nBest Regards,\nTeam`;

    await sendEmail(projectManager, "New Project Created", emailText);

    const repoName = `${organization.name}-${newProject.name}-repo`
      .replace(/\s+/g, "-")
      .toLowerCase();

    let githubResponse;
    try {
      githubResponse = await axios.post(
        `https://api.github.com/orgs/${organization.name}/repos`,
        {
          name: repoName,
          private: true,
          description: `Repository for ${organization.name} project ${newProject.name}`,
        },
        {
          headers: {
            Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      newProject.repository = githubResponse.data.html_url;
      newProject.repoName = repoName;
      await newProject.save();
    } catch (error) {
      return res.status(500).json({
        message: "Error creating GitHub repository",
        error: error.message,
      });
    }

    if (teamNames && teamNames.length > 0) {
      for (const teamName of teamNames) {
        try {
          await axios.put(
            `https://api.github.com/orgs/${organization.name}/teams/${teamName}/repos/${organization.name}/${repoName}`,
            { permission: "push" },
            {
              headers: {
                Authorization: `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github.v3+json",
              },
            }
          );
        } catch (error) {
          return res.status(500).json({
            message: `Error assigning team ${teamName} to GitHub repository`,
            error: error.message,
          });
        }
      }
    }

    res.status(201).json({
      message:
        "Project created, email sent to project manager, GitHub repository created, and team assigned",
      project: newProject,
      projectManagerStatus: projectManagerUser.status,
      repository: githubResponse.data,
      repoName,
      teamNames,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating project", error: error.message });
  }
};

// Update project background image
exports.updateProjectBgImage = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { bgUrl } = req.body;

    const result = await cloudinary.uploader.upload(bgUrl, {
      folder: "document",
    });

    const cloudinaryUrl = result.secure_url;

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { bgUrl: cloudinaryUrl },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Background image URL updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating background image" });
  }
};

// Add custom image to project
exports.addCustomImage = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { imageUrl } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $push: { customImages: imageUrl } },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Custom image added successfully",
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding custom image" });
  }
};

// Remove custom image from project
exports.removeCustomImage = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { imageUrl } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $pull: { customImages: imageUrl } },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Custom image removed successfully",
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Error removing custom image" });
  }
};
