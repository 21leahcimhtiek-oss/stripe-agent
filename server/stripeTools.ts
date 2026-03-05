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
  // Disputes
  {
    type: "function" as const,
    function: {
      name: "list_disputes",
      description: "List Stripe disputes (chargebacks).",
      parameters: {
        type: "object",
        properties: {
          charge_id: { type: "string", description: "Filter by charge ID" },
          status: { type: "string", enum: ["needs_response", "under_review", "charge_refunded", "won", "lost", "warning_needs_response", "warning_under_review", "warning_closed"], description: "Filter by dispute status" },
          limit: { type: "number", description: "Number of disputes to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_dispute",
      description: "Retrieve a specific Stripe dispute by ID.",
      parameters: {
        type: "object",
        properties: {
          dispute_id: { type: "string", description: "The Stripe dispute ID (dp_...)" },
        },
        required: ["dispute_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_dispute",
      description: "Update a Stripe dispute with evidence or metadata.",
      parameters: {
        type: "object",
        properties: {
          dispute_id: { type: "string", description: "The Stripe dispute ID" },
          evidence: { type: "object", description: "Evidence object with fields like customer_email_address, customer_name, product_description, refund_policy, etc." },
          metadata: { type: "object", description: "Key-value metadata" },
          submit: { type: "boolean", description: "Whether to submit the dispute evidence immediately" },
        },
        required: ["dispute_id"],
        additionalProperties: false,
      },
    },
  },
  // Payment Methods
  {
    type: "function" as const,
    function: {
      name: "list_payment_methods",
      description: "List payment methods for a customer.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The Stripe customer ID" },
          type: { type: "string", enum: ["card", "us_bank_account", "sepa_debit", "paypal"], description: "Payment method type" },
        },
        required: ["customer_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "detach_payment_method",
      description: "Detach a payment method from a customer.",
      parameters: {
        type: "object",
        properties: {
          payment_method_id: { type: "string", description: "The Stripe payment method ID (pm_...)" },
        },
        required: ["payment_method_id"],
        additionalProperties: false,
      },
    },
  },
  // Transfers & Payouts
  {
    type: "function" as const,
    function: {
      name: "list_transfers",
      description: "List Stripe transfers to connected accounts.",
      parameters: {
        type: "object",
        properties: {
          destination: { type: "string", description: "Filter by destination account ID" },
          limit: { type: "number", description: "Number of transfers to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_transfer",
      description: "Create a transfer to a connected Stripe account.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Amount in cents" },
          currency: { type: "string", description: "3-letter ISO currency code" },
          destination: { type: "string", description: "Connected account ID (acct_...)" },
          description: { type: "string", description: "Transfer description" },
        },
        required: ["amount", "currency", "destination"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_payouts",
      description: "List Stripe payouts to your bank account.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["paid", "pending", "in_transit", "canceled", "failed"], description: "Filter by payout status" },
          limit: { type: "number", description: "Number of payouts to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  // Tax Rates
  {
    type: "function" as const,
    function: {
      name: "list_tax_rates",
      description: "List Stripe tax rates.",
      parameters: {
        type: "object",
        properties: {
          active: { type: "boolean", description: "Filter by active status" },
          inclusive: { type: "boolean", description: "Filter by inclusive/exclusive" },
          limit: { type: "number", description: "Number of tax rates to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_tax_rate",
      description: "Create a new Stripe tax rate.",
      parameters: {
        type: "object",
        properties: {
          display_name: { type: "string", description: "Tax rate display name (e.g. 'VAT')" },
          percentage: { type: "number", description: "Tax percentage (e.g. 20 for 20%)" },
          inclusive: { type: "boolean", description: "Whether the tax is inclusive in the price" },
          country: { type: "string", description: "Two-letter ISO country code" },
          description: { type: "string", description: "Internal description" },
        },
        required: ["display_name", "percentage", "inclusive"],
        additionalProperties: false,
      },
    },
  },
  // Checkout Sessions
  {
    type: "function" as const,
    function: {
      name: "list_checkout_sessions",
      description: "List Stripe Checkout sessions.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Filter by customer ID" },
          status: { type: "string", enum: ["open", "complete", "expired"], description: "Filter by session status" },
          limit: { type: "number", description: "Number of sessions to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_checkout_session",
      description: "Create a Stripe Checkout session for one-time payment or subscription.",
      parameters: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["payment", "subscription", "setup"], description: "Checkout mode" },
          price_id: { type: "string", description: "The price ID to checkout" },
          quantity: { type: "number", description: "Quantity (default 1)" },
          customer_id: { type: "string", description: "Existing customer ID (optional)" },
          customer_email: { type: "string", description: "Pre-fill customer email" },
          success_url: { type: "string", description: "URL to redirect on success" },
          cancel_url: { type: "string", description: "URL to redirect on cancel" },
          allow_promotion_codes: { type: "boolean", description: "Allow promo codes at checkout" },
        },
        required: ["mode", "price_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "expire_checkout_session",
      description: "Expire an open Stripe Checkout session.",
      parameters: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "The Stripe Checkout session ID (cs_...)" },
        },
        required: ["session_id"],
        additionalProperties: false,
      },
    },
  },
  // Payment Links
  {
    type: "function" as const,
    function: {
      name: "list_payment_links",
      description: "List Stripe Payment Links.",
      parameters: {
        type: "object",
        properties: {
          active: { type: "boolean", description: "Filter by active status" },
          limit: { type: "number", description: "Number of payment links to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_payment_link",
      description: "Create a shareable Stripe Payment Link.",
      parameters: {
        type: "object",
        properties: {
          price_id: { type: "string", description: "The Stripe price ID" },
          quantity: { type: "number", description: "Quantity (default 1)" },
          allow_promotion_codes: { type: "boolean", description: "Allow promo codes" },
          after_completion_type: { type: "string", enum: ["redirect", "hosted_confirmation"], description: "What to show after payment" },
          after_completion_url: { type: "string", description: "Redirect URL if after_completion_type is redirect" },
        },
        required: ["price_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_payment_link",
      description: "Update a Stripe Payment Link (e.g. deactivate it).",
      parameters: {
        type: "object",
        properties: {
          payment_link_id: { type: "string", description: "The Stripe payment link ID (plink_...)" },
          active: { type: "boolean", description: "Set to false to deactivate the link" },
        },
        required: ["payment_link_id"],
        additionalProperties: false,
      },
    },
  },
  // Promotion Codes
  {
    type: "function" as const,
    function: {
      name: "list_promotion_codes",
      description: "List Stripe promotion codes.",
      parameters: {
        type: "object",
        properties: {
          coupon_id: { type: "string", description: "Filter by coupon ID" },
          active: { type: "boolean", description: "Filter by active status" },
          code: { type: "string", description: "Filter by exact promo code string" },
          limit: { type: "number", description: "Number of promo codes to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_promotion_code",
      description: "Create a new Stripe promotion code for a coupon.",
      parameters: {
        type: "object",
        properties: {
          coupon_id: { type: "string", description: "The Stripe coupon ID to attach the promo code to" },
          code: { type: "string", description: "The promo code string (e.g. SAVE20). Auto-generated if omitted." },
          max_redemptions: { type: "number", description: "Maximum number of times this code can be redeemed" },
          expires_at: { type: "number", description: "Unix timestamp when the code expires" },
        },
        required: ["coupon_id"],
        additionalProperties: false,
      },
    },
  },
  // Credit Notes
  {
    type: "function" as const,
    function: {
      name: "list_credit_notes",
      description: "List Stripe credit notes.",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "Filter by invoice ID" },
          limit: { type: "number", description: "Number of credit notes to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_credit_note",
      description: "Create a credit note to reduce the amount owed on an invoice.",
      parameters: {
        type: "object",
        properties: {
          invoice_id: { type: "string", description: "The Stripe invoice ID to credit" },
          amount: { type: "number", description: "Amount to credit in cents" },
          reason: { type: "string", enum: ["duplicate", "fraudulent", "order_change", "product_unsatisfactory"], description: "Reason for the credit note" },
          memo: { type: "string", description: "Internal memo" },
        },
        required: ["invoice_id", "amount"],
        additionalProperties: false,
      },
    },
  },
  // Webhook Endpoints
  {
    type: "function" as const,
    function: {
      name: "list_webhook_endpoints",
      description: "List configured Stripe webhook endpoints.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of endpoints to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_webhook_endpoint",
      description: "Register a new Stripe webhook endpoint URL.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The HTTPS URL to receive webhook events" },
          enabled_events: { type: "array", items: { type: "string" }, description: "List of event types to subscribe to (e.g. ['payment_intent.succeeded', 'customer.created']). Use ['*'] for all events." },
          description: { type: "string", description: "Optional description for this endpoint" },
        },
        required: ["url", "enabled_events"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_webhook_endpoint",
      description: "Delete a Stripe webhook endpoint.",
      parameters: {
        type: "object",
        properties: {
          webhook_endpoint_id: { type: "string", description: "The Stripe webhook endpoint ID (we_...)" },
        },
        required: ["webhook_endpoint_id"],
        additionalProperties: false,
      },
    },
  },
  // Customer Portal
  {
    type: "function" as const,
    function: {
      name: "create_billing_portal_session",
      description: "Create a Stripe Customer Portal session so a customer can manage their own subscriptions and billing.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The Stripe customer ID" },
          return_url: { type: "string", description: "URL to return to after the portal session" },
        },
        required: ["customer_id"],
        additionalProperties: false,
      },
    },
  },
  // Setup Intents
  {
    type: "function" as const,
    function: {
      name: "list_setup_intents",
      description: "List Stripe Setup Intents for saving payment methods.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Filter by customer ID" },
          limit: { type: "number", description: "Number of setup intents to return (max 20)" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_setup_intent",
      description: "Create a Stripe Setup Intent to save a payment method for future use.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The Stripe customer ID" },
          payment_method_types: { type: "array", items: { type: "string" }, description: "Payment method types to allow (e.g. ['card'])" },
          usage: { type: "string", enum: ["off_session", "on_session"], description: "How the setup intent will be used" },
        },
        required: ["customer_id"],
        additionalProperties: false,
      },
    },
  },
  // Stripe Search
  {
    type: "function" as const,
    function: {
      name: "search_stripe",
      description: "Search Stripe objects using the Stripe Search API. Supports customers, subscriptions, invoices, and charges.",
      parameters: {
        type: "object",
        properties: {
          resource: { type: "string", enum: ["customers", "subscriptions", "invoices", "charges", "payment_intents"], description: "The Stripe resource type to search" },
          query: { type: "string", description: "Stripe search query string (e.g. \"email:'test@example.com'\", \"status:'active'\", \"amount>1000\")" },
          limit: { type: "number", description: "Number of results to return (max 20)" },
        },
        required: ["resource", "query"],
        additionalProperties: false,
      },
    },
  },
  // Coupons
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

    // Disputes
    case "list_disputes": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.charge_id) params.charge = args.charge_id;
      if (args.status) params.status = args.status;
      return await stripe.disputes.list(params as Parameters<typeof stripe.disputes.list>[0]);
    }
    case "get_dispute": {
      return await stripe.disputes.retrieve(args.dispute_id as string);
    }
    case "update_dispute": {
      const { dispute_id, submit, ...rest } = args;
      const updateParams: Parameters<typeof stripe.disputes.update>[1] = {};
      if (rest.evidence) (updateParams as Record<string, unknown>).evidence = rest.evidence;
      if (rest.metadata) updateParams.metadata = rest.metadata as Record<string, string>;
      if (submit) updateParams.submit = submit as boolean;
      return await stripe.disputes.update(dispute_id as string, updateParams);
    }

    // Payment Methods
    case "list_payment_methods": {
      return await stripe.paymentMethods.list({
        customer: args.customer_id as string,
        type: (args.type ?? "card") as "card",
      });
    }
    case "detach_payment_method": {
      return await stripe.paymentMethods.detach(args.payment_method_id as string);
    }

    // Transfers & Payouts
    case "list_transfers": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.destination) params.destination = args.destination;
      return await stripe.transfers.list(params as Parameters<typeof stripe.transfers.list>[0]);
    }
    case "create_transfer": {
      return await stripe.transfers.create({
        amount: args.amount as number,
        currency: args.currency as string,
        destination: args.destination as string,
        description: args.description as string | undefined,
      });
    }
    case "list_payouts": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.status) params.status = args.status;
      return await stripe.payouts.list(params as Parameters<typeof stripe.payouts.list>[0]);
    }

    // Tax Rates
    case "list_tax_rates": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.active !== undefined) params.active = args.active;
      if (args.inclusive !== undefined) params.inclusive = args.inclusive;
      return await stripe.taxRates.list(params as Parameters<typeof stripe.taxRates.list>[0]);
    }
    case "create_tax_rate": {
      return await stripe.taxRates.create({
        display_name: args.display_name as string,
        percentage: args.percentage as number,
        inclusive: args.inclusive as boolean,
        country: args.country as string | undefined,
        description: args.description as string | undefined,
      });
    }

    // Checkout Sessions
    case "list_checkout_sessions": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.customer_id) params.customer = args.customer_id;
      if (args.status) params.status = args.status;
      return await stripe.checkout.sessions.list(params as Parameters<typeof stripe.checkout.sessions.list>[0]);
    }
    case "create_checkout_session": {
      return await stripe.checkout.sessions.create({
        mode: args.mode as "payment" | "subscription" | "setup",
        line_items: [{ price: args.price_id as string, quantity: (args.quantity as number) ?? 1 }],
        customer: args.customer_id as string | undefined,
        customer_email: args.customer_email as string | undefined,
        success_url: (args.success_url as string) ?? "https://example.com/success",
        cancel_url: (args.cancel_url as string) ?? "https://example.com/cancel",
        allow_promotion_codes: args.allow_promotion_codes as boolean | undefined,
      });
    }
    case "expire_checkout_session": {
      return await stripe.checkout.sessions.expire(args.session_id as string);
    }

    // Payment Links
    case "list_payment_links": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.active !== undefined) params.active = args.active;
      return await stripe.paymentLinks.list(params as Parameters<typeof stripe.paymentLinks.list>[0]);
    }
    case "create_payment_link": {
      const plParams: Parameters<typeof stripe.paymentLinks.create>[0] = {
        line_items: [{ price: args.price_id as string, quantity: (args.quantity as number) ?? 1 }],
        allow_promotion_codes: args.allow_promotion_codes as boolean | undefined,
      };
      if (args.after_completion_type === "redirect" && args.after_completion_url) {
        plParams.after_completion = { type: "redirect", redirect: { url: args.after_completion_url as string } };
      } else if (args.after_completion_type === "hosted_confirmation") {
        plParams.after_completion = { type: "hosted_confirmation" };
      }
      return await stripe.paymentLinks.create(plParams);
    }
    case "update_payment_link": {
      return await stripe.paymentLinks.update(args.payment_link_id as string, {
        active: args.active as boolean | undefined,
      });
    }

    // Promotion Codes
    case "list_promotion_codes": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.coupon_id) params.coupon = args.coupon_id;
      if (args.active !== undefined) params.active = args.active;
      if (args.code) params.code = args.code;
      return await stripe.promotionCodes.list(params as Parameters<typeof stripe.promotionCodes.list>[0]);
    }
    case "create_promotion_code": {
      return await stripe.promotionCodes.create({
        coupon: args.coupon_id as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }


    // Credit Notes
    case "list_credit_notes": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.invoice_id) params.invoice = args.invoice_id;
      return await stripe.creditNotes.list(params as Parameters<typeof stripe.creditNotes.list>[0]);
    }
    case "create_credit_note": {
      return await stripe.creditNotes.create({
        invoice: args.invoice_id as string,
        amount: args.amount as number,
        reason: args.reason as "duplicate" | "fraudulent" | "order_change" | "product_unsatisfactory" | undefined,
        memo: args.memo as string | undefined,
      });
    }

    // Webhook Endpoints
    case "list_webhook_endpoints": {
      return await stripe.webhookEndpoints.list({ limit: Math.min(Number(args.limit ?? 20), 20) });
    }
    case "create_webhook_endpoint": {
      return await stripe.webhookEndpoints.create({
        url: args.url as string,
        enabled_events: args.enabled_events as string[],
        description: args.description as string | undefined,
      } as Parameters<typeof stripe.webhookEndpoints.create>[0]);
    }
    case "delete_webhook_endpoint": {
      return await stripe.webhookEndpoints.del(args.webhook_endpoint_id as string);
    }

    // Customer Portal
    case "create_billing_portal_session": {
      return await stripe.billingPortal.sessions.create({
        customer: args.customer_id as string,
        return_url: (args.return_url as string) ?? "https://example.com",
      });
    }

    // Setup Intents
    case "list_setup_intents": {
      const params: Record<string, unknown> = { limit: Math.min(Number(args.limit ?? 20), 20) };
      if (args.customer_id) params.customer = args.customer_id;
      return await stripe.setupIntents.list(params as Parameters<typeof stripe.setupIntents.list>[0]);
    }
    case "create_setup_intent": {
      return await stripe.setupIntents.create({
        customer: args.customer_id as string,
        payment_method_types: (args.payment_method_types as string[]) ?? ["card"],
        usage: (args.usage as "off_session" | "on_session") ?? "off_session",
      });
    }

    // Stripe Search
    case "search_stripe": {
      const q = args.query as string;
      const lim = Math.min(Number(args.limit ?? 10), 20);
      switch (args.resource) {
        case "customers": return await stripe.customers.search({ query: q, limit: lim });
        case "subscriptions": return await stripe.subscriptions.search({ query: q, limit: lim });
        case "invoices": return await stripe.invoices.search({ query: q, limit: lim });
        case "charges": return await stripe.charges.search({ query: q, limit: lim });
        case "payment_intents": return await stripe.paymentIntents.search({ query: q, limit: lim });
        default: throw new Error(`Unsupported search resource: ${args.resource}`);
      }
    }

    default:
      throw new Error(`Unknown Stripe tool: ${name}`);
  }
}
