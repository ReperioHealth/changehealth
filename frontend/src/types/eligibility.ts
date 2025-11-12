export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export type Environment = 'sandbox' | 'production';

export interface EligibilityRequest {
  controlNumber: string;
  tradingPartnerServiceId: string;
  provider?: {
    organizationName?: string;
    npi?: string;
  };
  subscriber: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'M' | 'F';
    groupNumber?: string;
    ssn?: string;
  };
}

export interface EligibilityResponse {
  meta?: any;
  controlNumber?: string;
  reassociationKey?: string;
  tradingPartnerServiceId?: string;
  provider?: any;
  subscriber?: any;
  subscriberTraceNumbers?: any[];
  dependents?: any[];
  payer?: any;
  planInformation?: any;
  planDateInformation?: any;
  planStatus?: any[];
  benefitsInformation?: any[];
  errors?: any[];
  status?: string;
  transactionSetAcknowledgement?: string;
  implementationTransactionSetSyntaxError?: string;
  x12?: string;
}

