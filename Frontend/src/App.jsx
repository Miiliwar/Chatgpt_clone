import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageList from "./components/MessageList/MessageList";
import ChatInput from "./components/ChatInput/ChatInput";
import "./App.css";

const API_BASE_URL = "http://localhost:3888/api";

function App() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isLoading]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/conversations`);
      if (response.data.success) {
        // ✅ FIXED: The backend sends an array directly. There is no ".conversations" property.
        const data = response.data.data;
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    }
  };

  const handleSendMessage = async (question) => {
    // 1. Optimistically add user message
    const tempUserMessage = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    // Safely add to array
    setConversations((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      tempUserMessage,
    ]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat/conversations`, {
        question,
      });

      if (response.data.success) {
        // ✅ FIXED: The backend only returns { assistantAnswer: "..." }
        const aiText = response.data.data.assistantAnswer;

        setConversations((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          // Remove the temporary message
          const filtered = safePrev.filter(
            (msg) => msg.id !== tempUserMessage.id,
          );

          // Create proper objects for the UI
          const userMessage = {
            id: Date.now() - 1,
            role: "user",
            content: question,
          };
          const aiMessage = {
            id: Date.now(),
            role: "assistant",
            content: aiText,
          };

          return [...filtered, userMessage, aiMessage];
        });
      }
    } catch (error) {
      console.error("Error posting conversation:", error);

      const errorMessage =
        error.response?.data?.message ||
        "There was an error generating a response.";

      setConversations((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [
          ...safePrev,
          { id: Date.now() + 1, role: "assistant", content: errorMessage },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar />

      <main className="chat">
        <ChatHeader />

        <MessageList
          conversations={conversations}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;
