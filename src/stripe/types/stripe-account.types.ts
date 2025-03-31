export interface StripeAccountVerificationRequirements {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    pendingVerification?: {
      details: string;
      dueBy?: Date;
    };
    errors?: Array<{
      code: string;
      reason: string;
      requirement: string;
    }>;
  }
  
  export interface StripeAccountStatus {
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirements: StripeAccountVerificationRequirements;
  }