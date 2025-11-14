import type { ClaimSubmissionRequest, ClaimResponse } from '../types/claims';
import type { Credentials, Environment } from '../types/eligibility';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

export async function validateClaim(
  data: ClaimSubmissionRequest,
  credentials?: Credentials,
  environment?: Environment
): Promise<ClaimResponse> {
  const response = await fetch(`${API_BASE_URL}/api/claims/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claimData: data,
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
    
    throw new Error(JSON.stringify(fullError, null, 2));
  }

  return response.json();
}

export async function submitClaim(
  data: ClaimSubmissionRequest,
  credentials?: Credentials,
  environment?: Environment
): Promise<ClaimResponse> {
  const response = await fetch(`${API_BASE_URL}/api/claims/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claimData: data,
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
    
    throw new Error(JSON.stringify(fullError, null, 2));
  }

  return response.json();
}

export async function generateClaimPDF(
  data: ClaimSubmissionRequest
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/claims/generate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimData: data })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate PDF');
  }

  return response.blob();
}

