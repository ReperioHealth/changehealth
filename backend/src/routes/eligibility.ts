import express from 'express';
import { checkEligibility, lookupPayer, getAllPayers, exportPayerList } from '../services/optum';

const router = express.Router();

router.post('/check-eligibility', async (req, res, next) => {
  try {
    const { eligibilityData, environment } = req.body;

    if (!eligibilityData) {
      return res.status(400).json({ message: 'eligibilityData is required' });
    }

    console.log('Received eligibility check request');
    console.log('Environment:', environment || 'production (default)');
    console.log('Request payload:', JSON.stringify(eligibilityData, null, 2));

    const result = await checkEligibility(eligibilityData, environment);
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
    const { payerListParams, environment } = req.body;

    if (!payerListParams) {
      return res.status(400).json({ message: 'payerListParams is required' });
    }

    console.log('Received payer lookup request');
    console.log('Environment:', environment || 'production (default)');
    console.log('PayerList params:', JSON.stringify(payerListParams, null, 2));

    const result = await lookupPayer(payerListParams, environment);
    console.log('✅ Payer lookup succeeded');
    return res.json(result);

  } catch (error: any) {
    console.error('Payer lookup failed:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Request URL:', error.config?.url);
    console.error('Request params:', JSON.stringify(error.config?.params, null, 2));

    res.status(error.response?.status || 500).json({
      message: error.message,
      details: error.response?.data,
      statusCode: error.response?.status,
      _optumApiRequest: error.config ? {
        url: error.config.url,
        method: error.config.method?.toUpperCase(),
        params: error.config.params
      } : undefined
    });
  }
});

router.post('/get-all-payers', async (req, res, next) => {
  try {
    const { payerListParams, environment } = req.body;

    if (!payerListParams) {
      return res.status(400).json({ message: 'payerListParams is required' });
    }

    console.log('Received PayerList request');
    console.log('Environment:', environment || 'production (default)');
    console.log('PayerList params:', JSON.stringify(payerListParams, null, 2));

    const result = await getAllPayers(payerListParams, environment);
    console.log('✅ PayerList fetch completed successfully');
    res.json(result);
  } catch (error: any) {
    console.error('PayerList fetch failed:');
    console.error('Error message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Request URL:', error.config?.url);
    console.error('Request params:', JSON.stringify(error.config?.params, null, 2));

    res.status(error.response?.status || 500).json({
      message: error.message,
      details: error.response?.data,
      statusCode: error.response?.status,
      _optumApiRequest: error.config ? {
        url: error.config.url,
        method: error.config.method?.toUpperCase(),
        params: error.config.params
      } : undefined
    });
  }
});

router.post('/export-payers', async (req, res, next) => {
  try {
    const { payerListParams, environment } = req.body;

    if (!payerListParams) {
      return res.status(400).json({ message: 'payerListParams is required' });
    }

    console.log('Received PayerList Export request');
    console.log('Environment:', environment || 'production (default)');
    console.log('PayerList export params:', JSON.stringify(payerListParams, null, 2));

    const result = await exportPayerList(payerListParams, environment);
    console.log('✅ PayerList export completed successfully');
    res.json(result);
  } catch (error: any) {
    console.error('PayerList export failed:');
    console.error('Error message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Request URL:', error.config?.url);
    console.error('Request params:', JSON.stringify(error.config?.params, null, 2));

    res.status(error.response?.status || 500).json({
      message: error.message,
      details: error.response?.data,
      statusCode: error.response?.status,
      _optumApiRequest: error.config ? {
        url: error.config.url,
        method: error.config.method?.toUpperCase(),
        params: error.config.params
      } : undefined
    });
  }
});

export default router;
