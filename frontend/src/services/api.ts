import type { Credentials, EligibilityRequest, EligibilityResponse, Environment } from '../types/eligibility';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export async function checkEligibility(
  data: EligibilityRequest,
  credentials?: Credentials,
  environment?: Environment
): Promise<EligibilityResponse> {
  const response = await fetch(`${API_BASE_URL}/api/eligibility/check-eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eligibilityData: data,
      credentials: credentials || undefined,
      environment: environment || 'production'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    const errorMessage = error.message || `Request failed with status code ${error.statusCode || response.status}`;
    const fullError = {
      message: errorMessage,
      statusCode: error.statusCode || response.status,
      details: error.details
    };
    
    // Include full error details in the error message for debugging
    throw new Error(JSON.stringify(fullError, null, 2));
  }

  return response.json();
}

export interface PayerLookupResult {
  page: number;
  pageSize: number;
  total: number;
  payers: Array<{
    payerPlanName: string | null;
    payerId: string | null;
    industryPayerId: string | null;
    status: string;
  }>;
}

export async function lookupPayer(
  payerId: string,
  credentials?: Credentials,
  environment?: Environment
): Promise<PayerLookupResult> {
  const response = await fetch(`${API_BASE_URL}/api/eligibility/lookup-payer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payerId,
      credentials: credentials || undefined,
      environment: environment || 'production'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Payer lookup failed');
  }

  return response.json();
}

export interface Payer {
  payerPlanName: string | null;
  payerId: string | null;
  imnPayerId: string | null;
  industryPayerId: string | null;
  status: string;
}

export interface AllPayersResult {
  payers: Payer[];
  total: number;
}

export async function getAllPayers(
  credentials?: Credentials,
  environment?: Environment,
  transactionType?: string[],
  status?: string
): Promise<AllPayersResult> {
  const response = await fetch(`${API_BASE_URL}/api/eligibility/get-all-payers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credentials: credentials || undefined,
      environment: environment || 'production',
      transactionType: transactionType || ['Eligibility'],
      status: status || 'Active'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch payers');
  }

  return response.json();
}

