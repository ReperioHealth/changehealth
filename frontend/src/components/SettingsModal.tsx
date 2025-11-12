import { useState } from 'react';
import CredentialsForm from './CredentialsForm';
import type { Credentials, Environment } from '../types/eligibility';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  environment: Environment;
  onEligibilityCredentialsChange: (creds: Credentials | null) => void;
  onPayerLookupCredentialsChange: (creds: Credentials | null) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  environment,
  onEligibilityCredentialsChange,
  onPayerLookupCredentialsChange
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Settings</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <CredentialsForm
            environment={environment}
            onEligibilityCredentialsChange={onEligibilityCredentialsChange}
            onPayerLookupCredentialsChange={onPayerLookupCredentialsChange}
          />
        </div>
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

