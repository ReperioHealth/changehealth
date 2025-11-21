import type { ClaimSubmissionRequest, ClaimResponse } from '../types/claims';
import type { Credentials, Environment } from '../types/eligibility';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// Validate required header fields
function validateRequiredFields(data: ClaimSubmissionRequest): string[] {
  const errors: string[] = [];
  
  // Check control number
  if (!data.controlNumber) {
    errors.push('Control Number is required');
  }
  
  // Check submitter
  if (!data.submitter?.organizationName && !data.submitter?.lastName && !data.submitter?.firstName) {
    errors.push('Submitter organization name or person name is required');
  }
  if (!data.submitter?.contactInformation?.name) {
    errors.push('Submitter contact name is required');
  }
  if (!data.submitter?.contactInformation?.phoneNumber) {
    errors.push('Submitter contact phone number is required');
  }
  
  // Check receiver
  if (!data.receiver?.organizationName) {
    errors.push('Receiver organization name is required');
  }
  
  // Check billing provider
  if (!data.billing?.providerType) {
    errors.push('Billing provider type is required');
  }
  
  return errors;
}

export async function validateClaim(
  data: ClaimSubmissionRequest,
  credentials?: Credentials,
  environment?: Environment
): Promise<ClaimResponse> {
  // Validate required fields before sending
  const validationErrors = validateRequiredFields(data);
  if (validationErrors.length > 0) {
    throw new Error(JSON.stringify({
      message: 'Required fields missing',
      statusCode: 400,
      details: validationErrors
    }, null, 2));
  }
  
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
  // Validate required fields before sending
  const validationErrors = validateRequiredFields(data);
  if (validationErrors.length > 0) {
    throw new Error(JSON.stringify({
      message: 'Required fields missing',
      statusCode: 400,
      details: validationErrors
    }, null, 2));
  }
  
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

