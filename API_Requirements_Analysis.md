# Professional Claims V3 API Requirements Analysis

## Purpose
This document defines what the **API requires** first, then identifies gaps in the current form implementation.

---

## ✅ REQUIRED FIELDS BY API

### Root Level (ClaimSubmissionRequest)

| Field | Required | Type | CMS Box | Current Form Status | Notes |
|-------|----------|------|---------|-------------------|-------|
| `controlNumber` | ✅ **YES** | string | N/A (system) | ✅ Auto-generated | Transaction control number (ST02) |
| `submitter` | ✅ **YES** | Submitter | **NO CMS BOX** | ❌ **MISSING** | **CRITICAL** - Who is submitting the claim (Loop 1000A) |
| `receiver` | ✅ **YES** | Receiver | **NO CMS BOX** | ❌ **MISSING** | **CRITICAL** - Insurance company receiving claim (Loop 1000B) |
| `subscriber` | ✅ **YES** | Subscriber | Boxes 1a, 4, 7, 11 | ⚠️ Partial (see below) | Patient's insurance subscriber info |
| `billing` | ✅ **YES** | Provider | Box 33 | ⚠️ Partial - **Missing: providerType** (not a CMS box) | Billing provider (providerType REQUIRED but not on form) |
| `claimInformation` | ✅ **YES** | ClaimInformation | Various | ⚠️ Partial (see below) | Claim details (many required sub-fields) |

### Submitter (REQUIRED Object)
**Purpose**: Identifies the organization/person submitting the claim to the payer.

| Field | Required | CMS Box | Current Form | Notes |
|-------|----------|---------|--------------|-------|
| `organizationName` OR `lastName` | ✅ **YES** (one) | **NO CMS BOX** | ❌ Missing | Submitter organization or person name |
| `firstName` | Only if person | **NO CMS BOX** | ❌ Missing | Required if lastName used |
| `contactInformation.name` | ✅ **YES** | **NO CMS BOX** | ❌ Missing | Contact person name |
| `contactInformation.phoneNumber` | No | **NO CMS BOX** | ❌ Missing | Contact phone (recommended) |
| `contactInformation.email` | No | **NO CMS BOX** | ❌ Missing | Contact email (recommended) |

**X12 Mapping**: Loop 1000A, Segment NM1  
**Why Important**: Claims are rejected without valid submitter information.  
**Note**: This is NOT on the CMS 1500 form - it's administrative metadata about who is electronically submitting the claim.

### Receiver (REQUIRED Object)
**Purpose**: Identifies the insurance payer receiving the claim.

| Field | Required | CMS Box | Current Form | Notes |
|-------|----------|---------|--------------|-------|
| `organizationName` | ✅ **YES** | **NO CMS BOX** (relates to Box 1) | ❌ Missing | Insurance company name (e.g., "UnitedHealthcare", "Aetna") |

**X12 Mapping**: Loop 1000B, Segment NM1, Element NM103  
**Why Important**: Routes the claim to the correct payer.  
**Note**: This is NOT explicitly on CMS 1500 but relates to Box 1 (insurance type). Often derived from Box 1a (Insured's ID) or separate payer identification.

### Subscriber (REQUIRED Object)
**Purpose**: The person who holds the insurance policy.

| Field | Required | CMS Box | Current Form | Notes |
|-------|----------|---------|--------------|-------|
| `paymentResponsibilityLevelCode` | ✅ **YES** | **NO CMS BOX** | ✅ Hardcoded 'P' | Not on form - indicates primary/secondary insurance |
| `memberId` | No | 1a | ✅ Implemented | Insured's ID Number |
| `firstName` | No | 4 | ✅ Implemented | Insured's First Name |
| `lastName` | No | 4 | ✅ Implemented | Insured's Last Name |
| `middleName` | No | 4 | ✅ Implemented | Insured's Middle Initial |
| `gender` | No | 11a | ✅ Implemented | Insured's Sex |
| `dateOfBirth` | No | 11a | ✅ Implemented | Insured's Date of Birth |
| `address.*` | No | 7 | ✅ Implemented | Insured's Address |
| `contactInformation.phoneNumber` | No | 7 | ✅ Implemented | Insured's Telephone |
| `policyNumber` | No | 11 | ✅ Implemented | Insured's Policy Group Number |
| `groupNumber` | No | 11 | ✅ Implemented | Insured's Group Number |
| `subscriberGroupName` | No | 11c | ✅ Implemented | Insurance Plan Name |

**X12 Mapping**: Loop 2000B/2010BA, Segment SBR  
**Payment Responsibility Codes**:
- 'P' = Primary (most common)
- 'S' = Secondary
- 'T' = Tertiary
- Other codes for multiple payers

### Billing Provider (REQUIRED Object)

| Field | Required | CMS Box | Current Form | Notes |
|-------|----------|---------|--------------|-------|
| `providerType` | ✅ **YES** | **NO CMS BOX** | ⚠️ **Hardcoded 'Organization'** | Not on form - should be selectable |
| `npi` | No | 33a | ✅ Implemented | Billing Provider NPI |
| `organizationName` | No | 33 | ✅ Implemented | Billing Provider Name (if organization) |
| `firstName` | No | 33 | ❌ Missing | Billing Provider First Name (if person) |
| `lastName` | No | 33 | ❌ Missing | Billing Provider Last Name (if person) |
| `address.*` | No | 33 | ✅ Implemented | Billing Provider Address |
| `contactInformation.phoneNumber` | No | 33 | ✅ Implemented | Billing Provider Phone |
| `employerId` OR `ssn` | No | 25 | ✅ Implemented | Federal Tax ID Number |

**X12 Mapping**: Loop 2010AA, Segment NM1  
**Provider Types**:
- 'Organization' (most common for practices) - use `organizationName`
- 'Person' (for individual practitioners) - use `firstName`/`lastName`

---

## ✅ REQUIRED: ClaimInformation Fields

### Claim-Level Required Fields

| Field | Required | CMS Box | Current Form | X12 | Valid Values |
|-------|----------|---------|--------------|-----|--------------|
| `claimFilingCode` | ✅ **YES** | 1 | ✅ Implemented | SBR09 | 'MB', 'MC', 'CI', 'HM', etc. |
| `patientControlNumber` | ✅ **YES** | 26 | ✅ Implemented | CLM01 | Unique claim identifier |
| `claimChargeAmount` | ✅ **YES** | 28 | ✅ Auto-calculated | CLM02 | Total charges in cents |
| `placeOfServiceCode` | ✅ **YES** | **NO CMS BOX** (relates to 24B) | ⚠️ **Missing** - only per-line in 24B | CLM05-01 | '11' (office), '21' (hospital), etc. |
| `claimFrequencyCode` | ✅ **YES** | **22** | ❌ **NOT CONNECTED** | CLM05-03 | '1', '7', '8' (see below) |
| `signatureIndicator` | ✅ **YES** | 12 | ✅ Checkbox | CLM06 | Patient signature on file? |
| `planParticipationCode` | No | 27 | ✅ Implemented | CLM07 | 'A'=Assigned, 'B'=Lab only, 'C'=Not assigned |
| `benefitsAssignmentCertificationIndicator` | ✅ **YES** | 13 | ✅ Checkbox | CLM08 | Payment assignment |
| `releaseInformationCode` | ✅ **YES** | **NO CMS BOX** | ✅ Hardcoded 'Y' | CLM09 | Release medical info? |
| `healthCareCodeInformation` | ✅ **YES** (min 1) | 21 | ✅ Implemented | HI segment | Min 1, max 12 diagnosis codes |
| `serviceLines` | ✅ **YES** (min 1) | 24 | ✅ Implemented | Loop 2400 | Min 1, max 50 service lines |

### Critical: claimFrequencyCode (Box 22)
**Required**: ✅ **YES**  
**X12**: CLM05-03  
**CMS Box**: **22 - RESUBMISSION CODE**  
**Purpose**: Indicates if this is an original claim or a correction/resubmission.

| Code | Meaning | When to Use |
|------|---------|-------------|
| **'1'** | Original | First time submitting this claim (DEFAULT) |
| **'7'** | Replacement | Correcting a previously submitted claim |
| **'8'** | Void | Canceling a previously submitted claim |

**Current Status**: Form has Box 22 input fields but they're **not connected** to state/API.  
**What's Needed**: 
1. Dropdown for frequency code (values: '1', '7', '8')
2. Text input for original reference number (only if code is '7' or '8')
3. Connect to:
   - `claimInformation.claimFrequencyCode` (required)
   - `claimInformation.claimSupplementalInformation.claimNumber` (optional, for original ref)

---

## ✅ REQUIRED: ServiceLine Fields

Each service line (Box 24) requires:

| Field | Required | CMS Box | Current Form | X12 | Notes |
|-------|----------|---------|--------------|-----|-------|
| `serviceDate` | ✅ **YES** | 24A (FROM) | ✅ Implemented | DTP03 | CCYYMMDD format |
| `serviceDateEnd` | No | 24A (TO) | ✅ Implemented | DTP03 | For date ranges |
| `professionalService.procedureIdentifier` | ✅ **YES** | **NO CMS BOX** (24I shows "NPI") | ✅ Hardcoded 'HC' | SV101-01 | 'HC' for HCPCS codes |
| `professionalService.procedureCode` | ✅ **YES** | 24D | ✅ Implemented | SV101-02 | CPT/HCPCS code |
| `professionalService.procedureModifiers` | No (max 4) | 24D (modifier) | ✅ Implemented | SV101-03 to 06 | Procedure modifiers |
| `professionalService.lineItemChargeAmount` | ✅ **YES** | 24F | ✅ Implemented | SV102 | In cents |
| `professionalService.measurementUnit` | ✅ **YES** | **NO CMS BOX** | ✅ Hardcoded 'UN' | SV103 | 'UN'=Unit, 'MJ'=Minutes |
| `professionalService.serviceUnitCount` | ✅ **YES** | 24G | ✅ Implemented | SV104 | Number of units |
| `professionalService.placeOfServiceCode` | No | 24B | ✅ Implemented | SV105 | Per-line place of service |
| `professionalService.compositeDiagnosisCodePointers.diagnosisCodePointers` | ✅ **YES** (min 1) | 24E | ✅ Implemented | SV107 | Pointers to Box 21 (A-L) |

---

## ⚠️ CRITICAL MISSING FIELDS

### High Priority - Form Cannot Submit Without These

1. **Submitter Information** (Loop 1000A)
   - Organization name OR person name
   - Contact information (name, phone, email)
   - **Impact**: Claim will be rejected
   - **Recommendation**: Add new section before Box 1

2. **Receiver Organization Name** (Loop 1000B)
   - Insurance company/payer name
   - **Impact**: Claim cannot be routed
   - **Recommendation**: Add dropdown or text input near Box 1

3. **Claim Frequency Code** (Box 22 - CLM05-03)
   - Currently: Form has inputs but not connected
   - **Impact**: API defaults to '1' (Original) but corrections/voids need '7'/'8'
   - **Recommendation**: Connect existing Box 22 with dropdown

---

## 📊 OPTIONAL BUT RECOMMENDED FIELDS

### Date Information
These enhance claim processing but aren't required:

| Field | Required | CMS Box | Current Form | API Path | Purpose |
|-------|----------|---------|--------------|----------|---------|
| Symptom/Illness Date | No | 14 | ⚠️ **Input exists, not connected** | `claimInformation.claimDateInformation.symptomDate` | When symptoms started |
| Disability Begin Date | No | 16 (FROM) | ⚠️ **Input exists, not connected** | `.disabilityBeginDate` | Work disability start |
| Disability End Date | No | 16 (TO) | ⚠️ **Input exists, not connected** | `.disabilityEndDate` | Work disability end |
| Hospitalization Admission | No | 18 (FROM) | ⚠️ **Input exists, not connected** | `.admissionDate` | Hospital admission date |
| Hospitalization Discharge | No | 18 (TO) | ⚠️ **Input exists, not connected** | `.dischargeDate` | Hospital discharge date |
| Initial Treatment Date | No | 15 | ⚠️ **Input exists, not connected** | `.initialTreatmentDate` | First treatment for condition |

### Provider Information
Commonly needed for certain claim types:

| Field | Required | CMS Box | Current Form | API Path | When Needed |
|-------|----------|---------|--------------|----------|-------------|
| Referring Provider Name | No | 17 | ❌ **Missing** | `referring.firstName/lastName/organizationName` | Specialist referrals |
| Referring Provider NPI | No | 17b | ❌ **Missing** | `referring.npi` | Referring provider NPI |
| Referring Provider Other ID | No | 17a | ❌ **Missing** | `referring.*` | Other ID qualifier |
| Rendering Provider NPI | No | 24J | ⚠️ **Partial** (per service line) | `rendering.npi` or `serviceLines[].renderingProvider.npi` | If different from billing |
| Ordering Provider | No | **NO CMS BOX** | ❌ **Missing** | `ordering.*` or `serviceLines[].orderingProvider` | Lab/DME orders |

### Supplemental Information

| Field | Required | CMS Box | Current Form | API Path | Purpose |
|-------|----------|---------|--------------|----------|---------|
| Prior Authorization | No | 23 | ⚠️ **Input exists, not connected** | `claimInformation.claimSupplementalInformation.priorAuthorizationNumber` | Pre-approved services |
| Referral Number | No | **NO CMS BOX** | ❌ **Missing** | `.claimSupplementalInformation.referralNumber` | Referral tracking |
| Additional Claim Info | No | 19 | ❌ **Missing** | `.claimNote.additionalInformation` | Free text notes |

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: Critical - Make API Functional
1. ✅ **Add Submitter section** (before Box 1)
   - Organization/Person name
   - Contact person
   - Phone number
   - Email address

2. ✅ **Add Receiver field** (near Box 1)
   - Insurance company name (can be dropdown of common payers)
   - Or link to `tradingPartnerServiceId` for lookup

3. ✅ **Connect Box 22** (Resubmission)
   - Dropdown for frequency code ('1', '7', '8')
   - Show original reference field only if '7' or '8'

4. ✅ **Make Provider Type selectable** (Box 33 area)
   - Radio buttons: Organization / Person
   - Affects billing provider structure

### Phase 2: Enhanced Functionality
1. Add date fields (Boxes 14, 15, 16, 18)
2. Add referring provider (Box 17)
3. Add prior authorization (Box 23)
4. Add additional notes (Box 19)

### Phase 3: Advanced Features
1. Secondary insurance (Boxes 9-9d)
2. Rendering provider (different from billing)
3. Service facility location (Box 32 - if different)
4. Ambulance/DME specific fields

---

## 📝 VALIDATION RULES TO IMPLEMENT

### Required Field Validation
- Submitter: Must have either organizationName OR lastName+firstName
- Receiver: Must have organizationName
- Billing Provider: Must have providerType
- Subscriber: Must have paymentResponsibilityLevelCode
- Service Lines: At least one required
- Diagnosis Codes: At least one required (max 12)
- Each diagnosis pointer in service lines must reference valid Box 21 entry

### Business Logic Validation
- Box 22: If frequency code is '7' or '8', original reference number is required
- Box 6: If "Self" selected, dependent is not required
- Box 10b: Auto accident state required only if auto accident = YES
- Box 20: Charges field required only if outside lab = YES
- Box 24E: Diagnosis pointers must be 1-12 (A-L) and reference existing Box 21 codes

### Format Validation
- Dates: Must be CCYYMMDD format (8 digits)
- Phone numbers: Digits only (10 digits typically)
- ZIP codes: 5 or 9 digits
- NPI: 10 digits
- Currency: Store as cents (no decimals in API)

---

## 🔍 CURRENT FORM GAP ANALYSIS

| Category | Required by API | In Form | Connected | Gap |
|----------|----------------|---------|-----------|-----|
| **Submitter** | ✅ Yes | ❌ No | ❌ No | **CRITICAL** |
| **Receiver** | ✅ Yes | ❌ No | ❌ No | **CRITICAL** |
| **Box 22 Frequency Code** | ✅ Yes | ⚠️ Yes | ❌ No | **HIGH** |
| **Box 22 Original Ref** | Optional | ⚠️ Yes | ❌ No | **HIGH** |
| Provider Type | ✅ Yes | ❌ No | ✅ Hardcoded | **MEDIUM** |
| Box 14-18 Dates | Optional | ⚠️ Inputs exist | ❌ No | **LOW** |
| Box 17 Referring | Optional | ❌ No | ❌ No | **LOW** |
| Box 19 Notes | Optional | ❌ No | ❌ No | **LOW** |
| Box 23 Prior Auth | Optional | ⚠️ Input exists | ❌ No | **LOW** |
| Boxes 9-9d Secondary | Optional | ❌ No | ❌ No | **LOW** |

---

## 💡 RECOMMENDATIONS

1. **Immediate**: Add Submitter and Receiver fields - these are absolutely required for the API to work
2. **Quick Win**: Connect Box 22 fields properly with dropdown for frequency code
3. **Enhancement**: Make Provider Type selectable rather than hardcoded
4. **Future**: Add date fields and referring provider for more complete claim submission

The current form is about **60-70% complete** for basic claims submission, but **missing critical metadata** (submitter/receiver) that makes the API non-functional.

