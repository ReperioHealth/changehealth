// Type definitions for claim submission
// Based on Professional Claims API V3 OpenAPI spec

export interface Address {
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  countrySubDivisionCode?: string;
}

export interface ContactInformation {
  name?: string;
  phoneNumber?: string;
  faxNumber?: string;
  email?: string;
  phoneExtension?: string;
}

export interface Provider {
  providerType: string;
  npi?: string;
  ssn?: string;
  employerId?: string;
  taxIdType?: 'SSN' | 'EIN';
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  organizationName?: string;
  address?: Address;
  contactInformation?: ContactInformation;
}

export interface Subscriber {
  paymentResponsibilityLevelCode: string;
  memberId?: string;
  ssn?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  gender?: 'M' | 'F' | 'U';
  dateOfBirth?: string;
  organizationName?: string;
  policyNumber?: string;
  groupNumber?: string;
  address?: Address;
  contactInformation?: ContactInformation;
}

export interface Dependent {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  gender: 'M' | 'F' | 'U';
  dateOfBirth: string;
  relationshipToSubscriberCode: string;
  ssn?: string;
  memberId?: string;
  address?: Address;
  contactInformation?: ContactInformation;
}

export interface HealthCareInformation {
  diagnosisTypeCode: string;
  diagnosisCode: string;
}

export interface ProfessionalService {
  procedureIdentifier: string;
  procedureCode: string;
  procedureModifiers?: string[];
  description?: string;
  lineItemChargeAmount: string;
  measurementUnit: string;
  serviceUnitCount: string;
  placeOfServiceCode?: string;
  compositeDiagnosisCodePointers: {
    diagnosisCodePointers: string[];
  };
}

export interface ServiceLine {
  serviceDate: string;
  serviceDateEnd?: string;
  professionalService: ProfessionalService;
}

export interface ClaimSupplementalInformation {
  priorAuthorizationNumber?: string;
  referralNumber?: string;
  claimControlNumber?: string;
  claimNumber?: string;
}

export interface ClaimInformation {
  claimFilingCode: string;
  patientControlNumber: string;
  claimChargeAmount: string;
  placeOfServiceCode: string;
  claimFrequencyCode: string;
  signatureIndicator: 'Y' | 'N';
  planParticipationCode?: 'A' | 'B' | 'C' | '';
  benefitsAssignmentCertificationIndicator: 'Y' | 'N' | 'W';
  releaseInformationCode: 'Y' | 'I';
  healthCareCodeInformation: HealthCareInformation[];
  serviceLines: ServiceLine[];
  patientAmountPaid?: string;
  claimSupplementalInformation?: ClaimSupplementalInformation;
  serviceFacilityLocation?: {
    organizationName?: string;
    address?: Address;
    npi?: string;
  };
  hasOtherHealthBenefitPlan?: boolean;
  autoAccident?: boolean;
  autoAccidentState?: string;
  outsideLab?: boolean;
  outsideLabCharges?: string; // Stored as cents (digits only)
}

export interface Submitter {
  organizationName?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  contactInformation: ContactInformation;
}

export interface Receiver {
  organizationName: string;
}

export interface ClaimSubmissionRequest {
  controlNumber: string;
  tradingPartnerServiceId?: string;
  submitter: Submitter;
  receiver: Receiver;
  subscriber: Subscriber;
  dependent?: Dependent;
  billing: Provider;
  rendering?: Provider;
  referring?: Provider;
  supervising?: Provider;
  ordering?: Provider;
  claimInformation: ClaimInformation;
  usageIndicator?: 'T' | 'P';
}

export interface ClaimResponse {
  status: string;
  controlNumber?: string;
  tradingPartnerServiceId?: string;
  claimReference?: {
    correlationId?: string;
    submitterId?: string;
    customerClaimNumber?: string;
    patientControlNumber?: string;
    timeOfResponse?: string;
    claimType?: string;
    payerID?: string;
    formatVersion?: string;
    rhclaimNumber?: string;
  };
  errors?: Array<{
    field?: string;
    value?: string;
    code?: string;
    description?: string;
    followupAction?: string;
    location?: string;
  }>;
  editResponses?: Array<{
    errorDescription?: string;
    badData?: string;
    fieldIndex?: string;
    editName?: string;
    editActivity?: string;
    phaseID?: string;
    referenceID?: string;
    claimCorePath?: string;
    allowOverride?: string;
    qualifierCode?: string;
    element?: string;
    loop?: string;
    segment?: string;
  }>;
  meta?: {
    submitterId?: string;
    senderId?: string;
    billerId?: string;
    traceId?: string;
    applicationMode?: string;
  };
  payer?: {
    payerName?: string;
    payerID?: string;
  };
  failure?: {
    code?: string;
    description?: string;
  };
}

