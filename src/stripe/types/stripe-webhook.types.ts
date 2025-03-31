export interface StripeWebhookResponse {
    received: boolean;
  }
  
  export interface PaymentIntentResponse {
    clientSecret: string;
  }