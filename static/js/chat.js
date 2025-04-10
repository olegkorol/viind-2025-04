// DOM Elements
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const resetButton = document.getElementById("reset-button");

// Add a message to the UI
function addMessage(content, isUser) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message " + (isUser ? "user" : "assistant");
  messageDiv.textContent = content;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send a message to the API
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // Add user message to UI
  addMessage(message, true);
  messageInput.value = "";

  try {
    // Create a message div for the assistant's response
    const messageDiv = document.createElement("div");
    messageDiv.className = "message assistant";
    messagesContainer.appendChild(messageDiv);

    // Use streaming endpoint
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        content += chunk;
        messageDiv.textContent = content;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } else {
      addMessage("Error: Could not get a response.", false);
    }
  } catch (error) {
    console.error("Error:", error);
    addMessage("Error: Could not connect to the server.", false);
  }
}

// Reset the conversation
async function resetConversation() {
  try {
    const response = await fetch("/api/reset", {
      method: "POST",
    });

    if (response.ok) {
      messagesContainer.innerHTML = "";
      addMessage("Conversation has been reset.", false);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Event listeners
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
resetButton.addEventListener("click", resetConversation);
