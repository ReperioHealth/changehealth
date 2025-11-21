import { useState, useEffect } from 'react';
import type { ClaimSubmissionRequest, ServiceLine, ClaimResponse } from '../types/claims';
import type { Environment, Credentials } from '../types/eligibility';
import { validateClaim, submitClaim, generateClaimPDF } from '../services/claimsApi';
import { exportPayerList, parseCsvToPayers, type Payer } from '../services/api';
import providerOptionsData from '../data/providerOptions.json';
import ClaimResponseDisplay from './ClaimResponseDisplay';
import EnvironmentSelector from './EnvironmentSelector';
import ApiResponseModal from './ApiResponseModal';

interface Props {
  environment: Environment;
  credentials: Credentials | null;
  payerLookupCredentials?: Credentials | null;
  onEnvironmentChange?: (env: Environment) => void;
}

const STORAGE_KEY_PAYERS = 'optum-payers-list-claims';
const STORAGE_KEY_PAYERS_CSV = 'optum-payers-csv-claims';
const STORAGE_KEY_SELECTED_PAYER = 'optum-selected-payer-claims';
const STORAGE_KEY_FORM_DATA = 'optum-claim-form-data';
const STORAGE_KEY_USAGE_INDICATOR = 'optum-claim-usage-indicator';
const CUSTOM_PROVIDER_OPTION = 'custom';

type ProviderOption = {
  name: string; // Display label in dropdown
  organizationName: string; // Actual value submitted to API
  npi: string;
  ein?: string;
  address?: {
    address1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  phone?: string;
};

const PROVIDER_OPTIONS = providerOptionsData as ProviderOption[];

// US States for dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' }
];

// Phone number formatting function
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format as XXX-XXX-XXXX
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
}

// Currency formatting function - formats as user types (right to left with decimal)
function formatCurrency(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  if (digits === '') return '';
  
  // Convert to cents and format as dollars.cents
  const cents = parseInt(digits, 10);
  const dollars = Math.floor(cents / 100);
  const centsRemainder = cents % 100;
  
  // Format with 2 decimal places
  return `${dollars}.${centsRemainder.toString().padStart(2, '0')}`;
}

// Parse currency string to store as cents (integer)
function parseCurrencyToCents(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits;
}

// Format SSN: XXX-XX-XXXX
function formatSSN(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

// Validate SSN (9 digits)
function validateSSN(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 9 && /^\d{9}$/.test(digits);
}


function formatDateForAPI(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '');
}

function formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
  return dateStr;
}

export default function ClaimForm({ environment, credentials, payerLookupCredentials, onEnvironmentChange }: Props) {
  // Load form data from localStorage or use defaults
  const [formData, setFormData] = useState<Partial<ClaimSubmissionRequest>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FORM_DATA);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.log('Failed to parse saved form data');
      }
    }
    
    const initialData: Partial<ClaimSubmissionRequest> = {};
    // Box 1: Set "Other" (CI) as default
    initialData.claimInformation = {
      claimFilingCode: 'CI',
      outsideLab: false // Box 20: Set "No" as default
    } as Partial<ClaimSubmissionRequest>['claimInformation'];
    // Box 25: Set EIN as default
    initialData.billing = {
      taxIdType: 'EIN',
      providerType: 'Organization' // Set default provider type
    } as Partial<ClaimSubmissionRequest>['billing'];
    return initialData;
  });
  
  // Usage indicator state (T=Test, P=Production)
  const [submitAsTest, setSubmitAsTest] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USAGE_INDICATOR);
    return saved ? saved === 'true' : true; // Default to test mode
  });
  
  // Local state for signature fields (not in API structure)
  const [patientSignatureOnFile, setPatientSignatureOnFile] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_FORM_DATA}-patientSignature`);
    return saved ? saved === 'true' : true;
  });
  const [authorizedSignatureOnFile, setAuthorizedSignatureOnFile] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_FORM_DATA}-authorizedSignature`);
    return saved ? saved === 'true' : true;
  });
  const [physicianSignatureOnFile, setPhysicianSignatureOnFile] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_FORM_DATA}-physicianSignature`);
    return saved ? saved === 'true' : true;
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ClaimResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<ClaimSubmissionRequest | null>(null);
  const [actionType, setActionType] = useState<'validate' | 'submit' | null>(null);

  // Payer state
  const [allPayers, setAllPayers] = useState<Payer[]>([]);
  const [loadingPayers, setLoadingPayers] = useState(false);
  const [payersError, setPayersError] = useState<string | null>(null);
  const [showPayerModal, setShowPayerModal] = useState(false);
  const [payersApiRequest, setPayersApiRequest] = useState<{
    endpoint: string;
    method: string;
    body: any;
  } | null>(null);
  const [payersApiResponse, setPayersApiResponse] = useState<any>(null);
  const [selectedPayerName, setSelectedPayerName] = useState<string>('');

  // Provider state
  const [selectedProviderOption, setSelectedProviderOption] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_FORM_DATA}-providerOption`);
    return saved || CUSTOM_PROVIDER_OPTION;
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FORM_DATA, JSON.stringify(formData));
  }, [formData]);

  // Save usage indicator to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USAGE_INDICATOR, submitAsTest.toString());
  }, [submitAsTest]);

  // Save signature states to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_FORM_DATA}-patientSignature`, patientSignatureOnFile.toString());
    localStorage.setItem(`${STORAGE_KEY_FORM_DATA}-authorizedSignature`, authorizedSignatureOnFile.toString());
    localStorage.setItem(`${STORAGE_KEY_FORM_DATA}-physicianSignature`, physicianSignatureOnFile.toString());
  }, [patientSignatureOnFile, authorizedSignatureOnFile, physicianSignatureOnFile]);

  // Save provider option to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_FORM_DATA}-providerOption`, selectedProviderOption);
  }, [selectedProviderOption]);

  // Load payers list function
  const loadPayers = async (clearCache = false) => {
    const cacheKey = `${STORAGE_KEY_PAYERS}-${environment}`;
    const csvCacheKey = `${STORAGE_KEY_PAYERS_CSV}-${environment}`;
    
    if (!clearCache) {
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const cachedPayers = JSON.parse(cached);
          const cacheTime = cachedPayers.timestamp || 0;
          const cacheAge = Date.now() - cacheTime;
          // Use cache if less than 24 hours old
          if (cacheAge < 24 * 60 * 60 * 1000) {
            console.log('Using cached payer list for claims (age:', Math.round(cacheAge / 1000 / 60), 'minutes)');
            setAllPayers(cachedPayers.payers || []);
            return;
          }
        } catch (e) {
          console.log('Failed to parse cached payers, fetching fresh list');
        }
      }
    } else {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(csvCacheKey);
    }

    if (!payerLookupCredentials) {
      console.log('No Payer Lookup API credentials available for Claims Form');
      return;
    }

    setLoadingPayers(true);
    setPayersError(null);

    const payerListParams = {
      system: 'IMN',
      transactionType: ['Eligibility'],
      status: 'Active'
    };

    try {
      console.log('Exporting payers list as CSV for claims...');
      const exportResult = await exportPayerList(
        payerLookupCredentials,
        environment,
        payerListParams
      );
      
      if (exportResult._optumApiRequest) {
        setPayersApiRequest({
          endpoint: exportResult._optumApiRequest.url,
          method: exportResult._optumApiRequest.method,
          body: exportResult._optumApiRequest.params
        });
      }
      
      const payers = parseCsvToPayers(exportResult.csv);
      
      setAllPayers(payers);
      setPayersApiResponse({ 
        csvLength: exportResult.csv.length,
        parsedPayers: payers.length,
        sample: payers.slice(0, 3)
      });
      
      localStorage.setItem(cacheKey, JSON.stringify({
        payers: payers,
        timestamp: Date.now()
      }));
      localStorage.setItem(csvCacheKey, exportResult.csv);
      
      console.log(`✅ Loaded ${payers.length} payers from CSV export for claims`);
      setPayersError(null);
      
    } catch (error: any) {
      console.error('Failed to export payers for claims:', error.message);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(error.message);
      } catch {
        errorDetails = { message: error.message };
      }
      
      if (errorDetails._optumApiRequest) {
        setPayersApiRequest({
          endpoint: errorDetails._optumApiRequest.url,
          method: errorDetails._optumApiRequest.method,
          body: errorDetails._optumApiRequest.params
        });
      }
      
      setPayersError(errorDetails.message || error.message);
      setPayersApiResponse({ 
        error: errorDetails.message || error.message,
        details: errorDetails.details,
        statusCode: errorDetails.statusCode
      });
    } finally {
      setLoadingPayers(false);
    }
  };

  // Handle provider dropdown change
  const handleProviderPresetChange = (value: string) => {
    setSelectedProviderOption(value);
    
    if (value === CUSTOM_PROVIDER_OPTION) {
      // Clear provider fields when custom is selected
      return;
    }

    const selectedOption = PROVIDER_OPTIONS.find((option) => option.npi === value);
    if (selectedOption) {
      // Populate both Box 32 (Service Facility) and Box 33 (Billing Provider)
      setFormData((prev) => {
        const newData = { ...prev };
        
        // Box 33 (Billing Provider) - use organizationName for submission
        newData.billing = {
          ...newData.billing,
          providerType: 'Organization',
          organizationName: selectedOption.organizationName,
          npi: selectedOption.npi,
          employerId: selectedOption.ein || newData.billing?.employerId,
          taxIdType: selectedOption.ein ? 'EIN' : newData.billing?.taxIdType,
          address: selectedOption.address ? {
            address1: selectedOption.address.address1,
            city: selectedOption.address.city,
            state: selectedOption.address.state,
            postalCode: selectedOption.address.postalCode
          } : newData.billing?.address,
          contactInformation: {
            ...newData.billing?.contactInformation,
            phoneNumber: selectedOption.phone || newData.billing?.contactInformation?.phoneNumber
          }
        };
        
        // Box 32 (Service Facility Location) - use organizationName for submission
        if (!newData.claimInformation) {
          newData.claimInformation = {} as any;
        }
        newData.claimInformation.serviceFacilityLocation = {
          organizationName: selectedOption.organizationName,
          npi: selectedOption.npi,
          address: selectedOption.address ? {
            address1: selectedOption.address.address1,
            city: selectedOption.address.city,
            state: selectedOption.address.state,
            postalCode: selectedOption.address.postalCode
          } : undefined
        };
        
        return newData;
      });
    }
  };

  // Handle payer selection
  const handlePayerChange = (payerId: string) => {
    const selectedPayer = allPayers.find(p => p.payerId === payerId);
    
    setFormData((prev) => {
      const newData = { ...prev };
      
      // Set trading partner service ID
      newData.tradingPartnerServiceId = payerId;
      
      // Set receiver organization name from payer
      if (selectedPayer) {
        newData.receiver = {
          organizationName: selectedPayer.payerPlanName || selectedPayer.payerId || ''
        };
        setSelectedPayerName(selectedPayer.payerPlanName || '');
      }
      
      return newData;
    });
    
    // Save to localStorage
    const savedPayerKey = `${STORAGE_KEY_SELECTED_PAYER}-${environment}`;
    localStorage.setItem(savedPayerKey, payerId);
  };

  // Load payers on mount and when environment/credentials change
  useEffect(() => {
    loadPayers();
  }, [environment, payerLookupCredentials]);

  // Load previously selected payer on mount
  useEffect(() => {
    const savedPayerKey = `${STORAGE_KEY_SELECTED_PAYER}-${environment}`;
    const savedPayerId = localStorage.getItem(savedPayerKey);
    if (savedPayerId && formData.tradingPartnerServiceId !== savedPayerId) {
      handlePayerChange(savedPayerId);
    }
  }, [environment, allPayers]);

  // Clear response when environment changes (but keep form data)
  useEffect(() => {
    setResponse(null);
    setError(null);
  }, [environment]);

  // Auto-calculate Box 28 (Total Charge) from sum of all Box 24f (service line charges)
  useEffect(() => {
    const serviceLines = formData.claimInformation?.serviceLines || [];
    let totalCents = 0;
    
    serviceLines.forEach(line => {
      const chargeAmount = line.professionalService?.lineItemChargeAmount;
      if (chargeAmount && chargeAmount !== '') {
        // Charge amounts are stored as strings of digits (cents)
        const cents = parseInt(chargeAmount, 10);
        if (!isNaN(cents)) {
          totalCents += cents;
        }
      }
    });
    
    // Update Box 28 with the calculated total (only if different to avoid infinite loop)
    const totalAsString = totalCents.toString();
    const currentTotal = formData.claimInformation?.claimChargeAmount || '0';
    if (currentTotal !== totalAsString) {
      updateField(['claimInformation', 'claimChargeAmount'], totalAsString);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.claimInformation?.serviceLines]);

  // Auto-update Box 4 and Box 7 when Box 2 or Box 5 changes, if "Self" is selected in Box 6
  useEffect(() => {
    if (formData.dependent?.relationshipToSubscriberCode === '18') {
      setFormData(prev => {
        const newData = { ...prev };
        
        // Copy Box 2 (Patient's Name) to Box 4 (Insured's Name)
        const patientLastName = formData.dependent?.lastName ?? '';
        const patientFirstName = formData.dependent?.firstName ?? '';
        const patientMiddleName = formData.dependent?.middleName ?? '';
        
        // Copy Box 5 (Patient's Address) to Box 7 (Insured's Address)
        const patientAddress1 = formData.dependent?.address?.address1 ?? '';
        const patientCity = formData.dependent?.address?.city ?? '';
        const patientState = formData.dependent?.address?.state ?? '';
        const patientPostalCode = formData.dependent?.address?.postalCode ?? '';
        const patientPhone = formData.dependent?.contactInformation?.phoneNumber ?? '';
        
        if (!newData.subscriber) {
          newData.subscriber = {
            paymentResponsibilityLevelCode: prev.subscriber?.paymentResponsibilityLevelCode || '1'
          };
        }
        
        // Always sync name fields (including empty strings) when Self is selected
        newData.subscriber = {
          ...newData.subscriber,
          lastName: patientLastName,
          firstName: patientFirstName,
          middleName: patientMiddleName,
          paymentResponsibilityLevelCode: newData.subscriber.paymentResponsibilityLevelCode || '1'
        };
        
        // Always sync address fields (including empty strings) when Self is selected
        if (!newData.subscriber.address) {
          newData.subscriber.address = {
            address1: patientAddress1,
            city: patientCity
          };
        } else {
          newData.subscriber.address = {
            ...newData.subscriber.address,
            address1: patientAddress1,
            city: patientCity,
            state: patientState,
            postalCode: patientPostalCode
          };
        }
        
        if (!newData.subscriber.contactInformation) {
          newData.subscriber.contactInformation = {
            phoneNumber: patientPhone
          };
        } else {
          newData.subscriber.contactInformation = {
            ...newData.subscriber.contactInformation,
            phoneNumber: patientPhone
          };
        }
        
        // Ensure paymentResponsibilityLevelCode is set
        newData.subscriber = {
          ...newData.subscriber,
          paymentResponsibilityLevelCode: newData.subscriber.paymentResponsibilityLevelCode || '1'
        };
        
        return newData;
      });
    }
  }, [
    formData.dependent?.relationshipToSubscriberCode,
    formData.dependent?.lastName,
    formData.dependent?.firstName,
    formData.dependent?.middleName,
    formData.dependent?.address?.address1,
    formData.dependent?.address?.city,
    formData.dependent?.address?.state,
    formData.dependent?.address?.postalCode,
    formData.dependent?.contactInformation?.phoneNumber
  ]);

  const updateField = (path: string[], value: unknown) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: Record<string, unknown> = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]] as Record<string, unknown>;
      }
      
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const addServiceLine = () => {
    const currentLines = formData.claimInformation?.serviceLines || [];
    if (currentLines.length >= 6) return;
    
    const newLine: ServiceLine = {
      serviceDate: '',
      serviceDateEnd: '',
      professionalService: {
        procedureIdentifier: 'HC',
        procedureCode: '',
        procedureModifiers: [],
        lineItemChargeAmount: '',
        measurementUnit: 'UN',
        serviceUnitCount: '',
        placeOfServiceCode: '10',
        compositeDiagnosisCodePointers: {
          diagnosisCodePointers: []
        }
      }
    };
    
    updateField(['claimInformation', 'serviceLines'], [...currentLines, newLine]);
  };

  const updateServiceLine = (index: number, field: string, value: string) => {
    const serviceLines = [...(formData.claimInformation?.serviceLines || [])];
    if (!serviceLines[index]) return;
    
    if (field.includes('.')) {
      const [mainField, subField] = field.split('.');
      serviceLines[index] = {
        ...serviceLines[index],
        [mainField]: {
          ...(serviceLines[index] as unknown as Record<string, Record<string, unknown>>)[mainField],
          [subField]: value
        }
      } as ServiceLine;
    } else {
      serviceLines[index] = {
        ...serviceLines[index],
        [field]: value
      } as ServiceLine;
    }
    updateField(['claimInformation', 'serviceLines'], serviceLines);
  };

  const updateDiagnosis = (index: number, value: string) => {
    const diagnoses = [...(formData.claimInformation?.healthCareCodeInformation || [])];
    if (!diagnoses[index]) {
      diagnoses[index] = { diagnosisTypeCode: 'ABK', diagnosisCode: value };
    } else {
      diagnoses[index].diagnosisCode = value;
    }
    updateField(['claimInformation', 'healthCareCodeInformation'], diagnoses);
  };

  const handleValidate = async () => {
    if (!credentials) {
      setError('Credentials required');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setActionType('validate');

    try {
      // Build submitter from billing provider data
      const submitter = formData.submitter || {
        organizationName: formData.billing?.organizationName || formData.billing?.lastName || 'SUBMITTER ORG',
        contactInformation: {
          name: formData.billing?.organizationName || formData.billing?.lastName || 'Contact',
          phoneNumber: formData.billing?.contactInformation?.phoneNumber || '5555555555',
          email: formData.billing?.contactInformation?.email
        }
      };

      const claimRequest: ClaimSubmissionRequest = {
        controlNumber: formData.controlNumber || `CLM${Date.now()}`.slice(0, 30),
        tradingPartnerServiceId: formData.tradingPartnerServiceId || '',
        usageIndicator: submitAsTest ? 'T' : 'P',
        submitter: submitter,
        receiver: formData.receiver || {
          organizationName: selectedPayerName || 'RECEIVER ORG'
        },
        subscriber: {
          memberId: formData.subscriber?.memberId || '',
          firstName: formData.subscriber?.firstName || '',
          lastName: formData.subscriber?.lastName || '',
          gender: formData.subscriber?.gender || 'M',
          dateOfBirth: formData.subscriber?.dateOfBirth || '',
          paymentResponsibilityLevelCode: formData.subscriber?.paymentResponsibilityLevelCode || '1',
          address: formData.subscriber?.address || {
            address1: '',
            city: '',
            state: '',
            postalCode: ''
          },
          ...(formData.subscriber?.ssn && { ssn: formData.subscriber.ssn }),
          ...(formData.subscriber?.contactInformation && { contactInformation: formData.subscriber.contactInformation }),
          ...(formData.subscriber?.middleName && { middleName: formData.subscriber.middleName }),
          ...(formData.subscriber?.groupNumber && { groupNumber: formData.subscriber.groupNumber })
        },
        ...(formData.dependent && { dependent: formData.dependent }),
        billing: formData.billing || {
          organizationName: '',
          npi: '',
          providerType: 'Organization',
          address: {
            address1: '',
            city: '',
            state: '',
            postalCode: ''
          }
        },
        ...(formData.rendering && { rendering: formData.rendering }),
        ...(formData.referring && { referring: formData.referring }),
        claimInformation: {
          claimFilingCode: formData.claimInformation?.claimFilingCode || '',
          patientControlNumber: formData.claimInformation?.patientControlNumber || '',
          placeOfServiceCode: formData.claimInformation?.placeOfServiceCode || '11',
          claimChargeAmount: formData.claimInformation?.claimChargeAmount ? formatCurrency(formData.claimInformation.claimChargeAmount) : '0.00',
          planParticipationCode: formData.claimInformation?.planParticipationCode || '',
          claimFrequencyCode: formData.claimInformation?.claimFrequencyCode || '1',
          signatureIndicator: formData.claimInformation?.signatureIndicator || 'Y',
          benefitsAssignmentCertificationIndicator: formData.claimInformation?.benefitsAssignmentCertificationIndicator || 'Y',
          releaseInformationCode: formData.claimInformation?.releaseInformationCode || 'Y',
          ...(formData.claimInformation?.patientAmountPaid && { patientAmountPaid: formatCurrency(formData.claimInformation.patientAmountPaid) }),
          ...(formData.claimInformation?.claimSupplementalInformation && { claimSupplementalInformation: formData.claimInformation.claimSupplementalInformation }),
          ...(formData.claimInformation?.serviceFacilityLocation && { serviceFacilityLocation: formData.claimInformation.serviceFacilityLocation }),
          healthCareCodeInformation: formData.claimInformation?.healthCareCodeInformation || [],
          serviceLines: formData.claimInformation?.serviceLines || []
        }
      };

      if (claimRequest.subscriber.dateOfBirth) {
        claimRequest.subscriber.dateOfBirth = formatDateForAPI(claimRequest.subscriber.dateOfBirth);
      }
      if (claimRequest.dependent?.dateOfBirth) {
        claimRequest.dependent.dateOfBirth = formatDateForAPI(claimRequest.dependent.dateOfBirth);
      }
      claimRequest.claimInformation.serviceLines = claimRequest.claimInformation.serviceLines.map(line => ({
        ...line,
        serviceDate: formatDateForAPI(line.serviceDate)
      }));

      setLastRequest(claimRequest);
      const result = await validateClaim(claimRequest, credentials, environment);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!credentials) {
      setError('Credentials required');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setActionType('submit');

    try {
      // Build submitter from billing provider data
      const submitter = formData.submitter || {
        organizationName: formData.billing?.organizationName || formData.billing?.lastName || 'SUBMITTER ORG',
        contactInformation: {
          name: formData.billing?.organizationName || formData.billing?.lastName || 'Contact',
          phoneNumber: formData.billing?.contactInformation?.phoneNumber || '5555555555',
          email: formData.billing?.contactInformation?.email
        }
      };

      const claimRequest: ClaimSubmissionRequest = {
        controlNumber: formData.controlNumber || `CLM${Date.now()}`.slice(0, 30),
        tradingPartnerServiceId: formData.tradingPartnerServiceId || '',
        usageIndicator: submitAsTest ? 'T' : 'P',
        submitter: submitter,
        receiver: formData.receiver || {
          organizationName: selectedPayerName || 'RECEIVER ORG'
        },
        subscriber: {
          memberId: formData.subscriber?.memberId || '',
          firstName: formData.subscriber?.firstName || '',
          lastName: formData.subscriber?.lastName || '',
          gender: formData.subscriber?.gender || 'M',
          dateOfBirth: formData.subscriber?.dateOfBirth || '',
          paymentResponsibilityLevelCode: formData.subscriber?.paymentResponsibilityLevelCode || '1',
          address: formData.subscriber?.address || {
            address1: '',
            city: '',
            state: '',
            postalCode: ''
          },
          ...(formData.subscriber?.ssn && { ssn: formData.subscriber.ssn }),
          ...(formData.subscriber?.contactInformation && { contactInformation: formData.subscriber.contactInformation }),
          ...(formData.subscriber?.middleName && { middleName: formData.subscriber.middleName }),
          ...(formData.subscriber?.groupNumber && { groupNumber: formData.subscriber.groupNumber })
        },
        ...(formData.dependent && { dependent: formData.dependent }),
        billing: formData.billing || {
          organizationName: '',
          npi: '',
          providerType: 'Organization',
          address: {
            address1: '',
            city: '',
            state: '',
            postalCode: ''
          }
        },
        ...(formData.rendering && { rendering: formData.rendering }),
        ...(formData.referring && { referring: formData.referring }),
        claimInformation: {
          claimFilingCode: formData.claimInformation?.claimFilingCode || '',
          patientControlNumber: formData.claimInformation?.patientControlNumber || '',
          placeOfServiceCode: formData.claimInformation?.placeOfServiceCode || '11',
          claimChargeAmount: formData.claimInformation?.claimChargeAmount ? formatCurrency(formData.claimInformation.claimChargeAmount) : '0.00',
          planParticipationCode: formData.claimInformation?.planParticipationCode || '',
          claimFrequencyCode: formData.claimInformation?.claimFrequencyCode || '1',
          signatureIndicator: formData.claimInformation?.signatureIndicator || 'Y',
          benefitsAssignmentCertificationIndicator: formData.claimInformation?.benefitsAssignmentCertificationIndicator || 'Y',
          releaseInformationCode: formData.claimInformation?.releaseInformationCode || 'Y',
          ...(formData.claimInformation?.patientAmountPaid && { patientAmountPaid: formatCurrency(formData.claimInformation.patientAmountPaid) }),
          ...(formData.claimInformation?.claimSupplementalInformation && { claimSupplementalInformation: formData.claimInformation.claimSupplementalInformation }),
          ...(formData.claimInformation?.serviceFacilityLocation && { serviceFacilityLocation: formData.claimInformation.serviceFacilityLocation }),
          healthCareCodeInformation: formData.claimInformation?.healthCareCodeInformation || [],
          serviceLines: formData.claimInformation?.serviceLines || []
        }
      };

      if (claimRequest.subscriber.dateOfBirth) {
        claimRequest.subscriber.dateOfBirth = formatDateForAPI(claimRequest.subscriber.dateOfBirth);
      }
      if (claimRequest.dependent?.dateOfBirth) {
        claimRequest.dependent.dateOfBirth = formatDateForAPI(claimRequest.dependent.dateOfBirth);
      }
      claimRequest.claimInformation.serviceLines = claimRequest.claimInformation.serviceLines.map(line => ({
        ...line,
        serviceDate: formatDateForAPI(line.serviceDate)
      }));

      setLastRequest(claimRequest);
      const result = await submitClaim(claimRequest, credentials, environment);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!lastRequest) {
      setError('No claim data available. Please validate or submit a claim first.');
      return;
    }

    try {
      const pdfBlob = await generateClaimPDF(lastRequest);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cms1500_claim_${lastRequest.controlNumber || 'generated'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Ensure at least one service line exists
  const serviceLines = formData.claimInformation?.serviceLines || [];
  const effectiveServiceLines = serviceLines.length === 0 ? [{
    serviceDate: '',
    serviceDateEnd: '',
    professionalService: {
      procedureIdentifier: 'HC',
      procedureCode: '',
      procedureModifiers: [],
      lineItemChargeAmount: '',
      measurementUnit: 'UN',
      serviceUnitCount: '',
      placeOfServiceCode: '10',
      compositeDiagnosisCodePointers: {
        diagnosisCodePointers: []
      }
    }
  }] : serviceLines;
  
  const diagnoses = formData.claimInformation?.healthCareCodeInformation || [];
  
  const removeServiceLine = (index: number) => {
    const updated = effectiveServiceLines.filter((_, i) => i !== index);
    updateField(['claimInformation', 'serviceLines'], updated);
  };

  const clearForm = () => {
    const initialData: Partial<ClaimSubmissionRequest> = {};
    initialData.claimInformation = {
      claimFilingCode: 'CI',
      outsideLab: false
    } as Partial<ClaimSubmissionRequest>['claimInformation'];
    initialData.billing = {
      taxIdType: 'EIN',
      providerType: 'Organization'
    } as Partial<ClaimSubmissionRequest>['billing'];
    
    setFormData(initialData);
    setPatientSignatureOnFile(true);
    setAuthorizedSignatureOnFile(true);
    setPhysicianSignatureOnFile(true);
    setSelectedProviderOption(CUSTOM_PROVIDER_OPTION);
    setResponse(null);
    setError(null);
  };

  const loadDefaultData = () => {
    // Load test data - you can customize this
    const testData: Partial<ClaimSubmissionRequest> = {
      controlNumber: 'TEST' + Date.now().toString().slice(-6),
      tradingPartnerServiceId: '87726',
      submitter: {
        organizationName: 'Reperio Health Medical Group',
        contactInformation: {
          name: 'Billing Department',
          phoneNumber: '5551234567',
          email: 'billing@reperio.health'
        }
      },
      receiver: {
        organizationName: 'UnitedHealthcare'
      },
      subscriber: {
        paymentResponsibilityLevelCode: 'P',
        memberId: '22294105300',
        firstName: 'Matthew',
        lastName: 'Wallington',
        gender: 'M',
        dateOfBirth: '19791118',
        address: {
          address1: '123 Main St',
          city: 'Portland',
          state: 'OR',
          postalCode: '97201'
        }
      },
      billing: {
        providerType: 'Organization',
        organizationName: 'Reperio Health Medical Group, PLLC',
        npi: '1982438362',
        taxIdType: 'EIN',
        employerId: '123456789',
        address: {
          address1: '456 Provider Ave',
          city: 'Portland',
          state: 'OR',
          postalCode: '97202'
        },
        contactInformation: {
          name: 'Billing',
          phoneNumber: '5551234567'
        }
      },
      claimInformation: {
        claimFilingCode: 'CI',
        patientControlNumber: 'PAT' + Date.now().toString().slice(-6),
        claimChargeAmount: '15000',
        placeOfServiceCode: '02',
        claimFrequencyCode: '1',
        signatureIndicator: 'Y',
        planParticipationCode: 'A',
        benefitsAssignmentCertificationIndicator: 'Y',
        releaseInformationCode: 'Y',
        healthCareCodeInformation: [
          { diagnosisTypeCode: 'ABK', diagnosisCode: 'Z00.00' }
        ],
        serviceLines: [
          {
            serviceDate: '20250121',
            professionalService: {
              procedureIdentifier: 'HC',
              procedureCode: '99213',
              lineItemChargeAmount: '15000',
              measurementUnit: 'UN',
              serviceUnitCount: '1',
              placeOfServiceCode: '02',
              compositeDiagnosisCodePointers: {
                diagnosisCodePointers: ['1']
              }
            }
          }
        ],
        outsideLab: false
      }
    };
    
    setFormData(testData);
  };

  return (
    <div className="w-full">
      {/* Environment Selector */}
      {onEnvironmentChange && (
        <div className="mb-4">
          <EnvironmentSelector
            environment={environment}
            onEnvironmentChange={onEnvironmentChange}
          />
          
          {/* Usage Indicator and Form Controls */}
          <div className="mt-2 p-4 bg-gray-50 border border-gray-300 rounded">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Submit as Test Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="submitAsTest"
                  checked={submitAsTest}
                  onChange={(e) => setSubmitAsTest(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="submitAsTest" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Submit as Test? 
                  <span className="ml-2 text-xs text-gray-500">
                    (usageIndicator: {submitAsTest ? 'T' : 'P'})
                  </span>
                </label>
                {!submitAsTest && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">
                    LIVE MODE
                  </span>
                )}
              </div>
              
              {/* Form Control Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={loadDefaultData}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Load Default Data
                </button>
                <button
                  type="button"
                  onClick={clearForm}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Clear Form
                </button>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-600">
              {submitAsTest ? (
                <p>✅ Test mode: Claim will be validated but NOT submitted to payer</p>
              ) : (
                <p className="text-red-700 font-semibold">⚠️ Live mode: Claim WILL be submitted to payer for processing</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CMS 1500 Form - Single Column Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#c41e3a] mb-1">HEALTH INSURANCE CLAIM FORM</h2>
            <p className="text-xs text-gray-600">APPROVED BY NATIONAL UNIFORM CLAIM COMMITTEE (NUCC) 02/12</p>
          </div>

          {/* Payer Selection */}
          <div className="pb-4 border-b-2 border-gray-300">
            <label className="text-sm font-bold text-gray-700 mb-2 block">Payer (Insurance Company)</label>
            {loadingPayers ? (
              <div className="p-2 text-gray-500">Loading payers...</div>
            ) : payersError ? (
              <div className="space-y-2">
                <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {payersError}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loadPayers(true)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Retry
                  </button>
                  {payersApiRequest && (
                    <button
                      type="button"
                      onClick={() => setShowPayerModal(true)}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      View API Request/Response
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <select
                value={formData.tradingPartnerServiceId || ''}
                onChange={(e) => handlePayerChange(e.target.value)}
                className="w-full p-2 border rounded font-mono text-sm"
              >
                <option value="">Name                                              | Payer ID</option>
                {allPayers.map((payer, index) => {
                  const payerId = payer.payerId || '';
                  const name = (payer.payerPlanName || 'Unknown').substring(0, 50);
                  const key = payerId || `payer-${index}`;
                  const formattedName = name.padEnd(50, ' ');
                  
                  return (
                    <option key={key} value={payerId}>
                      {formattedName} | {payerId}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Provider Selection (populates Box 32 & 33) */}
          <div className="pb-4 border-b-2 border-gray-300">
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              Provider (Billing & Service Facility)
            </label>
            <select
              value={selectedProviderOption}
              onChange={(e) => handleProviderPresetChange(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            >
              <option value={CUSTOM_PROVIDER_OPTION}>-- Enter Custom Provider --</option>
              {PROVIDER_OPTIONS.map((provider) => (
                <option key={provider.npi} value={provider.npi}>
                  {provider.name} (NPI: {provider.npi})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This will populate both Box 32 (Service Facility) and Box 33 (Billing Provider)
            </p>
          </div>

          {/* Box 1 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">1. Insurance Type</label>
            <div className="flex flex-wrap gap-4">
              {[
                { code: 'MB', label: 'MEDICARE' },
                { code: 'MC', label: 'MEDICAID' },
                { code: 'CH', label: 'TRICARE' },
                { code: 'VA', label: 'CHAMPVA' },
                { code: 'HM', label: 'GROUP HEALTH PLAN' },
                { code: 'BL', label: 'FECA BLK LUNG' },
                { code: 'CI', label: 'OTHER' }
              ].map(({ code, label }) => {
                const isChecked = formData.claimInformation?.claimFilingCode === code || (code === 'CI' && !formData.claimInformation?.claimFilingCode);
                return (
                  <label key={code} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateField(['claimInformation', 'claimFilingCode'], code);
                        } else {
                          updateField(['claimInformation', 'claimFilingCode'], '');
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Box 1a */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">1a. INSURED'S I.D. NUMBER</label>
            <input
              type="text"
              value={formData.subscriber?.memberId || ''}
              onChange={(e) => updateField(['subscriber', 'memberId'], e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Box 2 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">2. PATIENT'S NAME (Last Name, First Name, Middle Initial)</label>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                value={formData.dependent?.lastName ?? ''}
                onChange={(e) => updateField(['dependent', 'lastName'], e.target.value)}
                placeholder="Last Name"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={formData.dependent?.firstName ?? ''}
                onChange={(e) => updateField(['dependent', 'firstName'], e.target.value)}
                placeholder="First Name"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={formData.dependent?.middleName ?? ''}
                onChange={(e) => updateField(['dependent', 'middleName'], e.target.value)}
                placeholder="MI"
                maxLength={1}
                className="p-2 border rounded"
              />
            </div>
          </div>

          {/* Box 5 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">5. PATIENT'S ADDRESS</label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.dependent?.address?.address1 ?? ''}
                onChange={(e) => {
                  if (!formData.dependent?.address) {
                    updateField(['dependent', 'address'], {});
                  }
                  updateField(['dependent', 'address', 'address1'], e.target.value);
                }}
                placeholder="Street Address"
                className="w-full p-2 border rounded"
              />
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formData.dependent?.address?.city ?? ''}
                  onChange={(e) => {
                    if (!formData.dependent?.address) {
                      updateField(['dependent', 'address'], {});
                    }
                    updateField(['dependent', 'address', 'city'], e.target.value);
                  }}
                  placeholder="City"
                  className="p-2 border rounded"
                />
                <select
                  value={formData.dependent?.address?.state ?? ''}
                  onChange={(e) => {
                    if (!formData.dependent?.address) {
                      updateField(['dependent', 'address'], {});
                    }
                    updateField(['dependent', 'address', 'state'], e.target.value);
                  }}
                  className="p-2 border rounded"
                >
                  <option value="">State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.dependent?.address?.postalCode ?? ''}
                  onChange={(e) => {
                    if (!formData.dependent?.address) {
                      updateField(['dependent', 'address'], {});
                    }
                    updateField(['dependent', 'address', 'postalCode'], e.target.value);
                  }}
                  placeholder="ZIP Code"
                  className="p-2 border rounded"
                />
              </div>
              <input
                type="tel"
                value={formData.dependent?.contactInformation?.phoneNumber ? formatPhoneNumber(formData.dependent.contactInformation.phoneNumber) : ''}
                onChange={(e) => {
                  if (!formData.dependent?.contactInformation) {
                    updateField(['dependent', 'contactInformation'], {});
                  }
                  // Store unformatted digits only
                  const digits = e.target.value.replace(/\D/g, '');
                  updateField(['dependent', 'contactInformation', 'phoneNumber'], digits);
                }}
                placeholder="Telephone"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Box 3 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">3. PATIENT'S BIRTH DATE</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">MM</span>
                <input
                  type="text"
                  value={formData.subscriber?.dateOfBirth ? formatDateForInput(formData.subscriber.dateOfBirth).substring(5, 7) : ''}
                  onChange={(e) => {
                    const current = formData.subscriber?.dateOfBirth ? formatDateForInput(formData.subscriber.dateOfBirth) : '----';
                    const parts = current.split('-');
                    updateField(['subscriber', 'dateOfBirth'], `${parts[0]}-${e.target.value.padStart(2, '0')}-${parts[2] || '01'}`);
                  }}
                  maxLength={2}
                  className="w-16 p-2 border rounded text-center"
                />
                <span className="text-sm">DD</span>
                <input
                  type="text"
                  value={formData.subscriber?.dateOfBirth ? formatDateForInput(formData.subscriber.dateOfBirth).substring(8, 10) : ''}
                  onChange={(e) => {
                    const current = formData.subscriber?.dateOfBirth ? formatDateForInput(formData.subscriber.dateOfBirth) : '----';
                    const parts = current.split('-');
                    updateField(['subscriber', 'dateOfBirth'], `${parts[0]}-${parts[1] || '01'}-${e.target.value.padStart(2, '0')}`);
                  }}
                  maxLength={2}
                  className="w-16 p-2 border rounded text-center"
                />
                <span className="text-sm">YY</span>
                <input
                  type="text"
                  value={formData.subscriber?.dateOfBirth ? formatDateForInput(formData.subscriber.dateOfBirth).substring(2, 4) : ''}
                  onChange={(e) => {
                    const current = formData.subscriber?.dateOfBirth ? formatDateForInput(formData.subscriber.dateOfBirth) : '----';
                    const parts = current.split('-');
                    updateField(['subscriber', 'dateOfBirth'], `20${e.target.value.padStart(2, '0')}-${parts[1] || '01'}-${parts[2] || '01'}`);
                  }}
                  maxLength={2}
                  className="w-16 p-2 border rounded text-center"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-[#c41e3a]">SEX</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.subscriber?.gender === 'M'}
                    onChange={(e) => updateField(['subscriber', 'gender'], e.target.checked ? 'M' : 'F')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">M</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.subscriber?.gender === 'F'}
                    onChange={(e) => updateField(['subscriber', 'gender'], e.target.checked ? 'F' : 'M')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">F</span>
                </label>
              </div>
            </div>
          </div>

          {/* Box 6 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">6. PATIENT RELATIONSHIP TO INSURED</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dependent?.relationshipToSubscriberCode === '18'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateField(['dependent', 'relationshipToSubscriberCode'], '18');
                      // If Self is selected, copy Box 2 (Patient's Name) to Box 4 (Insured's Name) and Box 5 (Patient's Address) to Box 7 (Insured's Address)
                      const patientLastName = formData.dependent?.lastName || formData.subscriber?.lastName || '';
                      const patientFirstName = formData.dependent?.firstName || formData.subscriber?.firstName || '';
                      const patientMiddleName = formData.dependent?.middleName || formData.subscriber?.middleName || '';
                      const patientAddress1 = formData.dependent?.address?.address1 || formData.subscriber?.address?.address1 || '';
                      const patientCity = formData.dependent?.address?.city || formData.subscriber?.address?.city || '';
                      const patientState = formData.dependent?.address?.state || formData.subscriber?.address?.state || '';
                      const patientPostalCode = formData.dependent?.address?.postalCode || formData.subscriber?.address?.postalCode || '';
                      const patientPhone = formData.dependent?.contactInformation?.phoneNumber || formData.subscriber?.contactInformation?.phoneNumber || '';
                      
                      if (patientLastName || patientFirstName || patientMiddleName) {
                        updateField(['subscriber', 'lastName'], patientLastName);
                        updateField(['subscriber', 'firstName'], patientFirstName);
                        updateField(['subscriber', 'middleName'], patientMiddleName);
                      }
                      if (patientAddress1 || patientCity || patientState || patientPostalCode) {
                        if (!formData.subscriber?.address) {
                          updateField(['subscriber', 'address'], {});
                        }
                        updateField(['subscriber', 'address', 'address1'], patientAddress1);
                        updateField(['subscriber', 'address', 'city'], patientCity);
                        updateField(['subscriber', 'address', 'state'], patientState);
                        updateField(['subscriber', 'address', 'postalCode'], patientPostalCode);
                      }
                      if (patientPhone) {
                        if (!formData.subscriber?.contactInformation) {
                          updateField(['subscriber', 'contactInformation'], {});
                        }
                        updateField(['subscriber', 'contactInformation', 'phoneNumber'], patientPhone);
                      }
                    } else {
                      updateField(['dependent', 'relationshipToSubscriberCode'], '');
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">Self</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dependent?.relationshipToSubscriberCode === '01'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateField(['dependent', 'relationshipToSubscriberCode'], '01');
                    } else {
                      updateField(['dependent', 'relationshipToSubscriberCode'], '');
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">Spouse</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dependent?.relationshipToSubscriberCode === '19'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateField(['dependent', 'relationshipToSubscriberCode'], '19');
                    } else {
                      updateField(['dependent', 'relationshipToSubscriberCode'], '');
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">Child</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dependent?.relationshipToSubscriberCode !== undefined && 
                           !['18', '01', '19'].includes(formData.dependent?.relationshipToSubscriberCode || '')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateField(['dependent', 'relationshipToSubscriberCode'], 'OTHER');
                    } else {
                      updateField(['dependent', 'relationshipToSubscriberCode'], '');
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">Other</span>
              </label>
            </div>
          </div>

          {/* Box 4 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">4. INSURED'S NAME (Last Name, First Name, Middle Initial)</label>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                value={formData.subscriber?.lastName ?? ''}
                onChange={(e) => updateField(['subscriber', 'lastName'], e.target.value)}
                placeholder="Last Name"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={formData.subscriber?.firstName ?? ''}
                onChange={(e) => updateField(['subscriber', 'firstName'], e.target.value)}
                placeholder="First Name"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={formData.subscriber?.middleName ?? ''}
                onChange={(e) => updateField(['subscriber', 'middleName'], e.target.value)}
                placeholder="MI"
                maxLength={1}
                className="p-2 border rounded"
              />
            </div>
          </div>

          {/* Box 7 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">7. INSURED'S ADDRESS</label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.subscriber?.address?.address1 || ''}
                onChange={(e) => updateField(['subscriber', 'address', 'address1'], e.target.value)}
                placeholder="Street Address"
                className="w-full p-2 border rounded"
              />
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formData.subscriber?.address?.city || ''}
                  onChange={(e) => updateField(['subscriber', 'address', 'city'], e.target.value)}
                  placeholder="City"
                  className="p-2 border rounded"
                />
                <select
                  value={formData.subscriber?.address?.state || ''}
                  onChange={(e) => updateField(['subscriber', 'address', 'state'], e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="">State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.subscriber?.address?.postalCode || ''}
                  onChange={(e) => updateField(['subscriber', 'address', 'postalCode'], e.target.value)}
                  placeholder="ZIP Code"
                  className="p-2 border rounded"
                />
              </div>
              <input
                type="tel"
                value={formData.subscriber?.contactInformation?.phoneNumber ? formatPhoneNumber(formData.subscriber.contactInformation.phoneNumber) : ''}
                onChange={(e) => {
                  if (!formData.subscriber?.contactInformation) {
                    updateField(['subscriber', 'contactInformation'], {});
                  }
                  // Store unformatted digits only
                  const digits = e.target.value.replace(/\D/g, '');
                  updateField(['subscriber', 'contactInformation', 'phoneNumber'], digits);
                }}
                placeholder="Telephone"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Box 11 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">11. INSURED'S POLICY GROUP OR FECA NUMBER</label>
            <input
              type="text"
              value={formData.subscriber?.groupNumber || ''}
              onChange={(e) => updateField(['subscriber', 'groupNumber'], e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Box 11a */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">11a. INSURED'S DATE OF BIRTH</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">MM</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">DD</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">YY</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-[#c41e3a]">SEX</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">M</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">F</span>
                </label>
              </div>
            </div>
          </div>

          {/* Box 11b */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">11b. Other Claim ID</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>

          {/* Box 11c */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">11c. Insurance Plan Name</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>

          {/* Box 11d */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">11d. Is there another health benefit plan?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.claimInformation?.hasOtherHealthBenefitPlan === true}
                  onChange={(e) => updateField(['claimInformation', 'hasOtherHealthBenefitPlan'], e.target.checked ? true : undefined)}
                  className="w-4 h-4"
                />
                <span className="text-sm">YES</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.claimInformation?.hasOtherHealthBenefitPlan === false}
                  onChange={(e) => updateField(['claimInformation', 'hasOtherHealthBenefitPlan'], e.target.checked ? false : undefined)}
                  className="w-4 h-4"
                />
                <span className="text-sm">NO</span>
              </label>
            </div>
          </div>

          {/* Box 8 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">8. RESERVED FOR NUCC USE</label>
            <div className="text-sm text-gray-500 italic">Reserved field</div>
          </div>

          {/* Box 9 */}
          <div className={`pb-3 ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'opacity-50 bg-gray-50' : ''}`}>
            <label className={`text-sm font-bold mb-2 block ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'text-gray-400' : 'text-[#c41e3a]'}`}>
              9. OTHER INSURED'S NAME (Last Name, First Name, Middle Initial)
              {formData.claimInformation?.hasOtherHealthBenefitPlan === false && <span className="ml-2 text-xs text-gray-500">(Disabled - No other health benefit plan)</span>}
            </label>
            <div className="grid grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder="Last Name" 
                className={`p-2 border rounded ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                disabled={formData.claimInformation?.hasOtherHealthBenefitPlan === false} 
              />
              <input 
                type="text" 
                placeholder="First Name" 
                className={`p-2 border rounded ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                disabled={formData.claimInformation?.hasOtherHealthBenefitPlan === false} 
              />
              <input 
                type="text" 
                placeholder="MI" 
                maxLength={1} 
                className={`p-2 border rounded ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                disabled={formData.claimInformation?.hasOtherHealthBenefitPlan === false} 
              />
            </div>
          </div>

          {/* Box 9a */}
          <div className={`pb-3 ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'opacity-50 bg-gray-50' : ''}`}>
            <label className={`text-sm font-bold mb-2 block ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'text-gray-400' : 'text-[#c41e3a]'}`}>
              9a. OTHER INSURED'S POLICY OR GROUP NUMBER
              {formData.claimInformation?.hasOtherHealthBenefitPlan === false && <span className="ml-2 text-xs text-gray-500">(Disabled - No other health benefit plan)</span>}
            </label>
            <input 
              type="text" 
              className={`w-full p-2 border rounded ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
              disabled={formData.claimInformation?.hasOtherHealthBenefitPlan === false} 
            />
          </div>

          {/* Box 9b */}
          <div className={`pb-3 ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'opacity-50 bg-gray-50' : ''}`}>
            <label className={`text-sm font-bold mb-2 block ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'text-gray-400' : 'text-[#c41e3a]'}`}>
              9b. RESERVED FOR NUCC USE
            </label>
            <div className="text-sm text-gray-500 italic">Reserved field</div>
          </div>

          {/* Box 9c */}
          <div className={`pb-3 ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'opacity-50 bg-gray-50' : ''}`}>
            <label className={`text-sm font-bold mb-2 block ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'text-gray-400' : 'text-[#c41e3a]'}`}>
              9c. RESERVED FOR NUCC USE
            </label>
            <div className="text-sm text-gray-500 italic">Reserved field</div>
          </div>

          {/* Box 9d */}
          <div className={`pb-3 ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'opacity-50 bg-gray-50' : ''}`}>
            <label className={`text-sm font-bold mb-2 block ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'text-gray-400' : 'text-[#c41e3a]'}`}>
              9d. INSURANCE PLAN NAME OR PROGRAM NAME
              {formData.claimInformation?.hasOtherHealthBenefitPlan === false && <span className="ml-2 text-xs text-gray-500">(Disabled - No other health benefit plan)</span>}
            </label>
            <input 
              type="text" 
              className={`w-full p-2 border rounded ${formData.claimInformation?.hasOtherHealthBenefitPlan === false ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
              disabled={formData.claimInformation?.hasOtherHealthBenefitPlan === false} 
            />
          </div>

          {/* Box 10 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">10. IS PATIENT'S CONDITION RELATED TO:</label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm">a. Employment (Current or Previous)</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">YES</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">NO</span>
                </label>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm">b. Auto Accident?</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.claimInformation?.autoAccident === true}
                    onChange={(e) => updateField(['claimInformation', 'autoAccident'], e.target.checked ? true : undefined)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">YES</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.claimInformation?.autoAccident === false}
                    onChange={(e) => updateField(['claimInformation', 'autoAccident'], e.target.checked ? false : undefined)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">NO</span>
                </label>
                <span className="text-sm">PLACE</span>
                <select
                  value={formData.claimInformation?.autoAccidentState || ''}
                  onChange={(e) => updateField(['claimInformation', 'autoAccidentState'], e.target.value)}
                  className={`p-2 border rounded ${formData.claimInformation?.autoAccident !== true ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''}`}
                  disabled={formData.claimInformation?.autoAccident !== true}
                >
                  <option value="">State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">c. Other Accident?</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">YES</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">NO</span>
                </label>
              </div>
            </div>
          </div>

          {/* Box 10d */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">10d. CLAIM CODES (Designated by NUCC)</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>

          {/* Box 12 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">12. PATIENT'S OR AUTHORIZED PERSON'S SIGNATURE</label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={patientSignatureOnFile}
                onChange={(e) => setPatientSignatureOnFile(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Signature on File</span>
            </label>
          </div>

          {/* Box 13 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">13. INSURED'S OR AUTHORIZED PERSON'S SIGNATURE</label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={authorizedSignatureOnFile}
                onChange={(e) => setAuthorizedSignatureOnFile(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Signature on File</span>
            </label>
          </div>

          {/* Box 14 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">14. DATE OF CURRENT ILLNESS, INJURY, or PREGNANCY (LMP)</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">MM</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">DD</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">YY</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
              </div>
              <input type="text" placeholder="QUAL" className="w-24 p-2 border rounded" />
            </div>
          </div>

          {/* Box 15 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">15. OTHER DATE</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">MM</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">DD</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">YY</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
              </div>
              <input type="text" placeholder="QUAL" className="w-24 p-2 border rounded" />
            </div>
          </div>

          {/* Box 16 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">16. Dates patient unable to work in current occupation</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">FROM</span>
                <span className="text-sm">MM</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">DD</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">YY</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">TO</span>
                <span className="text-sm">MM</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">DD</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">YY</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
              </div>
            </div>
          </div>

          {/* Box 17 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">17. NAME OF REFERRING PROVIDER OR OTHER SOURCE</label>
            <input
              type="text"
              value={formData.referring?.lastName || ''}
              onChange={(e) => updateField(['referring', 'lastName'], e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Box 17a */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">17a. NPI</label>
            <input
              type="text"
              value={formData.referring?.npi || ''}
              onChange={(e) => updateField(['referring', 'npi'], e.target.value)}
              maxLength={10}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Box 17b */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">17b. NPI</label>
            <input type="text" maxLength={10} className="w-full p-2 border rounded" />
          </div>

          {/* Box 18 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">18. Hospitalization Dates Related to Current Services</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">FROM</span>
                <span className="text-sm">MM</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">DD</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">YY</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">TO</span>
                <span className="text-sm">MM</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">DD</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
                <span className="text-sm">YY</span>
                <input type="text" maxLength={2} className="w-16 p-2 border rounded text-center" />
              </div>
            </div>
          </div>

          {/* Box 19 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">19. ADDITIONAL CLAIM INFORMATION (Designated by NUCC)</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>

          {/* Box 20 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">20. OUTSIDE LAB?</label>
            <div className="flex items-center gap-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.claimInformation?.outsideLab === true}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // When YES is checked, ensure NO is unchecked
                        updateField(['claimInformation', 'outsideLab'], true);
                      } else {
                        updateField(['claimInformation', 'outsideLab'], undefined);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">YES</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.claimInformation?.outsideLab === false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // When NO is checked, ensure YES is unchecked and clear charges
                        updateField(['claimInformation', 'outsideLab'], false);
                        updateField(['claimInformation', 'outsideLabCharges'], undefined);
                      } else {
                        updateField(['claimInformation', 'outsideLab'], undefined);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">NO</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">$</span>
                <input
                  type="text"
                  value={formData.claimInformation?.outsideLabCharges ? formatCurrency(formData.claimInformation.outsideLabCharges) : ''}
                  onChange={(e) => {
                    const cents = parseCurrencyToCents(e.target.value);
                    updateField(['claimInformation', 'outsideLabCharges'], cents);
                  }}
                  placeholder="0.00"
                  className={`w-32 p-2 border rounded ${formData.claimInformation?.outsideLab !== true ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''}`}
                  disabled={formData.claimInformation?.outsideLab !== true}
                />
              </div>
            </div>
          </div>

          {/* Box 21 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">21. DIAGNOSIS OR NATURE OF ILLNESS OR INJURY Relate A-L to service line below (24E)</label>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                <div key={i}>
                  <label className="text-sm font-semibold">{String.fromCharCode(65 + i)}.</label>
                  <input
                    type="text"
                    value={diagnoses[i]?.diagnosisCode || ''}
                    onChange={(e) => updateDiagnosis(i, e.target.value)}
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Box 22 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">22. RESUBMISSION CODE</label>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Resubmission Code" className="p-2 border rounded" />
              <input type="text" placeholder="ORIGINAL REF. NO." className="p-2 border rounded" />
            </div>
          </div>

          {/* Box 23 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">23. PRIOR AUTHORIZATION NUMBER</label>
            <input
              type="text"
              value={formData.claimInformation?.claimSupplementalInformation?.priorAuthorizationNumber || ''}
              onChange={(e) => {
                if (!formData.claimInformation?.claimSupplementalInformation) {
                  updateField(['claimInformation', 'claimSupplementalInformation'], {});
                }
                updateField(['claimInformation', 'claimSupplementalInformation', 'priorAuthorizationNumber'], e.target.value);
              }}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Box 24 - Service Lines */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">
              24. Services
            </label>
            <div className="space-y-3 mt-3">
              {effectiveServiceLines.map((line, index) => (
                <div key={index} className="border border-gray-300 rounded p-3 bg-white relative">
                  {effectiveServiceLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeServiceLine(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl leading-none"
                      aria-label="Remove service line"
                    >
                      ×
                    </button>
                  )}
                  
                  {/* Row 1: Dates, Place, EMG, CPT/HCPCS */}
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    {/* a. FROM */}
                    <div className="col-span-6 sm:col-span-2" style={{ maxWidth: 'calc(100% - 20px)' }}>
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        a. FROM
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Date of Service (FROM)</div>
                            <div>The beginning date when the service was provided to the patient.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="date"
                        value={(() => {
                          const dateStr = line.serviceDate || '';
                          if (!dateStr) return '';
                          const digits = dateStr.replace(/\D/g, '');
                          if (digits.length === 8) {
                            // YYYYMMDD format - convert to YYYY-MM-DD for date picker
                            return `${digits.substring(0, 4)}-${digits.substring(4, 6)}-${digits.substring(6, 8)}`;
                          }
                          if (digits.length === 6) {
                            // MMDDYY format - convert to YYYY-MM-DD (assuming 20XX)
                            const year = `20${digits.substring(4, 6)}`;
                            const month = digits.substring(0, 2);
                            const day = digits.substring(2, 4);
                            return `${year}-${month}-${day}`;
                          }
                          return '';
                        })()}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          if (dateValue) {
                            // Convert YYYY-MM-DD to YYYYMMDD for API
                            const apiDate = dateValue.replace(/-/g, '');
                            const sl = [...effectiveServiceLines];
                            sl[index] = {
                              ...sl[index],
                              serviceDate: apiDate
                            };
                            updateField(['claimInformation', 'serviceLines'], sl);
                          } else {
                            const sl = [...effectiveServiceLines];
                            sl[index] = {
                              ...sl[index],
                              serviceDate: ''
                            };
                            updateField(['claimInformation', 'serviceLines'], sl);
                          }
                        }}
                        className="w-full px-1.5 py-1.5 border rounded text-sm"
                      />
                    </div>

                    {/* a. TO */}
                    <div className="col-span-6 sm:col-span-2" style={{ maxWidth: 'calc(100% - 20px)' }}>
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        TO
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Date of Service (TO)</div>
                            <div>The ending date when the service was provided. Leave blank if same as FROM.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="date"
                        value={(() => {
                          const dateStr = line.serviceDateEnd || '';
                          if (!dateStr) return '';
                          const digits = dateStr.replace(/\D/g, '');
                          if (digits.length === 8) {
                            // YYYYMMDD format - convert to YYYY-MM-DD for date picker
                            return `${digits.substring(0, 4)}-${digits.substring(4, 6)}-${digits.substring(6, 8)}`;
                          }
                          if (digits.length === 6) {
                            // MMDDYY format - convert to YYYY-MM-DD (assuming 20XX)
                            const year = `20${digits.substring(4, 6)}`;
                            const month = digits.substring(0, 2);
                            const day = digits.substring(2, 4);
                            return `${year}-${month}-${day}`;
                          }
                          return '';
                        })()}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          if (dateValue) {
                            // Convert YYYY-MM-DD to YYYYMMDD for API
                            const apiDate = dateValue.replace(/-/g, '');
                            const sl = [...effectiveServiceLines];
                            sl[index] = {
                              ...sl[index],
                              serviceDateEnd: apiDate
                            };
                            updateField(['claimInformation', 'serviceLines'], sl);
                          } else {
                            const sl = [...effectiveServiceLines];
                            sl[index] = {
                              ...sl[index],
                              serviceDateEnd: ''
                            };
                            updateField(['claimInformation', 'serviceLines'], sl);
                          }
                        }}
                        className="w-full px-1.5 py-1.5 border rounded text-sm"
                      />
                    </div>

                    {/* b. Place of Service */}
                    <div className="col-span-3 sm:col-span-1">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        b. POS
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Place of Service</div>
                            <div>2-digit code indicating where the service was performed (e.g., 11=Office, 21=Inpatient Hospital).</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={line.professionalService?.placeOfServiceCode || formData.claimInformation?.placeOfServiceCode || '10'}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                          updateServiceLine(index, 'professionalService.placeOfServiceCode', value);
                        }}
                        placeholder="##"
                        maxLength={2}
                        className="w-full p-1.5 border rounded text-sm text-center"
                      />
                    </div>

                    {/* c. EMG */}
                    <div className="col-span-3 sm:col-span-1">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        c. EMG
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Emergency Indicator</div>
                            <div>Check if service was provided in an emergency situation.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <div className="flex items-center justify-center h-9">
                        <input
                          type="checkbox"
                          checked={(() => {
                            const desc = line.professionalService?.description || '';
                            return desc.includes('EMG:Y') || desc.includes('EMG:1');
                          })()}
                          onChange={(e) => {
                            const sl = [...effectiveServiceLines];
                            const currentDesc = sl[index].professionalService?.description || '';
                            let newDesc = currentDesc.replace(/EMG:[Y1]/g, '').trim();
                            if (e.target.checked) {
                              newDesc = newDesc ? `${newDesc} EMG:Y` : 'EMG:Y';
                            }
                            sl[index] = {
                              ...sl[index],
                              professionalService: {
                                ...sl[index].professionalService,
                                description: newDesc || undefined
                              }
                            };
                            updateField(['claimInformation', 'serviceLines'], sl);
                          }}
                          className="w-4 h-4 text-[#9e32e2] border-gray-300 rounded focus:ring-[#9e32e2]"
                        />
                      </div>
                    </div>

                    {/* d. CPT/HCPCS */}
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        d. CPT/HCPCS
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Procedure Code</div>
                            <div>The CPT or HCPCS code identifying the medical procedure or service provided.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={line.professionalService?.procedureCode || ''}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().slice(0, 5);
                          updateServiceLine(index, 'professionalService.procedureCode', value);
                        }}
                        placeholder="Code"
                        maxLength={5}
                        className="w-full p-1.5 border rounded text-sm"
                      />
                    </div>

                    {/* d. Modifier */}
                    <div className="col-span-6 sm:col-span-1">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        Modifier
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Procedure Modifier</div>
                            <div>2-digit code that provides additional information about the procedure performed.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <select
                        value={line.professionalService?.procedureModifiers?.[0] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const modifiers = value ? [value] : [];
                          const sl = [...effectiveServiceLines];
                          sl[index] = {
                            ...sl[index],
                            professionalService: {
                              ...sl[index].professionalService,
                              procedureModifiers: modifiers.length > 0 ? modifiers : undefined
                            }
                          };
                          updateField(['claimInformation', 'serviceLines'], sl);
                        }}
                        className="w-full p-1.5 border rounded text-sm"
                      >
                        <option value="">-</option>
                        <option value="95">95</option>
                        <option value="RR">RR</option>
                      </select>
                    </div>

                    {/* e. Diagnosis Pointer */}
                    <div className="col-span-6 sm:col-span-2">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        e. Dx
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Diagnosis Pointer</div>
                            <div>Letter (A-L) linking this service to the corresponding diagnosis code in Box 21.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <select
                        value={line.professionalService?.compositeDiagnosisCodePointers?.diagnosisCodePointers?.[0] || ''}
                        onChange={(e) => {
                          const sl = [...effectiveServiceLines];
                          sl[index] = {
                            ...sl[index],
                            professionalService: {
                              ...sl[index].professionalService,
                              compositeDiagnosisCodePointers: {
                                diagnosisCodePointers: [e.target.value]
                              }
                            }
                          };
                          updateField(['claimInformation', 'serviceLines'], sl);
                        }}
                        className="w-full p-1.5 border rounded text-sm"
                      >
                        <option value="">-</option>
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((letter, idx) => {
                          const diagnosisCode = diagnoses[idx]?.diagnosisCode || '';
                          const displayText = diagnosisCode ? `${letter} (${diagnosisCode})` : letter;
                          return (
                            <option key={letter} value={letter}>{displayText}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Charges, Units, EPSDT, ID Qual, Provider ID */}
                  <div className="grid grid-cols-12 gap-2">
                    {/* f. Charges */}
                    <div className="col-span-6 sm:col-span-3">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        f. Charges
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Line Item Charge Amount</div>
                            <div>The total charge amount for this specific service line before any adjustments.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">$</span>
                        <input
                          type="text"
                          value={line.professionalService?.lineItemChargeAmount ? formatCurrency(line.professionalService.lineItemChargeAmount) : ''}
                          onChange={(e) => {
                            const cents = parseCurrencyToCents(e.target.value);
                            updateServiceLine(index, 'professionalService.lineItemChargeAmount', cents);
                          }}
                          placeholder="0.00"
                          className="flex-1 p-1.5 border rounded text-sm"
                        />
                      </div>
                    </div>

                    {/* g. Days or Units */}
                    <div className="col-span-6 sm:col-span-2">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        g. Units
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Days or Units</div>
                            <div>The number of times the service was performed or the number of days/units billed.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={line.professionalService?.serviceUnitCount || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                          updateServiceLine(index, 'professionalService.serviceUnitCount', value);
                        }}
                        placeholder="##"
                        maxLength={2}
                        className="w-full p-1.5 border rounded text-sm text-center"
                      />
                    </div>

                    {/* h. EPSDT */}
                    <div className="col-span-4 sm:col-span-1">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        h. EP
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">EPSDT Family Plan</div>
                            <div>Early and Periodic Screening, Diagnostic and Treatment indicator for Medicaid patients.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        maxLength={1}
                        placeholder="?"
                        className="w-full p-1.5 border rounded text-sm text-center"
                      />
                    </div>

                    {/* i. ID. Qual */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        i. Qual
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">ID Qualifier</div>
                            <div>Identifies the type of provider identifier being used (typically NPI - National Provider Identifier).</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <select
                        value="NPI"
                        className="w-full p-1.5 border rounded text-sm bg-gray-50"
                        disabled
                      >
                        <option value="NPI">NPI</option>
                      </select>
                    </div>

                    {/* j. Rendering Provider ID */}
                    <div className="col-span-12 sm:col-span-4">
                      <label className="text-xs font-semibold text-[#c41e3a] block mb-1 flex items-center gap-1">
                        j. Rendering Provider ID
                        <div className="relative group inline-block">
                          <span className="text-gray-400 cursor-help text-xs">ⓘ</span>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">Rendering Provider NPI</div>
                            <div>The National Provider Identifier for the healthcare professional who performed the service.</div>
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={formData.rendering?.npi || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          updateField(['rendering', 'npi'], value);
                        }}
                        placeholder="NPI (10 digits)"
                        maxLength={10}
                        className="w-full p-1.5 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {effectiveServiceLines.length < 6 && (
                <button
                  type="button"
                  onClick={addServiceLine}
                  className="w-full px-3 py-2 bg-[#9e32e2] text-white rounded hover:bg-[#8a2bc9] text-sm font-semibold"
                >
                  + Add Service Line
                </button>
              )}
            </div>
          </div>

          {/* Box 25 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">25. FEDERAL TAX I.D. NUMBER</label>
            <div className="space-y-2">
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.billing?.taxIdType === 'SSN'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateField(['billing', 'taxIdType'], 'SSN');
                        // Clear the value if switching from EIN
                        if (formData.billing?.taxIdType === 'EIN') {
                          updateField(['billing', 'employerId'], '');
                        }
                      } else {
                        updateField(['billing', 'taxIdType'], undefined);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">SSN</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.billing?.taxIdType === 'EIN' || (!formData.billing?.taxIdType)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateField(['billing', 'taxIdType'], 'EIN');
                        // Clear the value if switching from SSN
                        if (formData.billing?.taxIdType === 'SSN') {
                          updateField(['billing', 'employerId'], '');
                        }
                      } else {
                        updateField(['billing', 'taxIdType'], undefined);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">EIN</span>
                </label>
              </div>
              <div>
                {(formData.billing?.taxIdType === 'EIN' || !formData.billing?.taxIdType) ? (
                  <select
                    value={formData.billing?.employerId || ''}
                    onChange={(e) => {
                      updateField(['billing', 'employerId'], e.target.value);
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select EIN</option>
                    <option value="994567305">99-4567305 (RHMG, PLLC)</option>
                    <option value="394343101">39-4343101 (RHMG, LLC - NJ)</option>
                    <option value="394724400">39-4724400 (Alexander Marsh, M.D., PC)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={
                      formData.billing?.employerId
                        ? formData.billing?.taxIdType === 'SSN'
                          ? formatSSN(formData.billing.employerId)
                          : formData.billing.employerId
                        : ''
                    }
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      // Limit to 9 digits
                      const limited = digits.slice(0, 9);
                      updateField(['billing', 'employerId'], limited);
                    }}
                    className={`w-full p-2 border rounded ${
                      formData.billing?.taxIdType === 'SSN' && formData.billing?.employerId && !validateSSN(formData.billing.employerId)
                        ? 'border-red-500'
                        : ''
                    }`}
                    placeholder={formData.billing?.taxIdType === 'SSN' ? 'XXX-XX-XXXX' : 'Enter Tax ID'}
                  />
                )}
                {formData.billing?.taxIdType === 'SSN' && formData.billing?.employerId && !validateSSN(formData.billing.employerId) && (
                  <p className="text-xs text-red-500 mt-1">SSN must be 9 digits</p>
                )}
              </div>
            </div>
          </div>

          {/* Box 26 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">26. PATIENT'S ACCOUNT NO.</label>
            <input
              type="text"
              value={formData.claimInformation?.patientControlNumber || ''}
              onChange={(e) => updateField(['claimInformation', 'patientControlNumber'], e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Box 27 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">27. ACCEPT ASSIGNMENT?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.claimInformation?.planParticipationCode === 'A'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // When YES is checked, ensure NO is unchecked
                      updateField(['claimInformation', 'planParticipationCode'], 'A');
                    } else {
                      updateField(['claimInformation', 'planParticipationCode'], '');
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">YES</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.claimInformation?.planParticipationCode === 'C'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // When NO is checked, ensure YES is unchecked
                      updateField(['claimInformation', 'planParticipationCode'], 'C');
                    } else {
                      updateField(['claimInformation', 'planParticipationCode'], '');
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">NO</span>
              </label>
            </div>
          </div>

          {/* Box 28 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">28. TOTAL CHARGE</label>
            <div className="flex items-center gap-2">
              <span className="text-sm">$</span>
              <input
                type="text"
                value={formData.claimInformation?.claimChargeAmount ? formatCurrency(formData.claimInformation.claimChargeAmount) : '0.00'}
                readOnly
                placeholder="0.00"
                className="w-full p-2 border rounded bg-gray-50 cursor-not-allowed"
                title="Auto-calculated from service line charges"
              />
            </div>
          </div>

          {/* Box 29 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">29. AMOUNT PAID</label>
            <div className="flex items-center gap-2">
              <span className="text-sm">$</span>
              <input
                type="text"
                value={formData.claimInformation?.patientAmountPaid ? formatCurrency(formData.claimInformation.patientAmountPaid) : ''}
                onChange={(e) => {
                  const cents = parseCurrencyToCents(e.target.value);
                  updateField(['claimInformation', 'patientAmountPaid'], cents);
                }}
                placeholder="0.00"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Box 30 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">30. Rsvd for NUCC Use</label>
            <div className="text-sm text-gray-500 italic">Reserved field</div>
          </div>

          {/* Box 31 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">31. SIGNATURE OF PHYSICIAN OR SUPPLIER</label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={physicianSignatureOnFile}
                onChange={(e) => setPhysicianSignatureOnFile(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Signature on File</span>
            </label>
          </div>

          {/* Box 32 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">32. SERVICE FACILITY LOCATION INFORMATION</label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.claimInformation?.serviceFacilityLocation?.organizationName || formData.billing?.organizationName || ''}
                onChange={(e) => {
                  if (!formData.claimInformation?.serviceFacilityLocation) {
                    updateField(['claimInformation', 'serviceFacilityLocation'], {});
                  }
                  updateField(['claimInformation', 'serviceFacilityLocation', 'organizationName'], e.target.value);
                }}
                placeholder="Company Name"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={formData.billing?.address?.address1 || ''}
                onChange={(e) => updateField(['billing', 'address', 'address1'], e.target.value)}
                placeholder="Street Address"
                className="w-full p-2 border rounded"
              />
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formData.billing?.address?.city || ''}
                  onChange={(e) => updateField(['billing', 'address', 'city'], e.target.value)}
                  placeholder="City"
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.billing?.address?.state || ''}
                  onChange={(e) => updateField(['billing', 'address', 'state'], e.target.value.toUpperCase())}
                  placeholder="State"
                  maxLength={2}
                  className="p-2 border rounded uppercase"
                />
                <input
                  type="text"
                  value={formData.billing?.address?.postalCode || ''}
                  onChange={(e) => updateField(['billing', 'address', 'postalCode'], e.target.value)}
                  placeholder="ZIP Code"
                  className="p-2 border rounded"
                />
              </div>
              <input
                type="text"
                maxLength={10}
                value={formData.claimInformation?.serviceFacilityLocation?.npi || ''}
                onChange={(e) => {
                  if (!formData.claimInformation?.serviceFacilityLocation) {
                    updateField(['claimInformation', 'serviceFacilityLocation'], {});
                  }
                  updateField(['claimInformation', 'serviceFacilityLocation', 'npi'], e.target.value);
                }}
                placeholder="NPI"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Box 33 */}
          <div className="pb-3">
            <label className="text-sm font-bold text-[#c41e3a] mb-2 block">33. BILLING PROVIDER INFO & PH #</label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.billing?.organizationName || ''}
                onChange={(e) => updateField(['billing', 'organizationName'], e.target.value)}
                placeholder="Name"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={formData.billing?.address?.address1 || ''}
                onChange={(e) => updateField(['billing', 'address', 'address1'], e.target.value)}
                placeholder="Address"
                className="w-full p-2 border rounded"
              />
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formData.billing?.address?.city || ''}
                  onChange={(e) => updateField(['billing', 'address', 'city'], e.target.value)}
                  placeholder="City"
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  value={formData.billing?.address?.state || ''}
                  onChange={(e) => updateField(['billing', 'address', 'state'], e.target.value.toUpperCase())}
                  placeholder="ST"
                  maxLength={2}
                  className="p-2 border rounded uppercase"
                />
                <input
                  type="text"
                  value={formData.billing?.address?.postalCode || ''}
                  onChange={(e) => updateField(['billing', 'address', 'postalCode'], e.target.value)}
                  placeholder="ZIP"
                  className="p-2 border rounded"
                />
              </div>
              <input
                type="tel"
                value={formData.billing?.contactInformation?.phoneNumber ? formatPhoneNumber(formData.billing.contactInformation.phoneNumber) : ''}
                onChange={(e) => {
                  if (!formData.billing?.contactInformation) {
                    updateField(['billing', 'contactInformation'], {});
                  }
                  // Store unformatted digits only
                  const digits = e.target.value.replace(/\D/g, '');
                  updateField(['billing', 'contactInformation', 'phoneNumber'], digits);
                }}
                placeholder="Phone Number"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={formData.billing?.npi || ''}
                onChange={(e) => updateField(['billing', 'npi'], e.target.value)}
                maxLength={10}
                placeholder="NPI"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600 mt-6">
            NUCC Instruction Manual available at: www.nucc.org &nbsp;&nbsp;&nbsp; PLEASE PRINT OR TYPE &nbsp;&nbsp;&nbsp; APPROVED OMB-0938-1197 FORM 1500 (02-12)
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={handleValidate}
              disabled={loading || !credentials}
              className={`flex-1 px-6 py-3 rounded-md font-semibold ${
                loading && actionType === 'validate'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading && actionType === 'validate' ? 'Validating...' : 'Validate Claim'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !credentials}
              className={`flex-1 px-6 py-3 rounded-md font-semibold ${
                loading && actionType === 'submit'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#9e32e2] hover:bg-[#8a2bc9]'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading && actionType === 'submit' ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(loading || response || error) && (
        <div className="mt-6 w-full">
          {loading ? (
            <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-8 flex items-center justify-center">
              <div className="text-center text-gray-500 space-y-4">
                <div className="flex justify-center">
                  <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700">
                    {actionType === 'validate' ? 'Validating claim...' : 'Submitting claim...'}
                  </p>
                  <p className="text-sm text-gray-500">Results will appear here</p>
                </div>
              </div>
            </div>
          ) : (response || error) ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ClaimResponseDisplay
                request={lastRequest}
                response={response}
                error={error}
                onGeneratePDF={handleGeneratePDF}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Payer API Request/Response Modal */}
      {showPayerModal && payersApiRequest && (
        <ApiResponseModal
          isOpen={showPayerModal}
          onClose={() => setShowPayerModal(false)}
          title="PayerList v1 API - Export Request/Response"
          request={payersApiRequest}
          response={payersApiResponse}
        />
      )}
    </div>
  );
}
