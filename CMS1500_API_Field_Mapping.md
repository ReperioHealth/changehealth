# CMS 1500 Form to Professional Claims V3 API Field Mapping

## ✅ MAPPED FIELDS (Form → API)

### Header/Control Information
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| N/A | Control Number | `formData.controlNumber` | `controlNumber` | **Required** | Transaction Set Control Number (ST02) |
| N/A | Trading Partner Service ID | `formData.tradingPartnerServiceId` | `tradingPartnerServiceId` | Optional | Payer ID (NM109) |

### Box 1 - Insurance Type
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 1 | Insurance Type | `formData.claimInformation.claimFilingCode` | `claimInformation.claimFilingCode` | **Required** | SBR09 - Values: MB, MC, CH, VA, HM, BL, **CI**, etc. |
| 1a | Insured's ID Number | `formData.subscriber.memberId` | `subscriber.memberId` | Optional | NM109 |

### Box 2-7 - Patient & Insured Information
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 2 | Patient's Last Name | `formData.dependent.lastName` | `dependent.lastName` | **Required*** | NM103 (*if dependent exists) |
| 2 | Patient's First Name | `formData.dependent.firstName` | `dependent.firstName` | **Required*** | NM104 |
| 2 | Patient's Middle Initial | `formData.dependent.middleName` | `dependent.middleName` | Optional | NM105 |
| 3 | Patient's Birth Date | `formData.dependent.dateOfBirth` | `dependent.dateOfBirth` | **Required*** | DMG02 (CCYYMMDD) |
| 3 | Patient's Gender | `formData.dependent.gender` | `dependent.gender` | **Required*** | DMG03 (M/F/U) |
| 4 | Insured's Last Name | `formData.subscriber.lastName` | `subscriber.lastName` | Optional | NM103 |
| 4 | Insured's First Name | `formData.subscriber.firstName` | Optional | NM104 |
| 4 | Insured's Middle Initial | `formData.subscriber.middleName` | `subscriber.middleName` | Optional | NM105 |
| 5 | Patient's Address | `formData.dependent.address.address1` | `dependent.address.address1` | Optional | N301 |
| 5 | Patient's City | `formData.dependent.address.city` | `dependent.address.city` | Optional | N401 |
| 5 | Patient's State | `formData.dependent.address.state` | `dependent.address.state` | Optional | N402 |
| 5 | Patient's ZIP Code | `formData.dependent.address.postalCode` | `dependent.address.postalCode` | Optional | N403 |
| 5 | Patient's Telephone | `formData.dependent.contactInformation.phoneNumber` | `dependent.contactInformation.phoneNumber` | Optional | PER04 |
| 6 | Patient Relationship to Insured | `formData.dependent.relationshipToSubscriberCode` | `dependent.relationshipToSubscriberCode` | **Required*** | PAT01 (18=Self, 01=Spouse, 19=Child) |
| 7 | Insured's Address | `formData.subscriber.address.address1` | `subscriber.address.address1` | Optional | N301 |
| 7 | Insured's City | `formData.subscriber.address.city` | `subscriber.address.city` | Optional | N401 |
| 7 | Insured's State | `formData.subscriber.address.state` | `subscriber.address.state` | Optional | N402 |
| 7 | Insured's ZIP Code | `formData.subscriber.address.postalCode` | `subscriber.address.postalCode` | Optional | N403 |
| 7 | Insured's Telephone | `formData.subscriber.contactInformation.phoneNumber` | `subscriber.contactInformation.phoneNumber` | Optional | PER04 |

### Box 8 - Patient Status (DEPRECATED/NOT IN FORM)
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 8 | Reserved for NUCC Use | ❌ NOT IN FORM | N/A | N/A | Field no longer used |

### Box 9-9d - Other Insured's Information
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 9 | Other Insured's Name | ❌ NOT IMPLEMENTED | `claimInformation.otherSubscriberInformation[].otherSubscriberName` | Optional | Loop 2330A |
| 9a | Other Insured's Policy/Group Number | ❌ NOT IMPLEMENTED | `claimInformation.otherSubscriberInformation[].insuranceGroupOrPolicyNumber` | Optional | SBR03 |
| 9b | Other Insured's DOB/Gender | ❌ NOT IMPLEMENTED | Multiple fields | Optional | Loop 2330A |
| 9c | Employer Name/School Name | ❌ NOT IMPLEMENTED | `claimInformation.otherSubscriberInformation[]` | Optional | |
| 9d | Insurance Plan Name | ❌ NOT IMPLEMENTED | `claimInformation.otherSubscriberInformation[].otherInsuredGroupName` | Optional | SBR04 |

### Box 10 - Is Patient's Condition Related To
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 10a | Employment | `formData.claimInformation.relatedCausesCode` (contains 'EM') | `claimInformation.relatedCausesCode[]` | Optional | CLM11-01/02 |
| 10b | Auto Accident | `formData.claimInformation.autoAccident` | `claimInformation.relatedCausesCode[]` (contains 'AA') | Optional | CLM11-01/02 |
| 10b | Auto Accident State | `formData.claimInformation.autoAccidentState` | `claimInformation.autoAccidentStateCode` | Optional | CLM11-04 |
| 10c | Other Accident | `formData.claimInformation.relatedCausesCode` (contains 'OA') | `claimInformation.relatedCausesCode[]` | Optional | CLM11-01/02 |
| 10d | Claim Codes Designated by NUCC | ❌ NOT IN FORM | N/A | N/A | |

### Box 11-11d - Insured's Policy Group Information
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 11 | Insured's Policy Group Number | `formData.subscriber.policyNumber` | `subscriber.policyNumber` | Optional | SBR03 |
| 11a | Insured's Date of Birth/Gender | `formData.subscriber.dateOfBirth` & `gender` | `subscriber.dateOfBirth` & `subscriber.gender` | Optional | DMG02 & DMG03 |
| 11b | Other Claim ID | ❌ NOT IMPLEMENTED | `claimInformation.claimSupplementalInformation.claimNumber` | Optional | REF02 (REF01=D9) |
| 11c | Insurance Plan Name | `formData.subscriber.subscriberGroupName` | `subscriber.subscriberGroupName` | Optional | SBR04 |
| 11d | Is there another health benefit plan? | `formData.claimInformation.hasOtherHealthBenefitPlan` | ❌ NOT DIRECT MATCH | Custom | Used to enable/disable Box 9 |

### Box 12-13 - Patient/Authorized Signatures
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 12 | Signature on File? | `patientSignatureOnFile` (local state, boolean) | `claimInformation.signatureIndicator` | **Required** | CLM06 (Y/N) - Checkbox pre-checked |
| 13 | Signature on File? | `authorizedSignatureOnFile` (local state, boolean) | `claimInformation.benefitsAssignmentCertificationIndicator` | **Required** | CLM08 (Y/N/W) - Checkbox pre-checked |

### Box 14-18 - Date Information
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 14 | Date of Current Illness/Injury/Pregnancy | ❌ NOT IMPLEMENTED | `claimInformation.claimDateInformation.symptomDate` | Optional | DTP03 (DTP01=431) |
| 14 | Qualifier | ❌ NOT IMPLEMENTED | N/A | N/A | DTP01 value (431, 484, etc.) |
| 15 | Other Date | ❌ NOT IMPLEMENTED | `claimInformation.claimDateInformation.*` | Optional | Multiple DTP options |
| 15 | Qualifier | ❌ NOT IMPLEMENTED | N/A | N/A | DTP01 value |
| 16 | Dates Unable to Work (From/To) | ❌ NOT IMPLEMENTED | `claimInformation.claimDateInformation.disabilityBeginDate/disabilityEndDate` | Optional | DTP03 |
| 17 | Referring Provider Name | ❌ NOT IMPLEMENTED | `referring.firstName/lastName/organizationName` | Optional | Loop 2420F NM103/NM104 |
| 17a | Other ID | ❌ NOT IMPLEMENTED | `referring.*` | Optional | REF02 |
| 17b | NPI | ❌ NOT IMPLEMENTED | `referring.npi` | Optional | NM109 |
| 18 | Hospitalization Dates (From/To) | ❌ NOT IMPLEMENTED | `claimInformation.claimDateInformation.admissionDate/dischargeDate` | Optional | DTP03 |

### Box 19 - Additional Claim Information
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 19 | Additional Claim Information | ❌ NOT IMPLEMENTED | `claimInformation.claimNote.additionalInformation` | Optional | NTE02 (NTE01=ADD) |

### Box 20 - Outside Lab
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 20 | Outside Lab (YES/NO) | `formData.claimInformation.outsideLab` | ❌ NOT DIRECT MATCH | Custom | May map to file info or note |
| 20 | Charges | `formData.claimInformation.outsideLabCharges` | ❌ NOT DIRECT MATCH | Custom | Could use AMT segment |

### Box 21 - Diagnosis Codes
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 21 | Diagnosis Codes (A-L) | `formData.claimInformation.healthCareCodeInformation[]` | `claimInformation.healthCareCodeInformation[]` | **Required** (min 1, max 12) | HI segment |
| 21 | Diagnosis Type Code | N/A (hardcoded in API call) | `.diagnosisTypeCode` | **Required** | 'ABK' (ICD-10 Principal) or 'ABF' (ICD-10 Other) |
| 21 | Diagnosis Code | Input field | `.diagnosisCode` | **Required** | HI01-02 through HI12-02 |

### Box 22 - Resubmission Information
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 22 | Resubmission Code | ❌ NOT IMPLEMENTED | `claimInformation.claimFrequencyCode` | **Required** | CLM05-03 (default: '1' Original) |
| 22 | Original Ref. No. | ❌ NOT IMPLEMENTED | `claimInformation.claimSupplementalInformation.claimNumber` | Optional | REF02 |

### Box 23 - Prior Authorization
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 23 | Prior Authorization Number | ❌ NOT IMPLEMENTED | `claimInformation.claimSupplementalInformation.priorAuthorizationNumber` | Optional | REF02 (REF01=G1) |

### Box 24 - Service Lines (A-J)
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 24A | From/To Dates | `serviceLines[].serviceDate` & `serviceDateEnd` | `claimInformation.serviceLines[].serviceDate/serviceDateEnd` | **Required** | DTP03 (CCYYMMDD) |
| 24B | Place of Service | `serviceLines[].professionalService.placeOfServiceCode` | `.professionalService.placeOfServiceCode` | Optional | SV105 (default: '10') |
| 24C | EMG (Emergency) | `serviceLines[].professionalService.description` | `.professionalService.emergencyIndicator` | Optional | SV109 ('Y') |
| 24D | CPT/HCPCS | `serviceLines[].professionalService.procedureCode` | `.professionalService.procedureCode` | **Required** | SV101-02 |
| 24D | Modifier | `serviceLines[].professionalService.procedureModifiers[]` | `.professionalService.procedureModifiers[]` | Optional (max 4) | SV101-03 to SV101-06 |
| 24E | Diagnosis Pointer | `serviceLines[].professionalService.compositeDiagnosisCodePointers.diagnosisCodePointers[]` | `.compositeDiagnosisCodePointers.diagnosisCodePointers[]` | **Required** (min 1) | SV107-01 to SV107-04 |
| 24F | Charges | `serviceLines[].professionalService.lineItemChargeAmount` | `.professionalService.lineItemChargeAmount` | **Required** | SV102 (in cents as string) |
| 24G | Days/Units | `serviceLines[].professionalService.serviceUnitCount` | `.professionalService.serviceUnitCount` | **Required** | SV104 |
| 24H | EPSDT | `serviceLines[].professionalService.*` | `.professionalService.epsdtIndicator` | Optional | SV111 ('Y') |
| 24I | ID Qual | Hardcoded 'NPI' | `.professionalService.procedureIdentifier` | **Required** | SV101-01 ('HC' for HCPCS) |
| 24J | Rendering Provider ID | `serviceLines[].renderingProvider.npi` | `.renderingProvider.npi` | Optional | Loop 2420A NM109 |

### Box 25 - Federal Tax ID
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 25 | Federal Tax ID Number | `formData.billing.employerId` or `ssn` | `billing.employerId` or `billing.ssn` | Optional | REF02 (REF01=EI or SY) |
| 25 | SSN/EIN Checkbox | `formData.billing.taxIdType` | ❌ NOT DIRECT MATCH | Custom | Determines which field to use |

### Box 26 - Patient Account Number
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 26 | Patient Account Number | `formData.claimInformation.patientControlNumber` | `claimInformation.patientControlNumber` | **Required** | CLM01 |

### Box 27 - Accept Assignment
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 27 | Accept Assignment (YES/NO) | `formData.claimInformation.planParticipationCode` | `claimInformation.planParticipationCode` | **Required** | CLM07 ('A'=Yes, 'B'=Lab Only, 'C'=No) |

### Box 28-30 - Charge Information
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 28 | Total Charge | `formData.claimInformation.claimChargeAmount` | `claimInformation.claimChargeAmount` | **Required** | CLM02 (auto-calculated) |
| 29 | Amount Paid | `formData.claimInformation.patientAmountPaid` | `claimInformation.patientAmountPaid` | Optional | AMT02 (AMT01=F5) |
| 30 | Reserved for NUCC Use | ❌ NOT IN FORM | N/A | N/A | |

### Box 31 - Physician Signature
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 31 | Signature on File? | `physicianSignatureOnFile` (local state, boolean) | ❌ NO DIRECT MAPPING | N/A | Checkbox pre-checked - relates to CLM06/CLM08 |

### Box 32 - Service Facility
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 32 | Facility Name/Address | `formData.claimInformation.serviceFacilityLocation.organizationName` | `claimInformation.serviceFacilityLocation.organizationName` | Optional | Loop 2420C NM103 |
| 32 | Facility Address | `formData.claimInformation.serviceFacilityLocation.address.*` | `.serviceFacilityLocation.address.*` | Optional | Loop 2420C N3/N4 |
| 32a | NPI | `formData.claimInformation.serviceFacilityLocation.npi` | `.serviceFacilityLocation.npi` | Optional | NM109 |

### Box 33 - Billing Provider
| Box | Field Name | Form Path | API Path | API Field | Notes |
|-----|------------|-----------|----------|-----------|-------|
| 33 | Billing Provider Name | `formData.billing.organizationName` | `billing.organizationName` | Optional | Loop 2010AA NM103 |
| 33 | Billing Provider Address | `formData.billing.address.*` | `billing.address.*` | Optional | Loop 2010AA N3/N4 |
| 33 | Phone Number | `formData.billing.contactInformation.phoneNumber` | `billing.contactInformation.phoneNumber` | Optional | PER04 |
| 33a | NPI | `formData.billing.npi` | `billing.npi` | Optional | NM109 |

---

## ❌ FORM FIELDS NOT IN API

These fields are collected in the form but have no direct API mapping:

1. **Box 8** - Patient Status (reserved, not used)
2. **Box 11d** - "Is there another health benefit plan?" (boolean)
   - Used for UI logic only (enables/disables Box 9 fields)
3. **Box 12, 13, 31** - Signature on File checkboxes (boolean)
   - Maps to API indicators (`signatureIndicator` = Y/N, `benefitsAssignmentCertificationIndicator` = Y/N/W)
   - Pre-checked checkboxes → sends 'Y' to API
4. **Box 20** - Outside Lab flag and charges
   - Could potentially map to `fileInformation` or custom note
5. **Box 25 Tax ID Type** - SSN vs EIN selector (dropdown)
   - This is UI-only; determines which field (`ssn` or `employerId`) to populate

---

## ⚠️ API FIELDS NOT IN FORM

These are **required or commonly-used API fields** that are NOT currently collected in the form:

### Critical Missing Fields

#### Root Level
- ✅ `controlNumber` - Transaction control number (can be auto-generated)
- ⚠️ `tradingPartnerServiceId` - Payer ID (should be collected - Box 1a area or separate field)
- ⚠️ `submitter` - Submitter organization information (**REQUIRED**)
  - `submitter.organizationName` - Who is submitting the claim
  - `submitter.contactInformation.name` - Contact person
  - `submitter.contactInformation.phoneNumber` - Phone number
  - `submitter.contactInformation.email` - Email
- ⚠️ `receiver` - Receiver organization (**REQUIRED**)
  - `receiver.organizationName` - Insurance company name
- ✅ `subscriber.paymentResponsibilityLevelCode` - **REQUIRED** ('P'=Primary, 'S'=Secondary, etc.)
  - Currently defaults to '1' in validation/submission code
- ⚠️ `billing.providerType` - **REQUIRED** ('Organization' or 'Person')
  - Currently defaults to 'Organization' in code
- ⚠️ `rendering` - Rendering provider information (Loop 2420A)
  - Often same as billing provider but can be different
  - `rendering.npi`
  - `rendering.providerType`

#### ClaimInformation Level
- ✅ `claimInformation.placeOfServiceCode` - **REQUIRED** Place of service for entire claim
  - Currently defaults to '11' in validation code
- ✅ `claimInformation.claimFrequencyCode` - **REQUIRED** ('1'=Original, '7'=Replacement, '8'=Void)
  - Currently defaults to '1' (Original)
- ✅ `claimInformation.signatureIndicator` - **REQUIRED** (Y/N)
  - Currently defaults to 'Y'
- ✅ `claimInformation.releaseInformationCode` - **REQUIRED** ('Y' or 'I')
  - Currently defaults to 'Y'
- ⚠️ `claimInformation.claimDateInformation.*` - Various date fields
  - `symptomDate` (Box 14)
  - `initialTreatmentDate` (Box 15)
  - `disabilityBeginDate/disabilityEndDate` (Box 16)
  - `admissionDate/dischargeDate` (Box 18)
- ⚠️ `claimInformation.claimSupplementalInformation.*`
  - `priorAuthorizationNumber` (Box 23)
  - `referralNumber`
  - `claimNumber` (Box 11b)
  - `medicalRecordNumber`

#### ServiceLine Level
- ✅ `serviceLines[].professionalService.procedureIdentifier` - **REQUIRED**
  - Should be 'HC' for HCPCS codes
  - Currently hardcoded in submission
- ✅ `serviceLines[].professionalService.measurementUnit` - **REQUIRED** ('UN'=Unit, 'MJ'=Minutes)
  - Currently defaults to 'UN'

---

## 🔄 DATA TRANSFORMATION NOTES

### Date Format Transformations
- **Form**: Uses HTML5 date inputs (YYYY-MM-DD) or text inputs with MM/DD/YY format
- **API**: Requires CCYYMMDD format (8 digits, no separators)
- **Transformation**: `formatDateForAPI()` removes dashes

### Currency Transformations
- **Form**: Displays as dollars with decimal (XX.XX) using `formatCurrency()`
- **API**: Requires cents as string (no decimal) - "2875" for $28.75
- **Transformation**: `parseCurrencyToCents()` stores as cents string

### Phone Number Transformations
- **Form**: Displays with dashes (XXX-XXX-XXXX) using `formatPhoneNumber()`
- **API**: Requires digits only as string
- **Transformation**: `replace(/\D/g, '')` strips non-digits

### Provider Type
- **Form**: Not explicitly collected
- **API**: **Required** - Must be 'Organization', 'Person', or specific type
- **Current**: Hardcoded to 'Organization' for billing provider

### Diagnosis Pointers
- **Form**: Uses A-L letters in dropdown
- **API**: Uses numeric strings '1'-'12' in array
- **Transformation**: Letter to index+1 conversion (A→'1', B→'2', etc.)

---

## 📋 RECOMMENDATIONS

### High Priority - Add to Form
1. **Submitter Information** (Loop 1000A) - Required for submission
   - Organization name
   - Contact person
   - Phone number
   - Email
2. **Receiver Information** (Loop 1000B) - Required
   - Insurance company/payer name
3. **Trading Partner Service ID** - Payer ID field
   - Could be dropdown of common payers or text input
4. **Prior Authorization Number** (Box 23)
5. **Referring Provider** (Box 17/17a/17b)
6. **Provider Type Selector** for Billing Provider
   - Radio buttons: Organization vs Individual

### Medium Priority - Consider Adding
1. **Date fields** (Boxes 14, 15, 16, 18)
   - Illness/injury dates
   - Disability dates
   - Hospitalization dates
2. **Box 19** - Additional claim information (free text)
3. **Box 22** - Resubmission code and original reference
4. **Other Insured Information** (Boxes 9-9d) - For secondary insurance
5. **Rendering Provider** separate from Billing Provider

### Low Priority - Optional Enhancements
1. **Claim notes/attachments** - NTE segments
2. **DME (Durable Medical Equipment) specific fields**
3. **Ambulance transport information**
4. **Vision-specific condition information**
5. **EPSDT indicators** (Box 24H)
6. **Service facility location** details (Box 32) - if different from billing

---

## 🎯 NEXT STEPS

1. **Immediate**: Add submitter and receiver information fields
2. **Quick Win**: Make Provider Type configurable (Organization vs Person)
3. **Enhancement**: Add Prior Authorization (Box 23) and Referring Provider (Box 17)
4. **Future**: Consider adding secondary insurance fields (Boxes 9-9d)
5. **Validation**: Ensure all required API fields have defaults or are collected

---

## 📝 FIELD COUNT SUMMARY

- **Total CMS 1500 Boxes**: 33
- **Boxes Fully Implemented**: ~18
- **Boxes Partially Implemented**: ~5
- **Boxes Not Implemented**: ~10
- **API Required Fields Covered**: ~80%
- **API Required Fields Missing**: ~20% (mostly metadata like submitter/receiver)

