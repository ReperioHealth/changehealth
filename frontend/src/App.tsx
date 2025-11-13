import { useState, useEffect } from 'react';
import TabNavigation, { type TabType } from './components/TabNavigation';
import SettingsModal from './components/SettingsModal';
import EligibilityChecker from './components/EligibilityChecker';
import ClaimForm from './components/ClaimForm';
import ClaimsStatus from './components/ClaimsStatus';
import ClaimsReconciliation from './components/ClaimsReconciliation';
import type { Credentials, Environment } from './types/eligibility';

const STORAGE_KEY_ENVIRONMENT = 'optum-eligibility-environment';
const STORAGE_KEY_ACTIVE_TAB = 'optum-active-tab';

export default function App() {
  // Load active tab from localStorage or default to eligibility
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_TAB);
    return (saved === 'eligibility' || saved === 'claim-form' || saved === 'claims-status' || saved === 'claims-reconciliation') 
      ? saved as TabType 
      : 'eligibility';
  });

  // Load environment from localStorage or default to sandbox
  const [environment, setEnvironment] = useState<Environment>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ENVIRONMENT);
    return (saved === 'production' || saved === 'sandbox') ? saved : 'sandbox';
  });
  
  const [eligibilityCredentials, setEligibilityCredentials] = useState<Credentials | null>(null);
  const [payerLookupCredentials, setPayerLookupCredentials] = useState<Credentials | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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

  // Persist active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTab);
  }, [activeTab]);

  const handleEnvironmentChange = (env: Environment) => {
    setEnvironment(env);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'eligibility':
        return (
          <EligibilityChecker
            environment={environment}
            onEnvironmentChange={handleEnvironmentChange}
            eligibilityCredentials={eligibilityCredentials}
            payerLookupCredentials={payerLookupCredentials}
          />
        );
      case 'claim-form':
        return (
          <ClaimForm
            environment={environment}
            credentials={eligibilityCredentials}
            onEnvironmentChange={handleEnvironmentChange}
          />
        );
      case 'claims-status':
        return (
          <ClaimsStatus
            environment={environment}
            credentials={eligibilityCredentials}
          />
        );
      case 'claims-reconciliation':
        return (
          <ClaimsReconciliation
            environment={environment}
            credentials={eligibilityCredentials}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Full Width */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Optum API Tools
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

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {renderTabContent()}
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
