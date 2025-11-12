const axios = require('axios');

// Sandbox credentials
const CLIENT_ID = '***REDACTED_CLIENT_ID***';
const CLIENT_SECRET = '***REDACTED_CLIENT_SECRET***';
const BASE_URL = 'https://sandbox-apigw.optum.com';

async function getAccessToken() {
  const tokenUrl = `${BASE_URL}/apip/auth/v2/token`;
  
  console.log('Requesting token from:', tokenUrl);
  console.log('Client ID:', CLIENT_ID.substring(0, 8) + '...');
  
  try {
    const response = await axios.post(tokenUrl, 
      'grant_type=client_credentials',
      {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token, expires_in } = response.data;
    console.log('✅ Token obtained successfully. Expires in:', expires_in, 'seconds');
    return access_token;
  } catch (error) {
    console.error('❌ Token request failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

async function checkEligibility(token) {
  const eligibilityUrl = `${BASE_URL}/medicalnetwork/eligibility/v3/`;
  
  // Build a proper eligibility request based on the API spec
  const requestData = {
    controlNumber: String(Date.now()).slice(-9).padStart(9, '0'),
    tradingPartnerServiceId: '87726',
    subscriber: {
      memberId: '***REDACTED***',
      firstName: 'Matthew',
      lastName: 'Wallington',
      gender: 'M',
      dateOfBirth: '19791118'
    },
    encounter: {
      serviceTypeCodes: ['30'],
      dateOfService: new Date().toISOString().split('T')[0].replace(/-/g, '')
    }
  };

  console.log('\n📤 Calling eligibility API:', eligibilityUrl);
  console.log('Request payload:', JSON.stringify(requestData, null, 2));
  
  try {
    const response = await axios.post(eligibilityUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-chng-trace-id': requestData.controlNumber
      }
    });

    console.log('\n✅ Eligibility check succeeded!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('\n❌ Eligibility check failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Response:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Testing Optum Eligibility API (Sandbox)\n');
    
    const token = await getAccessToken();
    await checkEligibility(token);
    
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();

