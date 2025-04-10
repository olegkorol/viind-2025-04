/**
 * BillingClient class for checking user credits with the billing GraphQL API
 */
export class BillingClient {
  private endpoint: string;
  private bearerToken: string | null;

  /**
   * Creates a new BillingClient instance
   * @param endpoint Optional GraphQL endpoint URL (defaults to the sandbox endpoint)
   */
  constructor(endpoint?: string) {
    this.endpoint = endpoint ||
      "https://sdp-sandbox-billing.cluster01.viind.io/graphql";
    this.bearerToken = Deno.env.get("BILLING_API_BEARER_TOKEN") || null;

    if (!this.bearerToken) {
      console.warn("BILLING_API_BEARER_TOKEN not set.");
    }
  }

  /**
   * Checks if a user has enough credits to start a new conversation
   * @param customerId The customer ID to check
   * @param senderId The sender/user ID for the conversation
   * @param inputChannel The channel through which the conversation is happening
   * @returns Promise<boolean> True if the user has enough credits, false otherwise
   */
  async checkCredits(
    customerId: string,
    senderId: string,
    inputChannel: string,
  ): Promise<boolean> {
    try {
      const query = `
        mutation CheckCredits($customerId: String!, $senderId: String!, $inputChannel: String!) {
          checkAvailableCredits(
            customerId: $customerId,
            senderId: $senderId,
            inputChannel: $inputChannel
          )
        }
      `;

      const variables = {
        customerId,
        senderId,
        inputChannel,
      };

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.bearerToken}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        console.error("Error checking credits:", await response.text());
        return false;
      }

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return false;
      }

      return data.checkAvailableCredits;
    } catch (error) {
      console.error("Failed to check credits:", error);
      return false;
    }
  }

  /**
   * TODO: Consumes credits for a customer after using the service
   */
  consumeCredits(
    _customerId: string,
    _creditsConsumed: number,
  ): boolean {
    // TODO: Implement
    return true;
  }

  /**
   * Gets the billing information for a customer
   * @param customerId The customer ID to check
   * @returns Promise with the billing information or null if not found
   */
  async getBillingInfo(customerId: string): Promise<any | null> {
    try {
      const query = `
        query GetBilling($customerId: String!) {
          billing(customerId: $customerId) {
            id
            customerId
            monthlyCredits
            usedCredits
            additionalCredits
            remainingCredits
            debtLimit
          }
        }
      `;

      const variables = {
        customerId,
      };

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.bearerToken}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        console.error("Error getting billing info:", await response.text());
        return null;
      }

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return null;
      }

      return data.billing;
    } catch (error) {
      console.error("Failed to get billing info:", error);
      return null;
    }
  }
}
