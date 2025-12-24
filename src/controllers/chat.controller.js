const prisma = require('../config/prisma');

const chatController = {
    // Get chat history between two users
    getChatHistory: async (req, res, next) => {
        try {
            const otherUserId = parseInt(req.params.userId);
            const currentUserId = req.user.id;

            // Verify the other user exists
            const otherUser = await prisma.user.findUnique({
                where: { id: otherUserId },
                select: { id: true, name: true, email: true, role: true }
            });

            if (!otherUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found.'
                });
            }

            // Get chat messages between the two users
            const messages = await prisma.chat.findMany({
                where: {
                    OR: [
                        { senderId: currentUserId, receiverId: otherUserId },
                        { senderId: otherUserId, receiverId: currentUserId }
                    ]
                },
                orderBy: { createdAt: 'asc' },
                take: 100 // Limit to last 100 messages
            });

            res.json({
                success: true,
                data: {
                    otherUser,
                    messages
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Get all chat conversations for current user
    getConversations: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Get unique users who have chatted with current user
            const conversations = await prisma.$queryRaw`
        SELECT DISTINCT 
          CASE 
            WHEN senderId = ${userId} THEN receiverId 
            ELSE senderId 
          END as userId,
          MAX(createdAt) as lastMessageAt
        FROM Chat 
        WHERE senderId = ${userId} OR receiverId = ${userId}
        GROUP BY userId
        ORDER BY lastMessageAt DESC
      `;

            // Get user details for each conversation
            const conversationDetails = await Promise.all(
                conversations.map(async (conv) => {
                    const user = await prisma.user.findUnique({
                        where: { id: conv.userId },
                        select: { id: true, name: true, email: true, role: true }
                    });

                    // Get last message
                    const lastMessage = await prisma.chat.findFirst({
                        where: {
                            OR: [
                                { senderId: userId, receiverId: conv.userId },
                                { senderId: conv.userId, receiverId: userId }
                            ]
                        },
                        orderBy: { createdAt: 'desc' }
                    });

                    return {
                        user,
                        lastMessage,
                        lastMessageAt: conv.lastMessageAt
                    };
                })
            );

            res.json({
                success: true,
                data: conversationDetails
            });
        } catch (error) {
            next(error);
        }
    },

    // Send a message (also handled via Socket.IO)
    sendMessage: async (req, res, next) => {
        try {
            const { receiverId, message } = req.body;

            if (!receiverId || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Receiver ID and message are required.'
                });
            }

            // Verify receiver exists
            const receiver = await prisma.user.findUnique({
                where: { id: parseInt(receiverId) }
            });

            if (!receiver) {
                return res.status(404).json({
                    success: false,
                    message: 'Receiver not found.'
                });
            }

            // Create message
            const newMessage = await prisma.chat.create({
                data: {
                    senderId: req.user.id,
                    receiverId: parseInt(receiverId),
                    message
                }
            });

            res.status(201).json({
                success: true,
                message: 'Message sent successfully.',
                data: newMessage
            });
        } catch (error) {
            next(error);
        }
    },

    // Get users available for chat (recruiters for users, users for recruiters)
    getAvailableUsers: async (req, res, next) => {
        try {
            const currentUser = req.user;
            let whereClause = {};

            // Users can chat with recruiters, recruiters can chat with users
            if (currentUser.role === 'USER') {
                whereClause = { role: 'RECRUITER' };
            } else if (currentUser.role === 'RECRUITER') {
                whereClause = { role: 'USER' };
            } else {
                // Admins can chat with anyone
                whereClause = { id: { not: currentUser.id } };
            }

            const users = await prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                },
                orderBy: { name: 'asc' }
            });

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = chatController;