import { useState, useEffect } from 'react';
import type { Credentials, Environment } from '../types/eligibility';

const getStorageKey = (type: 'eligibility' | 'payer-lookup', environment: Environment) => {
  return `optum-${type}-credentials-${environment}`;
};

// Credential constants
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

interface Props {
  environment: Environment;
  onEligibilityCredentialsChange: (creds: Credentials | null) => void;
  onPayerLookupCredentialsChange: (creds: Credentials | null) => void;
}

// Component for managing credentials for a specific environment
function EnvironmentCredentialsSection({
  env,
  type,
  defaultCreds,
  onCredentialsChange
}: {
  env: Environment;
  type: 'eligibility' | 'payer-lookup';
  defaultCreds: Credentials;
  onCredentialsChange: (creds: Credentials | null) => void;
}) {
  const storageKey = getStorageKey(type, env);
  const loadCredentials = (key: string): Credentials | null => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedCreds = loadCredentials(storageKey);
  const initialCreds = savedCreds || defaultCreds;
  
  const [clientId, setClientId] = useState(initialCreds.clientId);
  const [clientSecret, setClientSecret] = useState(initialCreds.clientSecret);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(savedCreds === null);

  useEffect(() => {
    const creds = loadCredentials(storageKey);
    const finalCreds = creds || defaultCreds;
    setClientId(finalCreds.clientId);
    setClientSecret(finalCreds.clientSecret);
    setIsEditing(creds === null);
  }, [storageKey, defaultCreds]);

  const handleSave = () => {
    if (clientId && clientSecret) {
      const creds = { clientId, clientSecret };
      localStorage.setItem(storageKey, JSON.stringify(creds));
      // Always notify parent - it will check if this is for the current environment
      onCredentialsChange(creds);
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(storageKey);
    setClientId(defaultCreds.clientId);
    setClientSecret(defaultCreds.clientSecret);
    onCredentialsChange(defaultCreds);
    setIsEditing(true);
  };

  const maskClientId = (id: string) => {
    if (!id) return '';
    if (id.length <= 8) return '•'.repeat(id.length);
    return id.substring(0, 4) + '•'.repeat(id.length - 8) + id.substring(id.length - 4);
  };

  const hasCreds = loadCredentials(storageKey) !== null;
  const envLabel = env === 'sandbox' ? 'Sandbox' : 'Production';
  const typeLabel = type === 'eligibility' ? 'Eligibility API' : 'Payer Lookup API';
  const bgColor = env === 'sandbox' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200';
  const textColor = env === 'sandbox' ? 'text-yellow-600' : 'text-blue-600';

  return (
    <div className={`p-4 ${bgColor} border rounded`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">
          {envLabel} - {typeLabel}
        </h4>
        {!isEditing && hasCreds && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={`text-xs ${textColor} hover:underline`}
          >
            Edit credentials
          </button>
        )}
      </div>
      
      {!isEditing && hasCreds ? (
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✓</span>
            <span className="text-xs text-gray-700">
              Credentials saved (Client ID: {maskClientId(clientId)})
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-600 hover:text-red-800 hover:underline"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          />
          <input
            type="password"
            placeholder="Client Secret"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!clientId || !clientSecret}
              className={`px-3 py-1.5 text-sm text-white rounded hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed ${
                env === 'sandbox' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saved ? '✓ Saved!' : 'Save'}
            </button>
            {hasCreds && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  const saved = loadCredentials(storageKey);
                  if (saved) {
                    setClientId(saved.clientId);
                    setClientSecret(saved.clientSecret);
                  }
                }}
                className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CredentialsForm({ 
  environment,
  onEligibilityCredentialsChange, 
  onPayerLookupCredentialsChange 
}: Props) {
  // Update credentials when environment changes - notify parent of current environment's credentials
  useEffect(() => {
    const loadCredentials = (key: string): Credentials | null => {
      try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    };

    const eligStorageKey = getStorageKey('eligibility', environment);
    const payerStorageKey = getStorageKey('payer-lookup', environment);
    const eligCreds = loadCredentials(eligStorageKey);
    const payerCreds = loadCredentials(payerStorageKey);
    
    // Use saved credentials if available, otherwise use defaults for current environment
    const finalEligCreds = eligCreds || (environment === 'sandbox' ? SANDBOX_CREDENTIALS : PRODUCTION_ELIGIBILITY_CREDENTIALS);
    const finalPayerCreds = payerCreds || (environment === 'sandbox' ? SANDBOX_CREDENTIALS : PRODUCTION_PAYER_LOOKUP_CREDENTIALS);
    
    // Notify parent components of current environment's credentials
    onEligibilityCredentialsChange(finalEligCreds);
    onPayerLookupCredentialsChange(finalPayerCreds);
  }, [environment, onEligibilityCredentialsChange, onPayerLookupCredentialsChange]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Sandbox Credentials</h3>
        <div className="space-y-4">
          <EnvironmentCredentialsSection
            env="sandbox"
            type="eligibility"
            defaultCreds={SANDBOX_CREDENTIALS}
            onCredentialsChange={(creds) => {
              // If this is for the current environment, update immediately
              if (environment === 'sandbox') {
                onEligibilityCredentialsChange(creds);
              }
              // Otherwise, the useEffect will pick it up when environment changes
            }}
          />
          <EnvironmentCredentialsSection
            env="sandbox"
            type="payer-lookup"
            defaultCreds={SANDBOX_CREDENTIALS}
            onCredentialsChange={(creds) => {
              // If this is for the current environment, update immediately
              if (environment === 'sandbox') {
                onPayerLookupCredentialsChange(creds);
              }
              // Otherwise, the useEffect will pick it up when environment changes
            }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Production Credentials</h3>
        <div className="space-y-4">
          <EnvironmentCredentialsSection
            env="production"
            type="eligibility"
            defaultCreds={PRODUCTION_ELIGIBILITY_CREDENTIALS}
            onCredentialsChange={(creds) => {
              // If this is for the current environment, update immediately
              if (environment === 'production') {
                onEligibilityCredentialsChange(creds);
              }
              // Otherwise, the useEffect will pick it up when environment changes
            }}
          />
          <EnvironmentCredentialsSection
            env="production"
            type="payer-lookup"
            defaultCreds={PRODUCTION_PAYER_LOOKUP_CREDENTIALS}
            onCredentialsChange={(creds) => {
              // If this is for the current environment, update immediately
              if (environment === 'production') {
                onPayerLookupCredentialsChange(creds);
              }
              // Otherwise, the useEffect will pick it up when environment changes
            }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center pt-4 border-t">
        Credentials are stored locally in your browser and sent to the backend for OAuth2 token exchange.
        The credentials for the currently selected environment ({environment}) will be used automatically.
      </p>
    </div>
  );
}

