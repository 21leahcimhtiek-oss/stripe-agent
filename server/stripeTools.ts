/**
 * Stripe tool definitions for the AI agent.
 * Each tool maps to a Stripe API operation and is exposed to the LLM via function calling.
 */

import stripe from "./stripe";

// ─── Tool Definitions (for LLM) ──────────────────────────────────────────────

export const STRIPE_TOOLS = [
  // Customers
  {
    type: "function" as const,
    function: {
      name: "list_customers",
      description: "List Stripe customers, optionally filtered by email or name. Returns up to 20 customers.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Filter by exact email address" },
          limit: { type: "number", description: "Number of customers to return (max 20)" },
          starting_after: { type: "string", description: "Cursor for pagination (customer ID)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_customer",
      description: "Get a specific Stripe customer by their ID.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The Stripe customer ID (cus_...)" },
        },
        required: ["customer_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_customer",
      description: "Create a new Stripe customer.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Customer email address" },
          name: { type: "string", description: "Customer full name" },
          phone: { type: "string", description: "Customer phone number" },
          description: { type: "string", description: "Internal description/notes about the customer" },
          metadata: { type: "object", description: "Key-value metadata to attach to the customer" },
        },
        required: ["email"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_customer",
      description: "Update an existing Stripe customer.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The Stripe customer ID (cus_...)" },
          email: { type: "string", description: "New email address" },
          name: { type: "string", description: "New name" },
          phone: { type: "string", description: "New phone number" },
          description: { type: "string", description: "New description" },
          metadata: { type: "object", description: "Metadata to merge" },
        },
        required: ["customer_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_customer",
      description: "Delete a Stripe customer permanently.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The Stripe customer ID (cus_...)" },
        },
        required: ["customer_id"],
        additionalProperties: false,
      },
    },
  },
  // Products
  {
    type: "function" as const,
    function: {
      name: "list_products",
      description: "List all Stripe products.",
      parameters: {
        type: "object",
        properties: {
          active: { type: "boolean", description: "Filter by active status" },
          limit: { type: "number", description: "Number of products to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_product",
      description: "Create a new Stripe product.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Product name" },
          description: { type: "string", description: "Product description" },
          active: { type: "boolean", description: "Whether the product is active (default true)" },
          metadata: { type: "object", description: "Key-value metadata" },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_product",
      description: "Update an existing Stripe product.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "The Stripe product ID (prod_...)" },
          name: { type: "string", description: "New product name" },
          description: { type: "string", description: "New description" },
          active: { type: "boolean", description: "Active status" },
        },
        required: ["product_id"],
        additionalProperties: false,
      },
    },
  },
  // Prices
  {
    type: "function" as const,
    function: {
      name: "list_prices",
      description: "List prices for a product or all prices.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "Filter by product ID" },
          active: { type: "boolean", description: "Filter by active status" },
          limit: { type: "number", description: "Number of prices to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_price",
      description: "Create a new price for a product. For recurring prices (subscriptions), set recurring.interval.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "The Stripe product ID" },
          unit_amount: { type: "number", description: "Price in cents (e.g. 999 for $9.99)" },
          currency: { type: "string", description: "3-letter ISO currency code (e.g. 'usd')" },
          nickname: { type: "string", description: "Optional nickname for the price" },
          recurring: {
            type: "object",
            description: "For subscription prices",
            properties: {
              interval: { type: "string", enum: ["day", "week", "month", "year"] },
              interval_count: { type: "number" },
            },
          },
        },
        required: ["product_id", "unit_amount", "currency"],
        additionalProperties: false,
      },
    },
  },
  // Subscriptions
  {
    type: "function" as const,
    function: {
      name: "list_subscriptions",
      description: "List Stripe subscriptions, optionally filtered by customer or status.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Filter by customer ID" },
          status: {
            type: "string",
            enum: ["active", "canceled", "incomplete", "incomplete_expired", "past_due", "trialing", "unpaid", "paused"],
            description: "Filter by subscription status",
          },
          limit: { type: "number", description: "Number of subscriptions to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_subscription",
      description: "Get a specific Stripe subscription by ID.",
      parameters: {
        type: "object",
        properties: {
          subscription_id: { type: "string", description: "The Stripe subscription ID (sub_...)" },
        },
        required: ["subscription_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_subscription",
      description: "Create a new subscription for a customer.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The Stripe customer ID" },
          price_id: { type: "string", description: "The Stripe price ID" },
          trial_period_days: { type: "number", description: "Number of trial days" },
          metadata: { type: "object", description: "Key-value metadata" },
        },
        required: ["customer_id", "price_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cancel_subscription",
      description: "Cancel a Stripe subscription immediately or at period end.",
      parameters: {
        type: "object",
        properties: {
          subscription_id: { type: "string", description: "The Stripe subscription ID" },
          at_period_end: { type: "boolean", description: "If true, cancel at end of billing period (default false)" },
        },
        required: ["subscription_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "pause_subscription",
      description: "Pause a Stripe subscription collection.",
      parameters: {
        type: "object",
        properties: {
          subscription_id: { type: "string", description: "The Stripe subscription ID" },
          resumes_at: { type: "number", description: "Unix timestamp when to resume (optional)" },
        },
        required: ["subscription_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "resume_subscription",
      description: "Resume a paused Stripe subscription.",
      parameters: {
        type: "object",
        properties: {
          subscription_id: { type: "string", description: "The Stripe subscription ID" },
        },
        required: ["subscription_id"],
        additionalProperties: false,
      },
    },
  },
  // Invoices
  {
    type: "function" as const,
    function: {
      name: "list_invoices",
      description: "List Stripe invoices, optionally filtered by customer or status.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Filter by customer ID" },
          status: {
            type: "string",
            enum: ["draft", "open", "paid", "uncollectible", "void"],
            description: "Filter by invoice status",
          },
          limit: { type: "number", description: "Number of invoices to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_invoice",
      description: "Get a specific Stripe invoice by ID.",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "The Stripe invoice ID (in_...)" },
        },
        required: ["invoice_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_invoice",
      description: "Create a new draft invoice for a customer.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The Stripe customer ID" },
          description: { type: "string", description: "Invoice description" },
          collection_method: {
            type: "string",
            enum: ["charge_automatically", "send_invoice"],
            description: "How to collect payment",
          },
          days_until_due: { type: "number", description: "Days until invoice is due (for send_invoice)" },
        },
        required: ["customer_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "finalize_invoice",
      description: "Finalize a draft invoice (makes it open and ready to pay).",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "The Stripe invoice ID" },
        },
        required: ["invoice_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_invoice",
      description: "Send an open invoice to the customer by email.",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "The Stripe invoice ID" },
        },
        required: ["invoice_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "void_invoice",
      description: "Void an open invoice.",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "The Stripe invoice ID" },
        },
        required: ["invoice_id"],
        additionalProperties: false,
      },
    },
  },
  // Payments / Charges
  {
    type: "function" as const,
    function: {
      name: "list_payment_intents",
      description: "List Stripe payment intents.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Filter by customer ID" },
          limit: { type: "number", description: "Number of payment intents to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_charges",
      description: "List Stripe charges (completed payments).",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Filter by customer ID" },
          limit: { type: "number", description: "Number of charges to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_refund",
      description: "Refund a charge fully or partially.",
      parameters: {
        type: "object",
        properties: {
          charge_id: { type: "string", description: "The Stripe charge ID (ch_...)" },
          amount: { type: "number", description: "Amount to refund in cents (omit for full refund)" },
          reason: {
            type: "string",
            enum: ["duplicate", "fraudulent", "requested_by_customer"],
            description: "Reason for refund",
          },
        },
        required: ["charge_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_refunds",
      description: "List refunds for a charge or all refunds.",
      parameters: {
        type: "object",
        properties: {
          charge_id: { type: "string", description: "Filter by charge ID" },
          limit: { type: "number", description: "Number of refunds to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  // Balance
  {
    type: "function" as const,
    function: {
      name: "get_balance",
      description: "Get the current Stripe account balance.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  // Coupons / Discounts
  {
    type: "function" as const,
    function: {
      name: "list_coupons",
      description: "List all Stripe coupons.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of coupons to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_coupon",
      description: "Create a new Stripe coupon.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Coupon display name" },
          percent_off: { type: "number", description: "Percentage discount (e.g. 20 for 20%)" },
          amount_off: { type: "number", description: "Fixed amount off in cents (alternative to percent_off)" },
          currency: { type: "string", description: "Currency for amount_off (e.g. 'usd')" },
          duration: {
            type: "string",
            enum: ["forever", "once", "repeating"],
            description: "How long the coupon applies",
          },
          duration_in_months: { type: "number", description: "If duration=repeating, how many months" },
          max_redemptions: { type: "number", description: "Maximum number of times coupon can be used" },
        },
        required: ["duration"],
        additionalProperties: false,
      },
    },
  },
] as const;

// ─── Tool Executor ────────────────────────────────────────────────────────────

export async function executeStripeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    // Customers
    case "list_customers": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.email) params.email = args.email;
      if (args.starting_after) params.starting_after = args.starting_after;
      const result = await stripe.customers.list(params as Parameters<typeof stripe.customers.list>[0]);
      return { data: result.data, has_more: result.has_more };
    }
    case "get_customer": {
      return await stripe.customers.retrieve(args.customer_id as string);
    }
    case "create_customer": {
      return await stripe.customers.create({
        email: args.email as string,
        name: args.name as string | undefined,
        phone: args.phone as string | undefined,
        description: args.description as string | undefined,
        metadata: args.metadata as Record<string, string> | undefined,
      });
    }
    case "update_customer": {
      const { customer_id, ...rest } = args;
      return await stripe.customers.update(customer_id as string, rest as Parameters<typeof stripe.customers.update>[1]);
    }
    case "delete_customer": {
      return await stripe.customers.del(args.customer_id as string);
    }

    // Products
    case "list_products": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.active !== undefined) params.active = args.active;
      return await stripe.products.list(params as Parameters<typeof stripe.products.list>[0]);
    }
    case "create_product": {
      return await stripe.products.create({
        name: args.name as string,
        description: args.description as string | undefined,
        active: args.active !== undefined ? (args.active as boolean) : true,
        metadata: args.metadata as Record<string, string> | undefined,
      });
    }
    case "update_product": {
      const { product_id, ...rest } = args;
      return await stripe.products.update(product_id as string, rest as Parameters<typeof stripe.products.update>[1]);
    }

    // Prices
    case "list_prices": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.product_id) params.product = args.product_id;
      if (args.active !== undefined) params.active = args.active;
      return await stripe.prices.list(params as Parameters<typeof stripe.prices.list>[0]);
    }
    case "create_price": {
      const priceParams: Parameters<typeof stripe.prices.create>[0] = {
        product: args.product_id as string,
        unit_amount: args.unit_amount as number,
        currency: args.currency as string,
        nickname: args.nickname as string | undefined,
      };
      if (args.recurring) {
        priceParams.recurring = args.recurring as { interval: "day" | "week" | "month" | "year"; interval_count?: number };
      }
      return await stripe.prices.create(priceParams);
    }

    // Subscriptions
    case "list_subscriptions": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.customer_id) params.customer = args.customer_id;
      if (args.status) params.status = args.status;
      return await stripe.subscriptions.list(params as Parameters<typeof stripe.subscriptions.list>[0]);
    }
    case "get_subscription": {
      return await stripe.subscriptions.retrieve(args.subscription_id as string);
    }
    case "create_subscription": {
      return await stripe.subscriptions.create({
        customer: args.customer_id as string,
        items: [{ price: args.price_id as string }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
        trial_period_days: args.trial_period_days as number | undefined,
        metadata: args.metadata as Record<string, string> | undefined,
      });
    }
    case "cancel_subscription": {
      if (args.at_period_end) {
        return await stripe.subscriptions.update(args.subscription_id as string, { cancel_at_period_end: true });
      }
      return await stripe.subscriptions.cancel(args.subscription_id as string);
    }
    case "pause_subscription": {
      const pauseParams: Parameters<typeof stripe.subscriptions.update>[1] = {
        pause_collection: { behavior: "void" },
      };
      if (args.resumes_at) {
        pauseParams.pause_collection = { behavior: "void", resumes_at: args.resumes_at as number };
      }
      return await stripe.subscriptions.update(args.subscription_id as string, pauseParams);
    }
    case "resume_subscription": {
      return await stripe.subscriptions.update(args.subscription_id as string, {
        pause_collection: "",
      } as Parameters<typeof stripe.subscriptions.update>[1]);
    }

    // Invoices
    case "list_invoices": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.customer_id) params.customer = args.customer_id;
      if (args.status) params.status = args.status;
      return await stripe.invoices.list(params as Parameters<typeof stripe.invoices.list>[0]);
    }
    case "get_invoice": {
      return await stripe.invoices.retrieve(args.invoice_id as string);
    }
    case "create_invoice": {
      return await stripe.invoices.create({
        customer: args.customer_id as string,
        description: args.description as string | undefined,
        collection_method: (args.collection_method as "charge_automatically" | "send_invoice") ?? "charge_automatically",
        days_until_due: args.days_until_due as number | undefined,
      });
    }
    case "finalize_invoice": {
      return await stripe.invoices.finalizeInvoice(args.invoice_id as string);
    }
    case "send_invoice": {
      return await stripe.invoices.sendInvoice(args.invoice_id as string);
    }
    case "void_invoice": {
      return await stripe.invoices.voidInvoice(args.invoice_id as string);
    }

    // Payments
    case "list_payment_intents": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.customer_id) params.customer = args.customer_id;
      return await stripe.paymentIntents.list(params as Parameters<typeof stripe.paymentIntents.list>[0]);
    }
    case "list_charges": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.customer_id) params.customer = args.customer_id;
      return await stripe.charges.list(params as Parameters<typeof stripe.charges.list>[0]);
    }
    case "create_refund": {
      return await stripe.refunds.create({
        charge: args.charge_id as string,
        amount: args.amount as number | undefined,
        reason: args.reason as "duplicate" | "fraudulent" | "requested_by_customer" | undefined,
      });
    }
    case "list_refunds": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.charge_id) params.charge = args.charge_id;
      return await stripe.refunds.list(params as Parameters<typeof stripe.refunds.list>[0]);
    }

    // Balance
    case "get_balance": {
      return await stripe.balance.retrieve();
    }

    // Coupons
    case "list_coupons": {
      return await stripe.coupons.list({ limit: Math.min(Number(args.limit ?? 20), 20) });
    }
    case "create_coupon": {
      return await stripe.coupons.create({
        duration: args.duration as "forever" | "once" | "repeating",
        name: args.name as string | undefined,
        percent_off: args.percent_off as number | undefined,
        amount_off: args.amount_off as number | undefined,
        currency: args.currency as string | undefined,
        duration_in_months: args.duration_in_months as number | undefined,
        max_redemptions: args.max_redemptions as number | undefined,
      });
    }

    default:
      throw new Error(`Unknown Stripe tool: ${name}`);
  }
}
