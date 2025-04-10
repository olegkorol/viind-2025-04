import { OpenAIClient } from "./openai.ts";
import { BillingClient } from "./billing.ts";
import { CUSTOMER_ID } from "../config.ts";

/**
 * Conversation class for managing chat interactions with AI
 */
export class Conversation {
  private client: OpenAIClient;
  private billingClient: BillingClient;
  private systemPrompt?: string;
  private customerId: string; // This wouldn't be here...

  /**
   * Creates a new conversation instance
   * @param systemPrompt Optional system prompt to set initial context
   */
  constructor(systemPrompt?: string) {
    this.client = new OpenAIClient();
    this.billingClient = new BillingClient();

    if (systemPrompt) {
      this.systemPrompt = systemPrompt;
      this.client.setSystemPrompt(systemPrompt);
    }

    this.customerId = CUSTOMER_ID;
  }

  /**
   * Sends a message to the AI and streams the response tokens
   * @param message The message to send
   * @returns AsyncGenerator that yields response tokens
   */
  async *streamMessage(message: string): AsyncGenerator<string> {
    const hasCredits = await this.checkCredits();
    console.log("hasCredits", hasCredits);
    if (!hasCredits) {
      console.warn(
        `Customer ${this.customerId} has insufficient credits. The user request has been blocked.`,
      );
      yield "I'm sorry, but you don't have enough credits to chat with me :(";
      return;
    }
    yield* this.client.streamSend(message, this.systemPrompt);
  }

  /**
   * Checks whether the current customer has enough credits to
   * chat with the AI.
   * @returns True if the user has enough credits, false otherwise
   */
  async checkCredits(): Promise<boolean> {
    try {
      const customerId = this.customerId; // Hardcoded for now
      const senderId = "web-user-1"; // Hardcoded for now
      const inputChannel = "web"; // Hardcoded for now

      const credits = await this.billingClient.checkCredits(
        customerId,
        senderId,
        inputChannel,
      );
      return credits;
    } catch (error) {
      console.error("Error checking credits:", error);
      return false;
    }
  }

  /**
   * Clears the conversation history
   */
  reset(): void {
    this.client.resetConversation();

    // Re-apply system prompt if it exists
    if (this.systemPrompt) {
      this.client.setSystemPrompt(this.systemPrompt);
    }
  }

  /**
   * Gets the current conversation history
   */
  getHistory(): Array<{ role: string; content: string }> {
    return this.client.getConversationHistory();
  }

  /**
   * Updates the system prompt and resets the conversation
   * @param systemPrompt The new system prompt
   */
  updateSystemPrompt(systemPrompt: string): void {
    this.systemPrompt = systemPrompt;
    this.client.setSystemPrompt(systemPrompt);
  }
}
