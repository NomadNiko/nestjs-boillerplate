export interface VendorEmailData {
  vendorId: string;
  vendorName: string;
  vendorStatus: string;
  userName: string; // Owner's name from Users database
  eventType: 'created' | 'stripe-complete' | 'approved';
  vendorStatusUrl: string;
  // Onboarding steps status
  onboardingSteps?: {
    profileComplete: boolean;
    hasTemplates: boolean;
    hasProducts: boolean;
    stripeComplete: boolean;
    approved: boolean;
  };
  // Stripe specific info
  stripeInfo?: {
    accountId: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  };
}
