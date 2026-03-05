import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { markWebhookProcessed, saveWebhookEvent } from "./db";
import stripe from "./stripe";

export function registerWebhookRoute(app: Express) {
  // Raw body parser MUST come before json() for webhook signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;

      try {
        if (!webhookSecret) {
          // No webhook secret configured — accept without verification (dev only)
          event = JSON.parse(req.body.toString()) as Stripe.Event;
        } else {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("[Webhook] Signature verification failed:", msg);
        res.status(400).json({ error: `Webhook Error: ${msg}` });
        return;
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        res.json({ verified: true });
        return;
      }

      // Extract object info for logging
      const obj = event.data?.object as unknown as Record<string, unknown> | undefined;
      const objectId = (obj?.id as string) ?? undefined;
      const objectType = (obj?.object as string) ?? undefined;

      // Save to DB
      await saveWebhookEvent({
        stripeEventId: event.id,
        eventType: event.type,
        objectId,
        objectType,
        payload: { type: event.type, id: event.id, created: event.created, objectId, objectType },
      });

      // Process specific events
      try {
        switch (event.type) {
          case "customer.created":
            console.log("[Webhook] New customer:", objectId);
            break;
          case "invoice.paid":
            console.log("[Webhook] Invoice paid:", objectId);
            break;
          case "invoice.payment_failed":
            console.log("[Webhook] Invoice payment failed:", objectId);
            break;
          case "customer.subscription.created":
            console.log("[Webhook] Subscription created:", objectId);
            break;
          case "customer.subscription.updated":
            console.log("[Webhook] Subscription updated:", objectId);
            break;
          case "customer.subscription.deleted":
            console.log("[Webhook] Subscription deleted:", objectId);
            break;
          case "payment_intent.succeeded":
            console.log("[Webhook] Payment succeeded:", objectId);
            break;
          case "payment_intent.payment_failed":
            console.log("[Webhook] Payment failed:", objectId);
            break;
          default:
            console.log("[Webhook] Unhandled event type:", event.type);
        }

        await markWebhookProcessed(event.id, "processed");
        res.json({ received: true });
      } catch (err) {
        console.error("[Webhook] Processing error:", err);
        await markWebhookProcessed(event.id, "failed");
        res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );
}
