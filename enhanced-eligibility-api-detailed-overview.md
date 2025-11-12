# Optum Enhanced Eligibility API v1 - Detailed Overview

## API Information

**Version:** v0.2.0  
**OpenAPI Spec:** 3.0.1  
**Base URLs:**
- **Sandbox:** `https://sandbox-apigw.optum.com` (uses test data)
- **Production:** `https://apigw.optum.com` (uses live data)

---

## Authentication

**Type:** OAuth 2.0 with Client Credentials Flow  
**Token URL:** `/apip/auth/v2/token`

### Scopes
- `read_txn` - Read transactions
- `create_txn` - Submit a new transaction request
- `read_coveragediscovery` - Read coverage discovery tasks
- `create_coveragediscovery` - Submit a new coverage discovery task
- `read_healthcheck` - Check the status of the system

---

## API Endpoints

### 1. Eligibility Requests

#### POST `/rcm/eligibility/v1`
**Operation ID:** `postEligibility`  
**Summary:** Submit a new eligibility request  
**Security:** OAuth (`create_txn` scope)

**Description:**
- Dispatches a new real-time transaction request to the internal engine
- Supports automatic Coverage Discovery integration when enrollment results in non-eligible coverage
- Can disable value-added features on a per-request basis using `x-optum-eligibility-disable-value-add` header

**Headers:**
- `x-optum-correlation-id` (optional) - Unique identifier for tracking requests
- `x-optum-eligibility-disable-value-add` (optional) - Comma-delimited list to disable features like "deduplication"

**Request Body:** 
- JSON format following the canonical eligibility request schema (270 equivalent)
- Required fields:
  - `controlNumber` (9 digits)
  - `subscriber` (member details)
  - `provider` information
  
**Response Codes:**
- `200` - OK (Eligibility response with transaction details)
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `5XX` - Server errors

**Response Headers:**
- `link` - Contains references to spawned Coverage Discovery tasks (if applicable)

**Key Features:**
- **Coverage Discovery Integration:** Automatically initiates coverage discovery when conditions are met
- **Callback Solution:** Can consolidate Real-Time Eligibility response with Coverage Discovery response
- **Transaction Deduplication:** Checks for previously submitted transactions to reduce costs

---

### 2. Eligibility Transactions

#### GET `/rcm/eligibility/v1/transactions`
**Operation ID:** N/A  
**Summary:** Find all eligibility transactions  
**Security:** OAuth (`read_txn` scope)

**Description:**
Returns matching eligibility transactions with optional filtering

**Query Parameters:**
- `status` - Filter by transaction status (eligible, ineligible, payer_unavailable, payer_not_in_system, processing_error, patient_unknown, suppressed, conditional, invalid, pending)
- `hash` - Filter by uniqueness hash
- `correlationId` - Filter by correlation ID
- `startDateTime` - Filter by start date (format: 2017-07-21T17:32:28Z)
- `endDateTime` - Filter by end date
- `sort` - Order results (e.g., `-processedDate` for descending)
- `offset` - Pagination offset
- `limit` - Number of records per page (1-100, default 30)
- `returnTotalCount` - Include total count in response header

**Response:**
- Array of Transaction objects
- Pagination via `link` header
- Optional `x-total-count` header when `returnTotalCount=true`

---

#### GET `/rcm/eligibility/v1/transactions/{id}`
**Operation ID:** N/A  
**Summary:** Find eligibility transaction by ID  
**Security:** OAuth (`read_txn` scope)

**Description:**
Returns an individual transaction with the corresponding ID, if found

**Path Parameters:**
- `id` (required) - The unique ID of the target transaction

**Response Codes:**
- `200` - OK (Transaction object)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `422` - Unprocessable entity
- `5XX` - Server errors

---

### 3. Coverage Discovery

#### POST `/rcm/eligibility/v1/coverage-discovery`
**Operation ID:** `postDiscovery`  
**Summary:** Submit new discovery task(s)  
**Security:** OAuth (`create_coveragediscovery` scope)

**Description:**
- **Enrollment Required:** Must be enrolled in Coverage Discovery feature
- Async process that initializes new coverage discovery paths
- Accepts either `canonicalEligibilityRequest` OR `canonicalEligibilityResponse`
- Supports callback URLs for asynchronous response delivery
- Includes **Dry Run** mode for testing without executing transactions

**Request Body Properties:**
- `canonicalEligibilityRequest` - Valid Canonical Eligibility request (conditionally required)
- `canonicalEligibilityResponse` - Previously processed transaction response (conditionally required)
- `callbackUrl` - URL for receiving asynchronous responses (must be whitelisted)
- `dryRun` - Boolean flag to test request without execution

**Dry Run Mode:**
- Set `dryRun = true` to validate request against configured paths
- No transactions executed, no records created
- Response indicates which paths met conditions and which failed
- Returns 200 for single task, 207 for multi-task

**Response Codes:**
- `200` - OK (Dry run response)
- `202` - Accepted (Single task created)
- `207` - Multi-Status (Multiple tasks created)
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `422` - Unprocessable entity (no paths qualified)
- `5XX` - Server errors

**Response (202):**
```json
{
  "id": "d0747d80-ed4e-4af9-b127-1277fb472c44",
  "name": "serial discover task"
}
```

**Callback Structure:**
- Asynchronous callback to customer's API with completed task results
- Must meet customer-specific whitelisting requirements
- Receives CoverageDiscoveryTask object with full results

---

#### POST `/rcm/eligibility/v1/coverage-discovery/x12`
**Operation ID:** `postDiscoveryX12`  
**Summary:** Submit new discovery task(s) with EDI  
**Security:** OAuth (`create_coveragediscovery` scope)

**Description:**
Same functionality as above but accepts X12 EDI format instead of JSON

**Request Body Properties:**
- `x12-270` - EDI 270 eligibility inquiry (conditionally required)
- `x12-271` - EDI 271 eligibility response (conditionally required)
- `callbackUrl` - URL for receiving asynchronous responses
- `dryRun` - Boolean flag for testing

**Response Codes:** Same as `/coverage-discovery`

---

#### GET `/rcm/eligibility/v1/coverage-discovery`
**Operation ID:** `getAllDiscoveries`  
**Summary:** Find all discovery tasks  
**Security:** OAuth (`read_coveragediscovery` scope)

**Description:**
Returns matching discovery tasks with optional filtering

**Query Parameters:**
- `correlationId` - Filter by correlation ID
- `status` - Filter by task status (success, failure, pending)
- `startDateTime` - Filter by start date
- `endDateTime` - Filter by end date
- `sort` - Order results (e.g., `-startDateTime` for descending)
- `offset` - Pagination offset
- `limit` - Number of records per page

**Response:**
- Array of CoverageDiscoveryTask objects
- Pagination via `link` header

---

#### GET `/rcm/eligibility/v1/coverage-discovery/{id}`
**Operation ID:** `getDiscoveryById`  
**Summary:** Find discovery task by ID  
**Security:** OAuth (`read_coveragediscovery` scope)

**Description:**
Returns an individual discovery response with the corresponding ID, if found

**Path Parameters:**
- `id` (required) - The unique ID of the target discovery task

**Response Codes:**
- `200` - OK (CoverageDiscoveryTask object)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `422` - Unprocessable entity
- `5XX` - Server errors

---

### 4. Health Check

#### GET `/rcm/eligibility/v1/healthcheck`
**Operation ID:** `healthcheck`  
**Summary:** Validate the status of the system  
**Security:** OAuth (`read_healthcheck` scope)

**Description:**
Health check endpoint for the Enhanced Eligibility workflow

**Response Codes:**
- `200` - OK (System healthy)
  ```json
  {
    "status": "ok"
  }
  ```
- `401` - Unauthorized
- `500` - Internal Server Error (System unhealthy)
  ```json
  {
    "status": "unhealthy"
  }
  ```

---

## Data Models

### Transaction Object

The canonical model for Enhanced Eligibility responses.

**Key Properties:**
- `id` - Unique transaction ID
- `sourceId` - ID of parent transaction (if applicable)
- `sourceType` - How transaction was created (new, historical, duplicate, autosubmit)
- `correlationId` - Consumer-provided correlation ID
- `processedDate` - ISO 8601 timestamp
- `status` - Transaction outcome
  - `value` - Status code (eligible, ineligible, payer_unavailable, etc.)
  - `description` - Human-readable description
- `errors` - Array of error messages
- `x12-271` - EDI 271 response message
- `benefits` - Array of benefit objects
- `patient` - Patient demographic information
- `payer` - Payer details and contact information
- `plan` - Plan, group, and policy details
- `subscriber` - Subscriber information from payer

### EligibilityRequest Schema

Represents the canonical 270 eligibility inquiry request.

**Required Fields:**
- `controlNumber` - 9-digit interchange control number
- `subscriber` - Subscriber/patient information

**Key Properties:**
- `submitterTransactionIdentifier`
- `controlNumber` - Exactly 9 numeric characters
- `tradingPartnerServiceId` - Up to 80 characters
- `tradingPartnerName`
- `provider` - Provider information object
  - `organizationName` or (`firstName` + `lastName`)
  - `npi` - National Provider Identifier
  - `payorId`, `taxId`, `ssn`, etc.
  - `providerCode` - Type of provider (AD, AT, BI, etc.)
  - `providerType` - payer, provider, facility, etc.
- `portalUsername` - User ID for payer portal
- `portalPassword` - PIN for payer portal
- `informationReceiverName` - Additional receiver details
- `subscriber` - Patient/subscriber details
  - `memberId` - 2-80 alphanumeric characters
  - `firstName`, `middleName`, `lastName`, `suffix`
  - `gender` - M or F
  - `dateOfBirth` - YYYYMMDD format
  - `ssn`, `groupNumber`, `idCard`
  - `address` - Address object
  - `healthCareCodeInformation` - Array of diagnosis codes (max 8)
  - `additionalIdentification` - Various ID numbers
- `dependents` - Array of dependent information
  - Similar structure to subscriber
  - `individualRelationshipCode` - 01 (Spouse), 19 (Child), 34 (Other Adult)
- `encounter` - Service encounter details
  - `beginningDateOfService`, `endDateOfService`, `dateOfService`
  - `serviceTypeCodes` - Array of service codes (max 99)
  - `medicalProcedures` - Array of procedure details
  - `priorAuthorizationOrReferralNumber`
  - `industryCode` - Place of service codes (01-99)

### CoverageDiscoveryTask Object

**Key Properties:**
- `id` - Unique task ID
- `status` - success, failure, or pending
- `tenantName` - Customer name
- `traceId` - Trace identifier
- `correlationId` - Correlation identifier
- `name` - Customer-appointed task name
- `type` - serial or chained
- `startDateTime` - ISO 8601 timestamp
- `endDatetime` - ISO 8601 timestamp
- `realTime` - Abbreviated parent RTE transaction (optional)
  - Populated when enrolled in Integrated Coverage Discovery
  - Contains original transaction that triggered discovery
- `discoveryPaths` - Discovery path results
  - `successful` - Paths that found eligible coverage
  - `unsuccessful` - Paths with errors or ineligible coverage
  - `pending` - Paths not yet executed
  - `skipped` - Paths that didn't meet conditions or were terminated early

**Discovery Path Object:**
- `id` - Path identifier
- `name` - Path name (e.g., "Medicare", "Commercial", "HMO")
- `description` - Path description
- `timestamp` - Execution timestamp
- `transaction` - Transaction details
  - `id` - Transaction ID
  - `status` - Coverage outcome
  - `chcPayerId` - Change Healthcare Payer ID
  - `x12-271` - EDI response

### Benefits Object

Detailed benefit information returned by payer.

**Properties:**
- `service` - Service type description (e.g., "Urgent Care")
- `networkClass` - inNetwork or outNetwork
- `benefitType` - individual or family
- `name` - Benefit field name (e.g., "copay", "deductible")
- `value` - Benefit field value
- `type` - Data type (string, date, number, percent, monetary, phone)
- `scope` - common or service
- `insuranceType` - AllPayers, Medicaid, or Medicare
- `benefitQualifier` - Benefit code/qualifier

---

## Service Type Codes

The API supports 200+ service type codes for eligibility inquiries, including:

**Common Service Types:**
- `1` - Medical Care
- `2` - Surgical
- `30` - Health Benefit Plan Coverage
- `33` - Chiropractic
- `35` - Dental Care
- `47` - Hospital
- `48` - Hospital - Inpatient
- `50` - Hospital - Outpatient
- `86` - Emergency Services
- `88` - Pharmacy
- `98` - Professional (Physician) Visit - Office
- `AL` - Vision (Optometry)
- `UC` - Urgent Care
- `MH` - Mental Health
- `PT` - Physical Therapy

(Full list of 200+ codes available in the specification)

---

## Provider Type Codes

- `AD` - Admitting
- `AT` - Attending
- `BI` - Billing
- `CO` - Consulting
- `CV` - Covering
- `H` - Hospital
- `HH` - Home Health Care
- `LA` - Laboratory
- `OT` - Other Physician
- `P1` - Pharmacist
- `P2` - Pharmacy
- `PC` - Primary Care Physician
- `PE` - Performing
- `R` - Rural Health Clinic
- `RF` - Referring
- `SB` - Submitting
- `SK` - Skilled Nursing Facility
- `SU` - Supervising

---

## Place of Service Codes (Industry Codes)

- `11` - Office
- `12` - Home
- `21` - Inpatient Hospital
- `22` - On Campus-Outpatient Hospital
- `23` - Emergency Room - Hospital
- `24` - Ambulatory Surgical Center
- `31` - Skilled Nursing Facility
- `50` - Federally Qualified Health Center
- `81` - Independent Laboratory
- `99` - Other Place of Service

(Full list of 50+ codes available in the specification)

---

## Headers

### Request Headers
- `x-optum-tenant-id` (required for some operations) - Tenant ID for data tenancy
- `x-optum-correlation-id` (optional) - Correlation ID for request tracking
- `x-optum-trace-id` (optional) - Trace ID for request tracking
- `x-optum-eligibility-disable-value-add` (optional) - Disable specific features

### Response Headers
- `x-optum-tenant-id` - Tenant ID
- `x-optum-correlation-id` - Correlation ID from request
- `x-optum-trace-id` - Trace ID for debugging
- `location` - Location of created resource
- `link` - Pagination or related resource links
- `x-total-count` - Total count of matching records (when requested)

---

## Error Responses

All error responses follow a consistent format with an array of error messages.

**Common Error Codes:**
- `400` - Bad Request
  - Example: `["Failed Precondition - Field 'example' is required"]`
- `401` - Unauthorized (Permission Denied)
  - Invalid credentials or token
- `403` - Forbidden
  - Invalid tenant ID or insufficient permissions
- `404` - Not Found
  - Record not found
- `422` - Unprocessable Entity
  - Unable to deserialize or no qualifying discovery paths
- `5XX` - Unexpected Server Error

---

## Key Features Summary

### 1. Transaction Deduplication
- Checks for previously submitted transactions before sending to clearinghouse
- Retrieves cached responses to reduce transaction costs
- Can be disabled per-request via header

### 2. Payer Aliasing
- Maps EHR/HIS Payer IDs to Optum Payer IDs automatically
- Allows continued use of existing Payer IDs in your system

### 3. Integrated Self-Pay Detection
- Verifies patient's uninsured status
- Helps reduce bad debt and increase collections

### 4. Coverage Discovery
- **Serial Discovery:** Executes multiple discovery paths sequentially
- **Chained Discovery:** Executes paths based on previous results
- **Dry Run Mode:** Test configurations without executing transactions
- **Callback Support:** Asynchronous result delivery
- **Early Termination:** Stops when eligible coverage found (configurable)
- **Path Types:**
  - Medicare discovery
  - Commercial payer discovery
  - Medicaid discovery
  - HMO-specific discovery
  - Custom configured paths

### 5. Advanced Automation
- Real-time eligibility verification
- Extensive payer connections
- High network stability
- Rapid response times

---

## Workflow Examples

### Standard Eligibility Check

1. **Submit Eligibility Request**
   ```
   POST /rcm/eligibility/v1
   ```
   - Provide patient demographics, provider info
   - Specify trading partner/payer

2. **Receive Real-Time Response**
   - Transaction ID returned
   - Status: eligible, ineligible, etc.
   - Benefits array with coverage details
   - x12-271 EDI response

3. **Query Transaction Later (Optional)**
   ```
   GET /rcm/eligibility/v1/transactions/{id}
   ```

### Coverage Discovery Workflow

1. **Initial Eligibility Check Returns Ineligible**
   - If enrolled, Coverage Discovery automatically triggers
   - Response includes `link` header with discovery task references

2. **Monitor Discovery Tasks**
   ```
   GET /rcm/eligibility/v1/coverage-discovery/{id}
   ```
   - Check status: pending, success, failure
   - Review successful paths (found coverage)
   - Review unsuccessful paths (no coverage)

3. **Receive Callback (If Configured)**
   - Asynchronous notification when discovery completes
   - Full task results including all paths executed

### Dry Run Testing

1. **Test Discovery Configuration**
   ```
   POST /rcm/eligibility/v1/coverage-discovery
   {
     "canonicalEligibilityRequest": {...},
     "dryRun": true
   }
   ```

2. **Review Which Paths Would Execute**
   - Response shows pending paths that meet conditions
   - No actual transactions performed
   - No records created

---

## Integration Considerations

### Authentication Flow
1. Obtain OAuth token from `/apip/auth/v2/token`
2. Use token in Authorization header: `Bearer {token}`
3. Token expires - implement refresh logic

### Correlation ID Strategy
- Use consistent correlation IDs for related transactions
- Query transactions by correlation ID for tracking
- Helps with debugging and transaction reconciliation

### Callback URL Requirements
- Must be whitelisted with Optum support team
- Must implement proper security (HTTPS, authentication)
- Must respond with 204 to acknowledge receipt
- Should handle idempotency (duplicate callbacks)

### Error Handling
- Implement retry logic for 5XX errors
- Log trace IDs for support requests
- Handle 422 errors (invalid data) with validation
- Cache 401 errors and refresh token

### Rate Limiting
- Not explicitly documented in spec
- Monitor response headers for rate limit info
- Implement exponential backoff for retries

### Data Retention
- Query transactions via `/transactions` endpoint
- Use date range queries for bulk retrieval
- Implement local caching/storage as needed

---

## Testing with Sandbox

**Sandbox URL:** `https://sandbox-apigw.optum.com`

- Uses test data only
- No real payer connections
- Safe for integration testing
- May have limited payer coverage compared to production

**Production URL:** `https://apigw.optum.com`

- Uses live data
- Real payer connections
- Costs may apply per transaction
- Requires production credentials

---

## Support and Documentation

- **Release Notes:** Available on developer portal
- **FAQs:** Comprehensive FAQ documentation
- **Onboarding Guide:** Step-by-step integration guide
- **API Reference:** Full OpenAPI specification
- **Community:** Developer community forum

---

## Compliance and Standards

### X12 EDI Standards
- **270** - Health Care Eligibility Benefit Inquiry
- **271** - Health Care Eligibility Benefit Response
- **Version:** 005010X279A1

### HIPAA Compliance
- Follows HIPAA transaction standards
- Secure OAuth 2.0 authentication
- Encrypted data transmission (HTTPS)

### Data Elements
- Follows X12 standard field definitions
- Supports standard code sets (ICD-10, CPT, HCPCS)
- Compatible with standard healthcare identifiers (NPI, Payer ID)

---

## Pagination

Standard pagination pattern across list endpoints:

**Request:**
- `limit` - Records per page (1-100, default 30)
- `offset` - Starting record offset

**Response:**
- `link` header contains next page URL
- `x-total-count` header (when `returnTotalCount=true`)

**Example:**
```
GET /rcm/eligibility/v1/transactions?limit=30&offset=0
```

Response header:
```
link: </?limit=30&offset=30>; rel="next"
```

---

## Best Practices

1. **Always provide correlation IDs** for request tracking and debugging
2. **Use dry run mode** before configuring new coverage discovery paths
3. **Implement callback handlers** for coverage discovery (asynchronous by nature)
4. **Cache eligibility responses** according to your business rules
5. **Enable transaction deduplication** to reduce costs
6. **Monitor health check endpoint** for system status
7. **Store transaction IDs** for future reference and reconciliation
8. **Validate requests** before submission to avoid 400/422 errors
9. **Use appropriate service type codes** for accurate benefit information
10. **Handle all possible status codes** in your integration

---

## Common Use Cases

### 1. Pre-Registration Eligibility Check
- Verify coverage before scheduling appointment
- Get copay/coinsurance information
- Validate patient demographics

### 2. Point of Service Verification
- Real-time eligibility at check-in
- Collect appropriate copayment
- Verify current coverage status

### 3. Claims Scrubbing
- Verify eligibility before claim submission
- Reduce claim rejections
- Improve first-pass acceptance rate

### 4. Coverage Discovery After Denial
- Automatically search for alternate coverage
- Check Medicare, Medicaid, commercial payers
- Reduce bad debt from uninsured patients

### 5. Batch Eligibility Verification
- Query historical transactions
- Reconcile eligibility data
- Generate reports on coverage status

---

## API Limitations

Based on the specification:

1. **Control Number:** Must be exactly 9 numeric characters
2. **Member ID:** 2-80 alphanumeric characters
3. **Service Type Codes:** Maximum 99 per request
4. **Diagnosis Codes:** Maximum 8 per subscriber/dependent
5. **Procedure Modifiers:** Maximum 4 per procedure
6. **Medical Procedures:** Maximum 98 per encounter
7. **Dependents:** No explicit maximum (2147483647 in schema)
8. **Coverage Discovery:** Requires enrollment and configuration
9. **Callbacks:** Must be whitelisted before use
10. **Pagination:** Maximum 100 records per page

---

## Version History

**Current Version:** v0.2.0

The API follows semantic versioning. Check the developer portal for:
- Version history
- Breaking changes
- Deprecation notices
- Migration guides

