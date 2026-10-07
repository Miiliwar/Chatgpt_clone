import {
  createConversationService,
  getConversationService,
  getRecentConversationRows,
} from "../service/chat.service.js";

export async function createConversationController(req, res, next) {
  try {
    const { question } = req.body;
    const result = await createConversationService(question);
    res.status(201).json({
      success: true,
      message: "successfully posted conversation",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getConversationsController(req, res, next) {
  try {
    const result = await getRecentConversationRows(100);
    res.status(200).json({
      success: true,
      message: "Conversations fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error); // ✅ Changed from throw error to next(error) so your error handler catches it
  }
}

export async function getConversationController(req, res, next) {
  try {
    const result = await getConversationService();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
