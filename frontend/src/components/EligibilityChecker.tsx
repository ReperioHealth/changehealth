import { useState } from 'react';
import EnvironmentSelector from './EnvironmentSelector';
import EligibilityForm from './EligibilityForm';
import ResponseDisplay from './ResponseDisplay';
import { checkEligibility } from '../services/api';
import type { Credentials, EligibilityRequest, EligibilityResponse, Environment } from '../types/eligibility';

interface Props {
  environment: Environment;
  onEnvironmentChange: (env: Environment) => void;
  eligibilityCredentials: Credentials | null;
  payerLookupCredentials: Credentials | null;
}

export default function EligibilityChecker({
  environment,
  onEnvironmentChange,
  eligibilityCredentials,
  payerLookupCredentials
}: Props) {
  const [loading, setLoading] = useState(false);
  const [lastRequest, setLastRequest] = useState<EligibilityRequest | null>(null);
  const [response, setResponse] = useState<EligibilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleEnvironmentChange = (env: Environment) => {
    onEnvironmentChange(env);
    // Clear response when switching environments
    setLastRequest(null);
    setResponse(null);
    setError(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-200px)]">
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
  );
}


