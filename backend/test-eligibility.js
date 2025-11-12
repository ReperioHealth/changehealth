const axios = require('axios');

// Sandbox credentials
const CLIENT_ID = 'nwYIpWGJsDwkUYcmfmz1EpIzadN5bcvf';
const CLIENT_SECRET = 'WTZ14M8uV4aFfThv';
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
  
  // Build a proper eligibility request using predefined sandbox test values
  // See: https://developer.optum.com/eligibilityandclaims/docs/sandbox-predefined-fields-and-values
  // Test payer ID "00001" returns a single coverage plan response
  const requestData = {
    controlNumber: '000000001', // Predefined: "000000001", "000000002", "000000003", "000000004", "123456789"
    tradingPartnerServiceId: '00001', // Test payer ID from sandbox docs - returns single coverage plan
    provider: {
      organizationName: 'happy doctors group', // Predefined: "happy doctors group", "happy doctors grouppractice", "extra healthy insurance", "regional ppo network"
      npi: '0123456789' // Predefined: "1760854442", "1942788757", "0123456789"
    },
    subscriber: {
      memberId: '0000000000', // Predefined: "0000000000", "0000000001", "0000000002", "1234567890", etc.
      firstName: 'johnone', // Predefined: "johnone", "johntwo", "janeone", "janetwo"
      lastName: 'doeone', // Predefined: "doeone", "doetwo"
      gender: 'M', // Predefined: "m", "f"
      dateOfBirth: '19800101' // Predefined: "18800102", "18800101", "18160421", "19800101", "19800102", "20000101", "20000102"
    },
    encounter: {
      serviceTypeCodes: ['30'],
      dateOfService: '20251112' // Use a fixed date for testing
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

