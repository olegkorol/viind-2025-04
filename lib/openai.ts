import { OpenAI } from "openai";

/**
 * OpenAI class for managing conversations with context
 */
export class OpenAIClient {
  private client: OpenAI;
  private apiKey: string;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private model: OpenAI.ChatModel = "gpt-4o";

  /**
   * Creates a new OpenAI conversation instance
   * @param model Optional model to use (defaults to gpt-4o)
   */
  constructor(model?: OpenAI.ChatModel) {
    this.apiKey = Deno.env.get("OPENAI_API_KEY") || "";

    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key is required. Provide it as a parameter or set OPENAI_API_KEY environment variable.",
      );
    }

    if (model) {
      this.model = model;
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  /**
   * Sends a message to OpenAI and streams the response tokens
   * @param message The message to send
   * @param systemPrompt Optional system prompt to set context
   * @returns AsyncGenerator that yields response tokens
   */
  async *streamSend(
    message: string,
    systemPrompt?: string,
  ): AsyncGenerator<string> {
    // Add system prompt if provided and conversation is new
    if (systemPrompt && this.conversationHistory.length === 0) {
      this.conversationHistory.push({
        role: "system",
        content: systemPrompt,
      });
    }

    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: message,
    });

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: this.conversationHistory.map((msg) => {
          const baseMessage = {
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content,
          };

          return baseMessage;
        }),
        stream: true,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          yield content;
        }
      }

      // After streaming complete, add the full response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
      });
    } catch (error) {
      console.error("Error streaming from OpenAI:", error);
      throw error;
    }
  }

  /**
   * Clears the conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Gets the current conversation history
   */
  getConversationHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }

  /**
   * Sets a custom system prompt and resets the conversation
   * @param systemPrompt The system prompt to set
   */
  setSystemPrompt(systemPrompt: string): void {
    this.resetConversation();
    this.conversationHistory.push({
      role: "system",
      content: systemPrompt,
    });
  }
}
