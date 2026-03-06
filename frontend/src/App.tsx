import { useState, useEffect } from 'react';
import TabNavigation, { type TabType } from './components/TabNavigation';
import EligibilityChecker from './components/EligibilityChecker';
import ClaimForm from './components/ClaimForm';
import ClaimsStatus from './components/ClaimsStatus';
import ClaimsReconciliation from './components/ClaimsReconciliation';
import type { Environment } from './types/eligibility';

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
          />
        );
      case 'claim-form':
        return (
          <ClaimForm
            environment={environment}
            onEnvironmentChange={handleEnvironmentChange}
          />
        );
      case 'claims-status':
        return (
          <ClaimsStatus
            environment={environment}
          />
        );
      case 'claims-reconciliation':
        return (
          <ClaimsReconciliation
            environment={environment}
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
          <h1 className="text-2xl sm:text-3xl font-bold">
            Optum API Tools
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
