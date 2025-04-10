import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { Conversation } from "./lib/conversation.ts";
import { CUSTOMER_ID } from "./config.ts";

// Initialize the Hono app
const app = new Hono();

// Store user conversations (in memory for now)
const userConversations = new Map<string, Conversation>();

// Get or create a conversation for a user
function getUserConversation(userId: string): Conversation {
  if (!userConversations.has(userId)) {
    userConversations.set(
      userId,
      new Conversation(
        "You are a helpful and funny assistant who works for Viind. You always answer in Bavarian.",
      ),
    );
  }
  return userConversations.get(userId)!;
}

// Serve static files from the public directory
app.use("/static/*", serveStatic({ root: "./" }));

// Routes
app.get("/", async (c) => {
  return c.html(await Deno.readTextFile("./index.html"));
});

// Streaming Chat API endpoint
app.post("/api/chat/stream", async (c) => {
  const conversation = getUserConversation(CUSTOMER_ID);

  try {
    const body = await c.req.json();
    const message = body.message;

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    // Create a readable stream from the generator
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();
          for await (const chunk of conversation.streamMessage(message)) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error processing streaming chat:", error);
    return c.json({ error: "Failed to process message" }, 500);
  }
});

// Reset conversation endpoint
app.post("/api/reset", (c) => {
  const conversation = getUserConversation(CUSTOMER_ID);
  conversation.reset();
  return c.json({ success: true });
});

// Start the server
const port = 3000;
console.log(`Server is running on http://localhost:${port}`);
Deno.serve({ port }, app.fetch);
