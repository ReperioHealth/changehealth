import { useState, useEffect } from 'react';
import EnvironmentSelector from './components/EnvironmentSelector';
import SettingsModal from './components/SettingsModal';
import EligibilityForm from './components/EligibilityForm';
import ResponseDisplay from './components/ResponseDisplay';
import { checkEligibility } from './services/api';
import type { Credentials, EligibilityRequest, EligibilityResponse, Environment } from './types/eligibility';

const STORAGE_KEY_ENVIRONMENT = 'optum-eligibility-environment';

export default function App() {
  // Load environment from localStorage or default to sandbox
  const [environment, setEnvironment] = useState<Environment>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ENVIRONMENT);
    return (saved === 'production' || saved === 'sandbox') ? saved : 'sandbox';
  });
  
  const [eligibilityCredentials, setEligibilityCredentials] = useState<Credentials | null>(null);
  const [payerLookupCredentials, setPayerLookupCredentials] = useState<Credentials | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastRequest, setLastRequest] = useState<EligibilityRequest | null>(null);
  const [response, setResponse] = useState<EligibilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load credentials for current environment on mount and when environment changes
  useEffect(() => {
    const loadCredentials = (key: string): Credentials | null => {
      try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    };

    const SANDBOX_CREDENTIALS = {
      clientId: 'nwYIpWGJsDwkUYcmfmz1EpIzadN5bcvf',
      clientSecret: 'WTZ14M8uV4aFfThv'
    };

    const PRODUCTION_ELIGIBILITY_CREDENTIALS = {
      clientId: '9cwjuJeqnjX79mxOpFetFcjTUHSarxAr',
      clientSecret: 'hGzaXmA2gDGQRwiy'
    };

    const PRODUCTION_PAYER_LOOKUP_CREDENTIALS = {
      clientId: 'G4WpMcKXReW2U3M8vF88sD6TFA46AVko',
      clientSecret: 'ElfgeBg8uTs8mA4o'
    };

    const eligStorageKey = `optum-eligibility-credentials-${environment}`;
    const payerStorageKey = `optum-payer-lookup-credentials-${environment}`;
    const eligCreds = loadCredentials(eligStorageKey);
    const payerCreds = loadCredentials(payerStorageKey);
    
    // Use saved credentials if available, otherwise use defaults for current environment
    const finalEligCreds = eligCreds || (environment === 'sandbox' ? SANDBOX_CREDENTIALS : PRODUCTION_ELIGIBILITY_CREDENTIALS);
    const finalPayerCreds = payerCreds || (environment === 'sandbox' ? SANDBOX_CREDENTIALS : PRODUCTION_PAYER_LOOKUP_CREDENTIALS);
    
    setEligibilityCredentials(finalEligCreds);
    setPayerLookupCredentials(finalPayerCreds);
  }, [environment]);

  // Persist environment to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ENVIRONMENT, environment);
  }, [environment]);

  const handleEnvironmentChange = (env: Environment) => {
    setEnvironment(env);
    // Clear response when switching environments
    setLastRequest(null);
    setResponse(null);
    setError(null);
  };

  const handleSubmit = async (data: EligibilityRequest) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setLastRequest(data);

    try {
      const result = await checkEligibility(data, eligibilityCredentials || undefined, environment);
      setResponse(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Full Width */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Optum Eligibility Checker
            </h1>
            <div className="flex items-center gap-4">
              {/* Credentials status indicator */}
              {(eligibilityCredentials || payerLookupCredentials) && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-600">✓</span>
                  <span>Credentials configured</span>
                </div>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2 text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-140px)]">
          {/* Left Column - Form */}
          <div className="flex-shrink-0 lg:w-1/2 xl:w-2/5 flex flex-col">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex-1 overflow-y-auto">
              <EnvironmentSelector 
                environment={environment} 
                onEnvironmentChange={handleEnvironmentChange} 
              />
              <div className="mt-6">
                <EligibilityForm 
                  onSubmit={handleSubmit} 
                  loading={loading} 
                  environment={environment} 
                  credentials={payerLookupCredentials}
                  eligibilityCredentials={eligibilityCredentials}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="flex-1 lg:w-1/2 xl:w-3/5 flex flex-col min-h-0">
            {loading ? (
              <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500 space-y-4">
                  <div className="flex justify-center">
                    <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-700">Checking eligibility...</p>
                    <p className="text-sm text-gray-500">Eligibility results will appear here</p>
                  </div>
                </div>
              </div>
            ) : (response || error) ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-y-auto">
                <ResponseDisplay request={lastRequest} response={response} error={error} />
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">Eligibility results will appear here</p>
                  <p className="text-sm mt-2">Fill out the form and click "Check Eligibility" to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        environment={environment}
        onEligibilityCredentialsChange={setEligibilityCredentials}
        onPayerLookupCredentialsChange={setPayerLookupCredentials}
      />
    </div>
  );
}
