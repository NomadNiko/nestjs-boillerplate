import Stripe from 'stripe';

// Session interfaces
export interface CustomSession extends Omit<Stripe.Checkout.Session, 'client_secret'> {
  client_secret: string | null;
}

export interface EmbeddedCheckoutParams extends Omit<Stripe.Checkout.SessionCreateParams, 'success_url' | 'cancel_url'> {
  ui_mode: 'embedded';
  return_url: string;
}

// Webhook response interfaces
export interface StripeWebhookResponse {
  received: boolean;
}

export interface PaymentIntentResponse {
  clientSecret: string;
}

// Item metadata interface
export interface CompactItemMetadata {
  id: string;
  q: number;
  d: string;
  t: string;
}