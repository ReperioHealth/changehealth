import axios from 'axios';

function getBaseUrl(environment?: string): string {
  const env = environment || process.env.OPTUM_ENV || 'production';
  return env === 'sandbox' 
    ? 'https://sandbox-apigw.optum.com' 
    : 'https://apigw.optum.com';
}

interface Credentials {
  clientId: string;
  clientSecret: string;
}

// Cache tokens per clientId and scope
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getAccessToken(credentials: Credentials, environment?: string, scope?: string): Promise<string> {
  const baseUrl = getBaseUrl(environment);
  const tokenUrl = `${baseUrl}/apip/auth/v2/token`;
  // Include scope in cache key to cache tokens separately per scope
  // Use 'no-scope' for undefined to differentiate from explicit scopes
  const scopeParam = scope !== undefined ? scope : 'no-scope';
  const cacheKey = `${credentials.clientId}-${environment || 'production'}-${scopeParam}`;
  
  const cached = tokenCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    console.log('Using cached token for client:', credentials.clientId.substring(0, 8) + '...', 'scope:', scope || '(no scope)');
    return cached.token;
  }

  console.log('Requesting new OAuth2 token from:', tokenUrl);
  console.log('Environment:', environment || 'production');
  console.log('Client ID (first 8 chars):', credentials.clientId.substring(0, 8) + '...');
  console.log('Client ID (full):', credentials.clientId);
  console.log('Client Secret (first 8 chars):', credentials.clientSecret.substring(0, 8) + '...');
  console.log('Scope:', scope || '(no scope)');

  // Build token request body - try without scope if scope is undefined, otherwise use the provided scope
  const tokenBody = scope !== undefined
    ? `grant_type=client_credentials&scope=${scope}`
    : 'grant_type=client_credentials';

  const response = await axios.post(tokenUrl, 
    tokenBody,
    {
      auth: {
        username: credentials.clientId,
        password: credentials.clientSecret
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  const { access_token, expires_in } = response.data;
  console.log('✅ Token obtained successfully. Expires in:', expires_in, 'seconds');
  
  tokenCache.set(cacheKey, {
    token: access_token,
    expiresAt: Date.now() + (expires_in * 1000) - 60000
  });

  return access_token;
}

export async function checkEligibility(requestData: any, credentials?: Credentials, environment?: string) {
  // Proxy function - passes the complete JSON payload from frontend directly to Optum
  // Frontend is responsible for building the correct JSON structure
  // No transformations are performed here
  
  // Use provided credentials or fall back to env vars
  const creds: Credentials = credentials || {
    clientId: process.env.OPTUM_CLIENT_ID!,
    clientSecret: process.env.OPTUM_CLIENT_SECRET!
  };

  if (!creds.clientId || !creds.clientSecret) {
    throw new Error('API credentials required');
  }

  const baseUrl = getBaseUrl(environment);
  // No scope needed - works without scope parameter
  const token = await getAccessToken(creds, environment, undefined);
  
  console.log('Calling eligibility API:', `${baseUrl}/medicalnetwork/eligibility/v3/`);
  console.log('Request payload (passed through unchanged):', JSON.stringify(requestData, null, 2));
  
  // Pass the request data directly to Optum - no modifications
  const response = await axios.post(
    `${baseUrl}/medicalnetwork/eligibility/v3/`,
    requestData, // Frontend-built JSON payload passed through as-is
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-chng-trace-id': requestData.controlNumber
      }
    }
  );

  console.log('✅ Eligibility check succeeded!');
  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(response.data, null, 2));
  
  return response.data;
}

export async function lookupPayer(payerId: string, credentials?: Credentials, environment?: string) {
  const creds: Credentials = credentials || {
    clientId: process.env.OPTUM_CLIENT_ID!,
    clientSecret: process.env.OPTUM_CLIENT_SECRET!
  };

  if (!creds.clientId || !creds.clientSecret) {
    throw new Error('API credentials required');
  }

  const baseUrl = getBaseUrl(environment);
  // Try without scope first - payer list API might not require a scope
  // If that fails, the route handler will retry with fallback credentials
  const token = await getAccessToken(creds, environment, undefined);
  
  console.log('Looking up payer:', payerId);
  console.log('Using environment:', environment || 'production');
  console.log('Client ID (first 8 chars):', creds.clientId.substring(0, 8) + '...');
  console.log('Payer lookup URL:', `${baseUrl}/medicalnetwork/payerlist/v1/payers`);
  
  try {
    const response = await axios.get(
      `${baseUrl}/medicalnetwork/payerlist/v1/payers`,
      {
        params: {
          system: 'Gateway',
          payerId: payerId,
          wildcardSearch: 'No'
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Payer lookup API error:', error.response?.status, error.response?.statusText);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
    console.error('Request URL:', error.config?.url);
    console.error('Request params:', JSON.stringify(error.config?.params, null, 2));
    throw error;
  }
}

export async function getAllPayers(credentials?: Credentials, environment?: string, options?: {
  transactionType?: string[];
  status?: string;
  pageSize?: number;
}) {
  const creds: Credentials = credentials || {
    clientId: process.env.OPTUM_CLIENT_ID!,
    clientSecret: process.env.OPTUM_CLIENT_SECRET!
  };

  if (!creds.clientId || !creds.clientSecret) {
    throw new Error('API credentials required');
  }

  const baseUrl = getBaseUrl(environment);
  const token = await getAccessToken(creds, environment, undefined);
  
  const allPayers: any[] = [];
  let page = 1;
  const pageSize = options?.pageSize || 100; // Fetch 100 at a time
  let hasMore = true;

  console.log('Fetching all payers for dropdown...');
  console.log('Using environment:', environment || 'production');
  console.log('Client ID (first 8 chars):', creds.clientId.substring(0, 8) + '...');
  console.log('Client ID (full):', creds.clientId);
  console.log('Transaction type filter:', options?.transactionType || 'all');
  console.log('Status filter:', options?.status || 'all');

  while (hasMore) {
    try {
      const params: any = {
        system: 'Gateway',
        page: page,
        pageSize: pageSize,
        sort: ['payerPlanName,asc']
      };

      // Only add filters if provided - try without filters first if they cause issues
      if (options?.transactionType && options.transactionType.length > 0) {
        params.transactionType = options.transactionType;
      }

      if (options?.status) {
        params.status = options.status;
      }

      console.log(`Fetching page ${page} with params:`, JSON.stringify(params, null, 2));
      console.log('Request URL:', `${baseUrl}/medicalnetwork/payerlist/v1/payers`);

      const response = await axios.get(
        `${baseUrl}/medicalnetwork/payerlist/v1/payers`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data;
      if (data.payers && data.payers.length > 0) {
        allPayers.push(...data.payers);
        console.log(`Fetched page ${page}: ${data.payers.length} payers (total so far: ${allPayers.length})`);
        
        // Check if there are more pages
        const totalPages = Math.ceil((data.total || 0) / pageSize);
        hasMore = page < totalPages;
        page++;
      } else {
        hasMore = false;
      }
    } catch (error: any) {
      console.error('Error fetching payers:', error.response?.status, error.response?.statusText);
      console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }

  console.log(`✅ Fetched ${allPayers.length} total payers`);
  return {
    payers: allPayers,
    total: allPayers.length
  };
}

