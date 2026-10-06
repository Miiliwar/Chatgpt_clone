import express from "express";

const chatRouter = express.Router();

import {
  createConversationController,
  getConversationsController,
} from "./controller/chat.controller.js";
//  Side AI Chat,  Inline AI Chat
// /api/chat/conversations
chatRouter.post("/conversations", createConversationController);

chatRouter.get("/conversations", getConversationsController);

export default chatRouter;
