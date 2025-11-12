import { useState, useEffect, useRef } from 'react';
import { lookupPayer, getAllPayers, type PayerLookupResult, type Payer } from '../services/api';
import type { EligibilityRequest, Environment, Credentials } from '../types/eligibility';
import ApiResponseModal from './ApiResponseModal';

const STORAGE_KEY_PAYERS = 'optum-payers-list';

interface Props {
  onSubmit: (data: EligibilityRequest) => void;
  loading: boolean;
  environment: Environment;
  credentials?: Credentials | null; // Payer lookup credentials
  eligibilityCredentials?: Credentials | null; // Eligibility API credentials
}

// Sandbox test data constants
const SANDBOX_TEST_DATA = {
  tradingPartnerServiceId: '00001', // Test payer ID that returns single coverage plan
  providerOrgName: 'happy doctors group',
  providerNPI: '0123456789',
  memberId: '0000000000',
  firstName: 'johnone',
  lastName: 'doeone',
  dateOfBirth: '1980-01-01',
  gender: 'M' as 'M' | 'F',
  groupNumber: '',
  ssn: ''
};

// Production default data
const PRODUCTION_DEFAULT_DATA = {
  tradingPartnerServiceId: 'UHC', // UnitedHealthcare - use payer code, not numeric ID
  providerOrgName: 'Reperio Health Medical Group, PLLC',
  providerNPI: '1982438362',
  memberId: '22294105300',
  firstName: 'Matthew',
  lastName: 'Wallington',
  dateOfBirth: '1979-11-18',
  gender: 'M' as 'M' | 'F',
  groupNumber: '',
  ssn: ''
};

export default function EligibilityForm({ onSubmit, loading, environment, credentials, eligibilityCredentials }: Props) {
  const [formData, setFormData] = useState(() => {
    // Initialize based on environment
    return environment === 'sandbox' ? SANDBOX_TEST_DATA : PRODUCTION_DEFAULT_DATA;
  });

  const [payerLookup, setPayerLookup] = useState<{
    loading: boolean;
    result: PayerLookupResult | null;
    error: string | null;
    request: { payerId: string; environment: Environment; credentials?: Credentials } | null;
  }>({
    loading: false,
    result: null,
    error: null,
    request: null
  });

  const [showPayerModal, setShowPayerModal] = useState(false);
  const [allPayers, setAllPayers] = useState<Payer[]>([]);
  const [loadingPayers, setLoadingPayers] = useState(false);
  const [payersError, setPayersError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load payers list function (extracted so it can be called manually)
  const loadPayers = async (clearCache = false) => {
    // Check localStorage cache first (keyed by environment)
    const cacheKey = `${STORAGE_KEY_PAYERS}-${environment}`;
    
    if (!clearCache) {
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const cachedPayers = JSON.parse(cached);
          const cacheTime = cachedPayers.timestamp || 0;
          const cacheAge = Date.now() - cacheTime;
          // Use cache if less than 1 hour old
          if (cacheAge < 60 * 60 * 1000) {
            console.log('Using cached payer list');
            setAllPayers(cachedPayers.payers || []);
            return;
          }
        } catch (e) {
          console.log('Failed to parse cached payers, fetching fresh list');
        }
      }
    } else {
      // Clear cache if requested
      localStorage.removeItem(cacheKey);
    }

    // Need credentials to fetch payers
    if (!credentials) {
      console.log('No payer lookup credentials available, skipping payer list fetch');
      return;
    }

    setLoadingPayers(true);
    setPayersError(null);

    try {
      const result = await getAllPayers(
        credentials,
        environment,
        undefined, // No fallback - use only payer lookup credentials
        ['Eligibility'], // Filter for Eligibility transaction type
        'Active' // Only active payers
      );
      
      setAllPayers(result.payers || []);
      
      // Cache the results
      localStorage.setItem(cacheKey, JSON.stringify({
        payers: result.payers || [],
        timestamp: Date.now()
      }));
      
      console.log(`✅ Loaded ${result.payers?.length || 0} payers for dropdown`);
      setPayersError(null); // Clear any previous errors
    } catch (error: any) {
      console.error('Failed to load payers:', error.message);
      setPayersError(error.message);
      // Don't block the form if payer list fails to load
    } finally {
      setLoadingPayers(false);
    }
  };

  // Load payers list on mount and when environment/credentials change
  useEffect(() => {
    loadPayers();
  }, [environment, credentials, retryCount]);

  // Update form data when environment changes
  useEffect(() => {
    if (environment === 'sandbox') {
      setFormData(SANDBOX_TEST_DATA);
    } else {
      setFormData(PRODUCTION_DEFAULT_DATA);
    }
  }, [environment]);

  // Lookup payer when tradingPartnerServiceId changes
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const payerId = formData.tradingPartnerServiceId.trim();
    
    // Reset if empty
    if (!payerId) {
      setPayerLookup({ loading: false, result: null, error: null, request: null });
      return;
    }

    // Set loading state
    const requestPayload = { 
      payerId, 
      environment, 
      credentials: credentials || undefined
    };
    setPayerLookup({ loading: true, result: null, error: null, request: requestPayload });

    // Debounce the API call
    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await lookupPayer(
          payerId, 
          credentials || undefined, 
          environment,
          undefined // No fallback - use only payer lookup credentials
        );
        setPayerLookup({ loading: false, result, error: null, request: requestPayload });
      } catch (error: any) {
        setPayerLookup({ 
          loading: false, 
          result: null, 
          error: error.message,
          request: requestPayload
        });
      }
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [formData.tradingPartnerServiceId, environment, credentials]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate exactly 9-digit control number
    // For sandbox, use predefined values: "000000001", "000000002", "000000003", "000000004", "123456789"
    // For production, generate from timestamp
    const controlNumber = environment === 'sandbox' 
      ? '000000001' // Use predefined sandbox control number
      : String(Date.now()).slice(-9).padStart(9, '0');
    
    // Build request according to Optum Eligibility V3 API spec
    // According to docs: only controlNumber and subscriber are required
    const request: any = {
      controlNumber: controlNumber,
      tradingPartnerServiceId: formData.tradingPartnerServiceId.substring(0, 80),
      subscriber: {
        memberId: formData.memberId.substring(0, 80),
        firstName: formData.firstName.substring(0, 35),
        lastName: formData.lastName.substring(0, 60),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth.replace(/-/g, ''),
        ...(formData.groupNumber && { groupNumber: formData.groupNumber.substring(0, 50) }),
        ...(formData.ssn && { ssn: formData.ssn.substring(0, 50) })
      }
    };

    // Provider is required for EDI conversion (even though marked optional in API spec)
    // Always include provider if fields are provided
    // Note: Provider may be required for successful EDI conversion even in production
    if (formData.providerOrgName || formData.providerNPI) {
      request.provider = {};
      if (formData.providerOrgName) {
        request.provider.organizationName = formData.providerOrgName.substring(0, 60);
      }
      if (formData.providerNPI) {
        request.provider.npi = formData.providerNPI.substring(0, 80);
      }
    }
    
    // For sandbox, provider is required - ensure it's included
    if (environment === 'sandbox' && (!formData.providerOrgName || !formData.providerNPI)) {
      alert('Provider Organization Name and NPI are required for sandbox testing');
      return;
    }
    
    // For production, provider is also required for EDI conversion (even though marked optional in API spec)
    if (environment === 'production' && (!formData.providerOrgName || !formData.providerNPI)) {
      alert('Provider Organization Name and NPI are required for eligibility checks');
      return;
    }

    // Encounter object is optional - removed as it's not necessary for basic eligibility checks
    // If needed for specific service type checks, it can be added back

    // Basic validation for required fields
    if (request.controlNumber.length !== 9 || !/^\d{9}$/.test(request.controlNumber)) {
      alert('Control number must be exactly 9 digits');
      return;
    }
    if (request.subscriber.memberId.length < 2) {
      alert('Member ID must be at least 2 characters');
      return;
    }
    if (!/^[A-Za-z0-9-]+$/.test(request.subscriber.memberId)) {
      alert('Member ID can only contain letters, numbers, and hyphens');
      return;
    }

    onSubmit(request);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Eligibility Check</h2>
      
      <div className="space-y-4 border p-4 rounded">
        <h3 className="font-semibold">Payer</h3>
        <div className="space-y-2">
          {loadingPayers ? (
            <div className="text-sm text-gray-500">Loading payer list...</div>
          ) : allPayers.length > 0 ? (
            <select
              required
              value={(() => {
                // Find the payer that matches the current tradingPartnerServiceId
                const matchingPayer = allPayers.find(p => 
                  p.imnPayerId === formData.tradingPartnerServiceId ||
                  p.payerId === formData.tradingPartnerServiceId ||
                  p.industryPayerId === formData.tradingPartnerServiceId
                );
                // Return the value to use (imnPayerId preferred, fallback to payerId)
                return matchingPayer ? (matchingPayer.imnPayerId || matchingPayer.payerId || '') : formData.tradingPartnerServiceId;
              })()}
              onChange={(e) => {
                const selectedPayer = allPayers.find(p => 
                  (p.imnPayerId || p.payerId) === e.target.value
                );
                // Use imnPayerId if available (this is the tradingPartnerServiceId), otherwise payerId
                const payerId = selectedPayer?.imnPayerId || selectedPayer?.payerId || e.target.value;
                setFormData({...formData, tradingPartnerServiceId: payerId});
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a payer...</option>
              {allPayers.map((payer, index) => {
                // Use imnPayerId as the value (this is what we need for tradingPartnerServiceId)
                // Fallback to payerId if imnPayerId is not available
                const payerId = payer.imnPayerId || payer.payerId || '';
                const displayName = payer.payerPlanName || payer.payerId || payer.imnPayerId || 'Unknown';
                const key = payerId || `payer-${index}`;
                return (
                  <option key={key} value={payerId}>
                    {displayName} {payer.payerId && payer.payerId !== payerId ? `(${payer.payerId})` : ''}
                  </option>
                );
              })}
            </select>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  required
                  placeholder="Payer ID (e.g., UHC, CIGNA, AETNA)"
                  value={formData.tradingPartnerServiceId}
                  onChange={(e) => setFormData({...formData, tradingPartnerServiceId: e.target.value})}
                  className="flex-1 p-2 border rounded"
                />
                {payersError && (
                  <button
                    type="button"
                    onClick={() => {
                      setRetryCount(prev => prev + 1);
                      loadPayers(true); // Clear cache and retry
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    disabled={loadingPayers}
                  >
                    {loadingPayers ? 'Loading...' : 'Retry'}
                  </button>
                )}
              </div>
              {payersError && (
                <div className="text-xs text-orange-600 space-y-1">
                  <div>Could not load payer list: {payersError}</div>
                  <div>You can still enter a payer ID manually, or click Retry to try again.</div>
                  {payersError.includes('401') && (
                    <div className="text-red-600 font-semibold mt-1">
                      Note: 401 Unauthorized suggests the credentials may not have permission to fetch all payers.
                      The Payer List API may require different permissions than single payer lookup.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {formData.tradingPartnerServiceId && (
            <div className="text-sm space-y-1">
              {payerLookup.loading && (
                <span className="text-gray-500">Looking up payer...</span>
              )}
              {!payerLookup.loading && payerLookup.result && payerLookup.result.total > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">
                    ✓ Match found: {payerLookup.result.payers[0].payerPlanName || 'Unknown Name'}
                  </span>
                  {(payerLookup.request || payerLookup.result) && (
                    <button
                      type="button"
                      onClick={() => setShowPayerModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      View API Request/Response
                    </button>
                  )}
                </div>
              )}
              {!payerLookup.loading && payerLookup.result && payerLookup.result.total === 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-medium">
                    ✗ Payer not found
                  </span>
                  {(payerLookup.request || payerLookup.error) && (
                    <button
                      type="button"
                      onClick={() => setShowPayerModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      View API Request/Response
                    </button>
                  )}
                </div>
              )}
              {!payerLookup.loading && payerLookup.error && (
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">
                    Unable to verify payer
                  </span>
                  {(payerLookup.request || payerLookup.error) && (
                    <button
                      type="button"
                      onClick={() => setShowPayerModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      View API Request/Response
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 border p-4 rounded">
        <h3 className="font-semibold">
          Provider
          <span className="text-red-600 ml-1">*</span>
          <span className="text-xs text-gray-500 ml-2">(Required for EDI conversion)</span>
        </h3>
        <input
          required
          placeholder="Organization Name (required)"
          value={formData.providerOrgName}
          onChange={(e) => setFormData({...formData, providerOrgName: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          required
          placeholder="NPI - 10 digits (required)"
          pattern="\d{10}"
          value={formData.providerNPI}
          onChange={(e) => setFormData({...formData, providerNPI: e.target.value})}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="space-y-4 border p-4 rounded">
        <h3 className="font-semibold">Patient</h3>
        <input
          required
          placeholder="Member ID"
          value={formData.memberId}
          onChange={(e) => setFormData({...formData, memberId: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            required
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            className="p-2 border rounded"
          />
          <input
            required
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            className="p-2 border rounded"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            required
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
            className="p-2 border rounded"
          />
          <select
            required
            value={formData.gender}
            onChange={(e) => setFormData({...formData, gender: e.target.value as 'M' | 'F'})}
            className="p-2 border rounded"
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <input
          placeholder="Group Number (optional)"
          value={formData.groupNumber}
          onChange={(e) => setFormData({...formData, groupNumber: e.target.value})}
          className="w-full p-2 border rounded"
        />
        <input
          placeholder="SSN (optional)"
          value={formData.ssn}
          onChange={(e) => setFormData({...formData, ssn: e.target.value})}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Checking...' : 'Check Eligibility'}
      </button>

      {/* Payer Lookup API Response Modal */}
      <ApiResponseModal
        isOpen={showPayerModal}
        onClose={() => setShowPayerModal(false)}
        title="Payer Lookup API Request/Response"
        request={payerLookup.request ? {
          endpoint: `/api/eligibility/lookup-payer`,
          method: 'POST',
          body: payerLookup.request
        } : undefined}
        response={payerLookup.result || undefined}
        error={payerLookup.error || undefined}
      />
    </form>
  );
}

