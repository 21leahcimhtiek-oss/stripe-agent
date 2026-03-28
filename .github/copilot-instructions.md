# GitHub Copilot Instructions for Stripe Agent

## Project Overview

**Stripe Agent** is an AI-powered conversational Stripe management platform that enables natural language interaction with Stripe's API. Users can manage customers, subscriptions, payments, and more through an intelligent chat interface.

### Core Features
- **Conversational Stripe Management**: Natural language commands for Stripe operations
- **GitHub Integration**: AI-powered GitHub operations alongside Stripe management
- **Real-time Data**: Live Stripe dashboard with customer and subscription insights
- **Webhook Handling**: Automated Stripe webhook processing
- **Multi-tenant Support**: Secure user authentication and data isolation

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Monaco Editor |
| Backend | Express, tRPC 11 |
| Database | MySQL with Drizzle ORM |
| Auth | JWT (jose), HTTP-only cookies |
| Payments | Stripe 20 |
| Storage | AWS S3 |
| Build | Vite 7, esbuild, TypeScript 5.9 |

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (with hot reload)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm check

# Code formatting
pnpm format

# Run tests
pnpm test

# Database operations
pnpm db:push        # Generate and run migrations
```

## Project Structure

```
stripe-agent/
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/       # shadcn/ui components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities and tRPC client
│   └── index.html
├── server/                   # Express backend
│   ├── _core/               # Framework internals
│   │   ├── index.ts         # Server entry point
│   │   └── ...              # Auth, tRPC setup
│   ├── routers.ts           # tRPC API procedures
│   ├── db.ts                # Database queries
│   ├── stripeTools.ts       # Stripe API tools
│   ├── githubTools.ts       # GitHub API tools
│   ├── webhook.ts           # Stripe webhook handler
│   └── *.test.ts            # Vitest tests
├── shared/                   # Shared types and utilities
├── drizzle/                  # Database schema
│   └── schema.ts            # Table definitions
├── drizzle.config.ts         # Drizzle configuration
├── vite.config.ts           # Vite build config
└── package.json
```

## Key Patterns & Conventions

### Database Changes
1. **Always** update `drizzle/schema.ts` first
2. Run `pnpm db:push` to generate and apply migrations
3. Update query functions in `server/db.ts`

### tRPC API Structure
```typescript
// server/routers.ts
import { router, publicProcedure, protectedProcedure } from './trpc';
import { z } from 'zod';

export const appRouter = router({
  // Stripe operations
  stripe: router({
    customers: protectedProcedure.query(async ({ ctx }) => {
      return ctx.stripe.customers.list();
    }),
    createCustomer: protectedProcedure
      .input(z.object({ email: z.string(), name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return ctx.stripe.customers.create(input);
      }),
  }),
  
  // GitHub operations
  github: router({
    repos: protectedProcedure.query(async ({ ctx }) => {
      return ctx.octokit.repos.listForUser();
    }),
  }),
});
```

### Stripe Tools Pattern
```typescript
// server/stripeTools.ts
export const stripeTools = {
  listCustomers: async (stripe: Stripe) => {
    return stripe.customers.list();
  },
  
  createSubscription: async (stripe: Stripe, customerId: string, priceId: string) => {
    return stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  },
  
  // ... more tools
};
```

### Frontend State Management
- Use `@tanstack/react-query` with tRPC: `trpc.stripe.customers.useQuery()`
- Mutations: `trpc.stripe.createCustomer.useMutation()`
- Handle loading and error states gracefully

### Authentication Flow
1. User authenticates via OAuth or email/password
2. Server creates JWT token using `jose`
3. Token stored in HTTP-only cookie
4. Protected procedures verify token and inject user into context

## Stripe Integration

### Webhook Handling
```typescript
// server/webhook.ts
import Stripe from 'stripe';

export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.created':
      // Handle customer creation
      break;
    case 'invoice.paid':
      // Handle successful payment
      break;
    case 'customer.subscription.updated':
      // Handle subscription changes
      break;
  }
}
```

### Required Environment Variables
```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_...

# Database
DATABASE_URL=mysql://...

# Auth
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# GitHub (optional)
GITHUB_TOKEN=ghp_...

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
S3_BUCKET=...
```

## Change Expectations

### Adding New Stripe Operations
1. Add tool function in `server/stripeTools.ts`
2. Create tRPC procedure in `server/routers.ts`
3. Add frontend component in `client/src/components/`
4. Write tests in `server/*.test.ts`

### Code Style
- Use TypeScript for all code
- Follow existing naming conventions
- Use Zod for input validation
- Handle errors gracefully with user-friendly messages

### Testing
- Write tests for all new procedures
- Use Vitest's assertion library
- Mock Stripe API calls in tests

## Testing Guidance

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/stripe-agent.test.ts

# Run with coverage
pnpm test --coverage
```

### Test Structure
```typescript
import { describe, it, expect } from 'vitest';

describe('Stripe Tools', () => {
  it('should list customers', async () => {
    const result = await stripeTools.listCustomers(mockStripe);
    expect(result.data).toBeDefined();
  });
});
```

## Security Notes

- **Never** expose Stripe secret keys on the client
- Validate all webhook signatures
- Use idempotency keys for Stripe operations
- Implement rate limiting for API endpoints
- Sanitize user inputs before Stripe API calls

## Common Issues & Solutions

### Stripe API Errors
- Check API key validity (test vs. live mode)
- Verify webhook secret is correct
- Handle rate limits with exponential backoff

### Authentication Issues
- Verify JWT_SECRET is set
- Check cookie settings (secure, httpOnly)
- Ensure token hasn't expired

### Build Failures
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check TypeScript errors: `pnpm check`
- Verify all environment variables are set

## Deployment Notes

- Set all environment variables in production
- Configure Stripe webhook URL in Stripe Dashboard
- Use HTTPS in production
- Monitor Stripe webhook logs for issues

---

**Happy coding!** 🚀 Stripe Agent - AI-powered conversational payment management.