# viind-2025-04

## Requirements

- [Deno (v2)](https://deno.com)

(Alternatively, a devbox environment with Deno v2 installed has been provided)

## Quickstart

Set environment variables:

```bash
cp .env.example .env.local
# And set an OpenAI API key and Billing API Bearer Token
```

Set a customer-id in `config.ts`, to simulate the current customer:

```ts
// ./config.ts
export const CUSTOMER_ID = "1234";
// Two options:
//  "1234" (which has credits available)
//  "4321" (which has no credits available)
```

Start the server:

```bash
deno run dev
```

Open the browser and navigate to:

```bash
http://localhost:3000
```

If you selected customer "1234", you should be able to chat without any issues.
If you selected customer "4321", you should see a message that you have no
credits left.

## Notes

- The API has no AuthN/AuthZ implemented (at all).
- The GraphQL API is accessed via raw `fetch` calls, instead of a proper client.
- We should also implement rate limiting.
- Many things are hardcoded.
- The UI is quite "simple".
