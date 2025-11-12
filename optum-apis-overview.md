# Optum Eligibility and Claims APIs - Complete Overview

## API Portal
**Base URL**: https://developer.optum.com/eligibilityandclaims/

---

## 1. Enhanced Eligibility API (v1)

### Overview
Extends the functionality of Optum's standard 270/271 JSON-based Eligibility API with a customer-specific Rules Engine that enhances transactions in real-time to improve response accuracy and quality.

### Key Features
- **Transaction Deduplication**: Checks for previously submitted transactions before sending to clearinghouse, reducing costs
- **Payer Aliasing**: Maps EHR/HIS Payer IDs to Optum Payer IDs automatically
- **Integrated Self-Pay Detection**: Verifies uninsured patient status
- **Real-Time Enhancement**: Processes and enhances eligibility data as transactions occur
- **Advanced Automation**: Maintains extensive payer connections with high network stability

### Endpoints
1. **Eligibility Requests**
   - `POST` - Submit a new eligibility request

2. **Eligibility Transactions**
   - `GET` - Find all eligibility transactions
   - `GET` - Find eligibility transaction by ID

3. **Coverage Discovery**
   - `POST` - Submit new discovery task(s)
   - `POST` - Submit new discovery task(s) with EDI
   - `GET` - Find all discovery tasks
   - `GET` - Find discovery task by ID

4. **Healthcheck**
   - `GET` - Validate the status of the system

### Use Case
Streamlines eligibility verification processes, reduces manual workload for RCM specialists, and achieves more accurate operations by automating payer-specific deviation handling.

**OpenAPI Spec**: Available on developer portal page

---

## 2. Medical Network Eligibility API (v3)

### Overview
Provides access to medical subscriber or dependent plan membership information in human-readable JSON format. Converts standard X12 270/271 EDI transactions to JSON.

### Key Features
- Access to copays, coinsurances, deductibles
- Plan membership details
- Coverage information
- Benefits verification

### Endpoints
1. **Health Check**
   - `GET` - Health Check

2. **Eligibility**
   - `POST` - Check Eligibility
   - `POST` - Check Eligibility x12 (EDI format)

### Use Case
Real-time eligibility verification for medical services, allowing providers to verify patient coverage before services are rendered.

**OpenAPI Spec**: Available on developer portal page

---

## 3. Medical Network Professional Claims API (v3)

### Overview
Enables submission and validation of professional healthcare claims. Translates standard X12 EDI 837p transactions to JSON format for easier processing.

### Key Features
- Claim validation before submission
- Professional claims submission
- Support for both JSON and X12 EDI formats
- Real-time claim processing

### Endpoints
1. **Health Check**
   - `GET` - Health Check

2. **Professional Claims**
   - `POST` - Claim Validation
   - `POST` - Claim Submission
   - `POST` - Claim Submission x12 (EDI format)
   - `POST` - Claim Validation x12 (EDI format)

### Use Case
Submit professional claims (physician services, outpatient procedures) to payers with pre-submission validation to catch errors before formal submission.

**OpenAPI Spec**: Available on developer portal page

---

## 4. Medical Network Institutional Claims API (v1)

### Overview
Facilitates submission and validation of institutional healthcare claims. Converts X12 EDI 837i transactions to JSON format.

### Key Features
- Institutional claim validation
- Hospital/facility claims submission
- Support for both JSON and X12 EDI formats
- Pre-submission error detection

### Endpoints
1. **Health Check**
   - `GET` - Health Check

2. **Institutional Claims**
   - `POST` - Claim Validation
   - `POST` - Claim Submission
   - `POST` - Claim Submission x12 (EDI format)
   - `POST` - Claim Validation x12 (EDI format)

### Use Case
Submit institutional claims (hospital stays, facility services) to payers with validation capabilities to reduce claim rejections.

**OpenAPI Spec**: Available on developer portal page

---

## 5. Medical Network Claims Responses and Reports API (v2)

### Overview
Manages claim responses and reports, including 277 (Claim Status) and 835 (Payment/Remittance Advice) conversions.

### Key Features
- Report listing and retrieval
- 277 claim status conversion
- 835 remittance advice conversion
- Report management (delete)

### Endpoints
1. **Health Check**
   - `GET` - Health Check

2. **Report**
   - `GET` - List Reports
   - `GET` - Get Single Report
   - `DELETE` - Delete Single Report
   - `GET` - Convert Report 277 (Claim Status)
   - `GET` - Convert Report 835 (Remittance Advice)

### Use Case
Retrieve and manage claim responses, payment information, and claim status updates from payers.

**OpenAPI Spec**: Available on developer portal page

---

## 6. Medical Network Claim Status API (v2)

### Overview
Allows providers to check the status of submitted claims. Converts X12 276/277 transactions to JSON format.

### Key Features
- Real-time claim status checking
- Support for both JSON and X12 EDI formats
- Track claim processing progress

### Endpoints
1. **Claim Status API**
   - `GET` - Health Check
   - `POST` - Check Claim Status x12 (EDI format)
   - `POST` - Check Claim Status
   - `POST` - Check Claim Status x12 (alternative endpoint)

### Use Case
Track the status of submitted claims throughout the payer's adjudication process, from receipt to payment.

**OpenAPI Spec**: Available on developer portal page

---

## 7. Medical Network Attachments Submission API (v1)

### Overview
Enables submission of supporting documentation and attachments for medical claims.

### Key Features
- Submit claim attachments
- Support for various document formats
- Linked to claim submissions

### Endpoints
1. **Health Check**
   - `GET` - Health Check

2. **Attachment Submission**
   - `POST` - Attachment Submission

### Use Case
Submit medical records, lab results, imaging, and other supporting documentation required for claim adjudication.

**OpenAPI Spec**: Available on developer portal page

---

## 8. Medical Network Attachment Status API (v1)

### Overview
Tracks the status of submitted attachments and supporting documentation.

### Key Features
- Status tracking by trace ID
- Metadata-based status retrieval
- Attachment processing verification

### Endpoints
1. **Health Check**
   - `GET` - Health Check

2. **Attachment Status**
   - `GET` - Retrieve attachment status based on traceId
   - `POST` - Retrieve attachment status based on metadata

### Use Case
Monitor the processing status of submitted attachments to ensure they've been received and associated with the correct claims.

**OpenAPI Spec**: Available on developer portal page

---

## 9. Medical Network Attachment Retrieval API (v1)

### Overview
Retrieves attachment documents and supporting documentation from payers or clearinghouses.

### Key Features
- Document search capabilities
- Document download by ID
- Retrieve requested documentation

### Endpoints
1. **Health Check**
   - `GET` - Health Check

2. **Attachment Document**
   - `POST` - Search for documents
   - `GET` - Download a document for the given documentId

### Use Case
Retrieve attachments requested by payers or retrieve previously submitted documentation.

**OpenAPI Spec**: Available on developer portal page

---

## 10. Dental Attachments API

### Overview
Specialized API for managing dental claim attachments with container-based architecture.

### Key Features
- Container-based attachment management
- Multi-file support per container
- Payer participation verification
- Payer-specific business rules

### Endpoints
1. **Attachments**
   - `POST` - Create Attachments Container
   - `POST` - Add Attachments Files
   - `PUT` - Update Attachments to Container
   - `PATCH` - Commits Attachments Container and Files
   - `GET` - Gets Attachments Container
   - `GET` - Get Attachments Files from Container
   - `DELETE` - Delete Attachments File
   - `GET` - Get Participating Payers
   - `GET` - Check Participating Payer by Payer ID
   - `GET` - Get Payer Business Rule

### Use Case
Manage dental claim attachments including x-rays, narratives, and other dental-specific documentation with payer-specific requirements.

**OpenAPI Spec**: Available on developer portal page

---

## 11. Medical Network Payer List API (v1)

### Overview
Provides programmatic access to up-to-date payer list data to eliminate manual processes and enable smarter transaction workflows.

### Key Features
- Current payer information
- Payer field definitions
- Exportable payer lists
- Automated payer data updates

### Endpoints
1. **PayerList**
   - `GET` - Health Check
   - `GET` - Get Payers
   - `GET` - Export PayerList
   - `GET` - Get Fields

### Use Case
Maintain current payer information for eligibility checks, claims submission, and other transactions. Eliminate manual payer list maintenance.

**OpenAPI Spec**: Available on developer portal page

---

## 12. Prior Authorization API (v1)

### Overview
Handles prior authorization inquiries and submissions using standard EDI X12 278 transactions formatted in JSON for HTTP requests.

### Key Features
- Prior authorization inquiry (278x215)
- Prior authorization submission (278x217)
- Support for both JSON and X12 EDI formats
- OAuth 2.0 authentication

### Endpoints
1. **Authentication**
   - `POST` - Get Token

2. **Health Check**
   - `GET` - Service Heartbeat

3. **Inquiry**
   - `POST` - 278x215 Prior Authorization Inquiry
   - `POST` - JSON Prior Authorization Inquiry

4. **Submission**
   - `POST` - 278x217 Prior Authorization Submission
   - `POST` - JSON Prior Authorization Submission

### Use Case
Request and submit prior authorizations for medical services, procedures, and medications that require payer approval before services are rendered.

**OpenAPI Spec**: Available on developer portal page

---

## Additional APIs Referenced

### Security and Authorization API (v3)
Standard security API used to request access tokens for authenticating to other APIs on the platform using OAuth 2.0.

---

## API Access Notes

### Authentication
Most APIs require OAuth 2.0 authentication with client credentials or other grant types. Access tokens are obtained through the Security and Authorization API.

### Sandbox Access
Optum provides sandbox environments for testing. Access must be requested through the developer portal.

### OpenAPI Specifications
All OpenAPI specifications are available for download on each API's overview page in the developer portal. Access requires:
1. Registration on the Optum Developer Portal
2. Appropriate permissions/subscriptions for each API
3. Navigation to the specific API's reference page
4. Clicking "Download OpenAPI Spec" link

### Standard Features Across APIs
- **Health Check Endpoints**: All APIs provide health check/heartbeat endpoints
- **JSON and EDI Support**: Most claims and eligibility APIs support both modern JSON and legacy X12 EDI formats
- **Real-Time Processing**: APIs process transactions in real-time
- **Error Handling**: Comprehensive error responses with validation details

---

## API Categories

### Eligibility & Coverage
- Enhanced Eligibility API (v1)
- Medical Network Eligibility API (v3)

### Claims Submission
- Medical Network Professional Claims API (v3)
- Medical Network Institutional Claims API (v1)

### Claims Management
- Medical Network Claims Responses and Reports API (v2)
- Medical Network Claim Status API (v2)

### Attachments
- Medical Network Attachments Submission API (v1)
- Medical Network Attachment Status API (v1)
- Medical Network Attachment Retrieval API (v1)
- Dental Attachments API

### Supporting Services
- Medical Network Payer List API (v1)
- Prior Authorization API (v1)
- Security and Authorization API (v3)

---

## Transaction Flow Example

### Typical Prior to Service Workflow
1. **Verify Eligibility**: Use Enhanced Eligibility or Medical Network Eligibility API
2. **Check Prior Auth Requirements**: Query payer rules
3. **Submit Prior Authorization**: Use Prior Authorization API if required
4. **Render Service**: After approval/verification

### Typical Post-Service Workflow
1. **Validate Claim**: Use Professional or Institutional Claims API validation endpoint
2. **Submit Claim**: Use claims submission endpoint
3. **Attach Documentation**: Use Attachments Submission API if needed
4. **Check Status**: Use Claim Status API to track
5. **Retrieve Reports**: Use Claims Responses and Reports API for 835/277 data

---

## Developer Resources

- **Portal**: https://developer.optum.com/
- **Marketplace**: https://marketplace.optum.com/
- **Community**: Available through developer portal
- **Release Notes**: Available for each API on their respective pages
- **FAQs**: Comprehensive FAQs for each API

---

## Notes on EDI to JSON Conversion

Optum's APIs provide a modern JSON interface to traditionally EDI-based healthcare transactions:

- **270/271**: Eligibility Inquiry/Response
- **276/277**: Claim Status Inquiry/Response  
- **278**: Prior Authorization
- **835**: Payment/Remittance Advice
- **837i**: Institutional Claims
- **837p**: Professional Claims

This allows developers to work with familiar JSON/REST patterns rather than complex EDI formats while maintaining full compliance with healthcare standards.

