// controllers/notificationController.js
const Notification = require('../models/Notification'); // Adjust the path as needed

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("Requested notifications for userId:", userId);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Fetch notifications for the specified userId
    const notifications = await Notification.find({ userId }, "message");
    console.log("Fetched notifications for user:", userId, notifications);

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};
