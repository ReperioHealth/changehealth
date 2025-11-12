import express from 'express';
import { checkEligibility, lookupPayer, getAllPayers } from '../services/optum';

const router = express.Router();

router.post('/check-eligibility', async (req, res, next) => {
  try {
    const { credentials, eligibilityData, environment } = req.body;
    
    // Backend acts as a proxy - frontend builds the complete JSON payload
    // We just pass it through to Optum's API with authentication
    if (!eligibilityData) {
      return res.status(400).json({ message: 'eligibilityData is required' });
    }
    
    console.log('Received eligibility check request');
    console.log('Environment:', environment || 'production (default)');
    console.log('Has credentials:', !!credentials);
    if (credentials) {
      console.log('Credentials Client ID (first 8 chars):', credentials.clientId?.substring(0, 8) + '...');
      console.log('Credentials Client ID (full):', credentials.clientId);
    }
    console.log('Request payload:', JSON.stringify(eligibilityData, null, 2));
    
    // Pass the complete JSON payload through to Optum (no transformations)
    const result = await checkEligibility(eligibilityData, credentials, environment);
    console.log('✅ Eligibility check completed successfully');
    res.json(result);
  } catch (error: any) {
    console.error('Eligibility check failed:');
    console.error('Error message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
    
    res.status(error.response?.status || 500).json({
      message: error.message,
      details: error.response?.data,
      statusCode: error.response?.status
    });
  }
});

router.post('/lookup-payer', async (req, res, next) => {
  try {
    const { payerId, environment, credentials } = req.body;
    
    if (!payerId || typeof payerId !== 'string') {
      return res.status(400).json({ message: 'payerId is required' });
    }
    
    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
      return res.status(400).json({ message: 'Payer lookup credentials are required' });
    }
    
    console.log('Looking up payer:', payerId);
    console.log('Using payer lookup credentials:', credentials.clientId.substring(0, 8) + '...');
    
    const result = await lookupPayer(payerId, credentials, environment);
    console.log('✅ Payer lookup succeeded');
    return res.json(result);
    
  } catch (error: any) {
    console.error('Payer lookup failed:', error.message);
    console.error('Error status:', error.response?.status);
    
    res.status(error.response?.status || 500).json({
      message: error.message,
      details: error.response?.data,
      statusCode: error.response?.status
    });
  }
});

router.post('/get-all-payers', async (req, res, next) => {
  try {
    const { environment, credentials, transactionType, status } = req.body;
    
    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
      return res.status(400).json({ message: 'Payer lookup credentials are required' });
    }
    
    console.log('Fetching all payers for dropdown...');
    console.log('Environment:', environment || 'production');
    console.log('Using payer lookup credentials:', credentials.clientId.substring(0, 8) + '...');
    console.log('Transaction type filter:', transactionType || 'all');
    console.log('Status filter:', status || 'all');
    
    // Try different approaches: first without filters, then with filters
    let result;
    try {
      // First try: simple request without filters
      console.log('Attempting simple request (no filters)...');
      const simpleOptions = { pageSize: 100 };
      result = await getAllPayers(credentials, environment, simpleOptions);
      console.log('✅ Succeeded with simple request!');
    } catch (simpleError: any) {
      console.log('Simple request failed:', simpleError.response?.status);
      
      // Second try: with filters
      try {
        console.log('Attempting with filters (Eligibility, Active)...');
        const filteredOptions = {
          transactionType: transactionType || ['Eligibility'],
          status: status || 'Active',
          pageSize: 100
        };
        result = await getAllPayers(credentials, environment, filteredOptions);
        console.log('✅ Succeeded with filters!');
      } catch (filteredError: any) {
        console.log('Filtered request also failed:', filteredError.response?.status);
        throw filteredError;
      }
    }
    
    return res.json(result);
    
  } catch (error: any) {
    console.error('Failed to fetch payers:', error.message);
    console.error('Error status:', error.response?.status);
    
    res.status(error.response?.status || 500).json({
      message: error.message,
      details: error.response?.data,
      statusCode: error.response?.status
    });
  }
});

export default router;

