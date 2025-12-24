const EventEmitter = require('events');

class JobPortalEvents extends EventEmitter {}

const eventEmitter = new JobPortalEvents();

// Event listeners
eventEmitter.on('user:registered', (userData) => {
  console.log(`📧 New user registered: ${userData.email}`);
  // Send welcome email logic here
});

eventEmitter.on('job:applied', (applicationData) => {
  console.log(`💼 New job application: User ${applicationData.userId} applied for Job ${applicationData.jobId}`);
  // Notify recruiter logic here
});

eventEmitter.on('application:statusChanged', (statusData) => {
  console.log(`📋 Application status changed: ${statusData.status} for application ${statusData.applicationId}`);
  // Send notification to user logic here
});

eventEmitter.on('chat:newMessage', (messageData) => {
  console.log(`💬 New chat message from ${messageData.senderId} to ${messageData.receiverId}`);
  // Real-time notification logic here
});

module.exports = eventEmitter;