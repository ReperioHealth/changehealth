# ChangeHealth - Professional Claims & Eligibility Platform

A full-stack healthcare claims management application with integrated eligibility verification, CMS 1500 claim form submission, and real-time claims processing using the Optum Medical Network APIs.

## 🏥 Features

### ✅ Eligibility Checker
- Real-time patient insurance eligibility verification
- Comprehensive eligibility response display with benefits information
- Payer lookup and directory search
- Sandbox and production environment support
- OAuth2 authentication with automatic token caching

### 📋 Professional Claims (CMS 1500)
- Complete CMS 1500 claim form implementation
- Support for up to 50 service lines per claim
- Automatic total charge calculation
- Claim validation and submission to Optum API
- Multiple diagnosis codes (up to 12 ICD-10 codes)
- Service line details with CPT/HCPCS codes, modifiers, and diagnosis pointers
- Signature on file checkboxes for regulatory compliance

### 🔄 Claims Status (Coming Soon)
- Real-time claim status tracking
- Claims history and search

### 📊 Claims Reconciliation (Coming Soon)
- Payment reconciliation
- ERA processing

## 🎨 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Reperio Health brand colors (Purple: #9e32e2, Blue: #2a5cb2)
- Poppins font family

**Backend:**
- Node.js 18+ + Express
- TypeScript
- Docker + Docker Compose
- OAuth2 authentication with token caching
- RESTful API architecture

**APIs Integrated:**
- Optum Medical Network Enhanced Eligibility V3
- Optum Medical Network Professional Claims V3
- Optum Payer Lookup & Directory

## 📁 Project Structure

```
changehealth/
├── backend/
│   ├── src/
│   │   ├── server.ts                 # Express server (port 3002)
│   │   ├── routes/
│   │   │   ├── eligibility.ts        # Eligibility API routes
│   │   │   ├── payer.ts              # Payer lookup routes
│   │   │   └── claims.ts             # Claims validation/submission routes
│   │   └── services/
│   │       ├── optum.ts              # Optum API service with OAuth2
│   │       ├── pdfGenerator.ts       # CMS 1500 PDF generation
│   │       └── types.ts              # TypeScript type definitions
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Main app with tab navigation
│   │   ├── components/
│   │   │   ├── CredentialsForm.tsx   # API credentials input
│   │   │   ├── EligibilityForm.tsx   # Patient eligibility form
│   │   │   ├── EligibilityDetails.tsx # Detailed eligibility response
│   │   │   ├── ClaimForm.tsx         # CMS 1500 claim form
│   │   │   ├── ClaimResponseDisplay.tsx # Claim validation/submission results
│   │   │   ├── TabNavigation.tsx     # Tab navigation component
│   │   │   └── EnvironmentSelector.tsx # Sandbox/Production toggle
│   │   ├── services/
│   │   │   ├── api.ts                # Eligibility API service
│   │   │   ├── claimsApi.ts          # Claims API service
│   │   │   └── payerApi.ts           # Payer lookup service
│   │   └── types/
│   │       ├── eligibility.ts        # Eligibility type definitions
│   │       └── claims.ts             # Claims type definitions
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── API_Requirements_Analysis.md      # Complete API requirements documentation
├── CMS1500_API_Field_Mapping.md      # Field-by-field API mapping guide
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (for local development)
- **Docker & Docker Compose** (for backend deployment)
- **Optum API credentials** (Client ID and Client Secret)
  - Sandbox credentials for testing
  - Production credentials for live claims

### 1. Backend Setup (Docker)

Create `.env` file in project root (optional):
```bash
OPTUM_CLIENT_ID=your_sandbox_client_id
OPTUM_CLIENT_SECRET=your_sandbox_client_secret
```

Start backend:
```bash
docker-compose up -d
```

Backend will be available at: **http://localhost:3002**

Useful Docker commands:
```bash
# View logs
docker-compose logs -f backend

# Stop backend
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: **http://localhost:5173**

### 3. Access the Application

Open your browser to **http://localhost:5173** and:
1. Select **Sandbox** or **Production** environment
2. Enter your Optum API credentials (or use environment variables)
3. Choose a tab:
   - **Eligibility Checker** - Verify patient insurance coverage
   - **Claim Form** - Submit CMS 1500 professional claims
   - **Claims Status** - Track claim processing (coming soon)
   - **Claims Reconciliation** - Manage payments (coming soon)

## 📋 Using the Eligibility Checker

### Required Fields
- **Trading Partner Service ID** - Payer identifier (e.g., UHC, CIGNA, AETNA)
- **Provider NPI** - National Provider Identifier
- **Provider Organization Name**
- **Member ID** - Patient's insurance member ID
- **Patient Name** - First and last name
- **Date of Birth** - Format: YYYY-MM-DD
- **Gender** - M (Male), F (Female), or U (Unknown)

### Optional Fields
- Group Number
- SSN

### Features
- **Payer Lookup** - Search payers by ID or name
- **Payer Directory** - Browse all available payers
- **Comprehensive Results** - View coverage details, copays, deductibles, benefit information
- **Preventive Care Filtering** - Highlights preventive care and annual wellness benefits

## 📄 Using the Claim Form (CMS 1500)

### Form Organization

The claim form follows the CMS 1500 Professional Claim format with these key sections:

#### Patient & Insured Information (Boxes 1-11)
- **Box 1**: Insurance type (Medicare, Medicaid, TRICARE, etc.)
- **Box 1a**: Insured's ID Number
- **Boxes 2-5**: Patient demographics and address
- **Box 6**: Patient relationship to insured (Self, Spouse, Child)
- **Boxes 4, 7**: Insured's name and address (auto-fills if relationship is "Self")
- **Boxes 9-9d**: Other insurance information (for secondary payers)
- **Boxes 11-11d**: Primary insurance policy details

#### Signatures & Dates (Boxes 12-13)
- **Box 12**: Patient signature on file (checkbox)
- **Box 13**: Insured's signature on file (checkbox)
- Both pre-checked by default

#### Condition & Treatment Information (Boxes 14-23)
- **Box 14**: Date of current illness/injury
- **Box 15-18**: Related dates (disability, hospitalization)
- **Box 10**: Employment/accident relation
- **Box 17-17b**: Referring provider information
- **Box 19**: Additional claim information
- **Box 20**: Outside lab charges
- **Box 21**: Diagnosis codes (ICD-10) - Up to 12 codes (A-L)
- **Box 22**: Resubmission code (Original/Replacement/Void)
- **Box 23**: Prior authorization number

#### Service Lines (Box 24)
Add up to 50 service lines with:
- **24A**: From/To dates (date picker)
- **24B**: Place of service code (default: 10)
- **24C**: EMG - Emergency indicator (checkbox)
- **24D**: CPT/HCPCS procedure code + modifier (dropdown)
- **24E**: Diagnosis pointer (dropdown showing A-L with actual diagnosis codes)
- **24F**: Charges (USD, auto-formatted)
- **24G**: Days/Units
- **24H**: EPSDT (Early Periodic Screening)
- **24I**: ID Qualifier (NPI - preselected)
- **24J**: Rendering provider NPI

#### Charge Summary (Boxes 25-29)
- **Box 25**: Federal Tax ID (EIN with dropdown selection)
- **Box 26**: Patient account number
- **Box 27**: Accept assignment (YES/NO)
- **Box 28**: **Total charge** (auto-calculated from service lines) - READ-ONLY
- **Box 29**: Amount paid by patient

#### Provider Information (Boxes 31-33)
- **Box 31**: Physician signature on file (checkbox)
- **Box 32**: Service facility location and NPI
- **Box 33**: Billing provider name, address, phone, and NPI

### Form Features

✅ **Auto-population**:
- Box 1: "Other" pre-selected
- Box 12, 13, 31: "Signature on file" pre-checked
- Box 20: "No" (outside lab) pre-checked
- Box 24B: Place of service "10" for all lines
- Box 25: EIN pre-checked with dropdown
- Box 28: Auto-calculated from service lines

✅ **Smart Fields**:
- If "Self" selected in Box 6, patient info auto-fills insured fields (Boxes 4, 7)
- Auto-format phone numbers (XXX-XXX-XXXX)
- Auto-format currency fields (right-to-left with decimals)
- State dropdowns for all address fields
- SSN/EIN validation and formatting

✅ **Conditional Logic**:
- Box 9 fields disabled if "No other health benefit plan" (Box 11d)
- Auto accident state field enabled only if accident = YES (Box 10b)
- Outside lab charges enabled only if outside lab = YES (Box 20)

✅ **Dynamic Diagnosis Pointers**:
- Box 24E dropdown shows diagnosis letters with actual codes from Box 21
- Example: "A (E11.9)" shows both pointer and diagnosis

✅ **Tooltips**:
- Hover over ⓘ icons in Box 24 for field descriptions

### Actions

1. **Validate Claim** - Check claim data against API requirements without submitting
2. **Submit Claim** - Submit claim to insurance payer for processing
3. **Generate PDF** - Create downloadable CMS 1500 PDF with form data

### Sandbox Test Data

When in **Sandbox mode**, the form can use test data for validation:
- Trading Partner Service ID: `00001`
- Test member IDs and NPIs provided in Optum sandbox documentation

## 🔑 API Credentials

### Option 1: Environment Variables (Recommended)
Set in root `.env` file:
```env
OPTUM_CLIENT_ID=your_client_id
OPTUM_CLIENT_SECRET=your_client_secret
```

### Option 2: UI Form
- Click "Enter Manually" in the credentials section
- Input credentials directly in the UI
- Credentials are used for OAuth2 token exchange (not stored)
- Separate credentials for Eligibility and Payer Lookup APIs

## 📡 API Endpoints

### Backend (Port 3002)

#### Eligibility
- **POST** `/api/eligibility/check-eligibility` - Check patient eligibility
- **POST** `/api/eligibility/list-payers` - Get all available payers
- **POST** `/api/eligibility/lookup-payer` - Lookup specific payer details

#### Claims
- **POST** `/api/claims/validate` - Validate claim data
- **POST** `/api/claims/submit` - Submit claim for processing
- **POST** `/api/claims/generate-pdf` - Generate CMS 1500 PDF

## 📚 Documentation

### API Requirements & Field Mapping

Two comprehensive documents are included to help understand the API integration:

#### 1. **API_Requirements_Analysis.md**
Complete analysis of what the Professional Claims V3 API requires:
- ✅ All required fields with "Required" column
- ✅ CMS 1500 box numbers for each field
- ✅ Missing critical fields identification
- ✅ Optional but recommended fields
- ✅ Implementation priority guide

**Key Findings**:
- 3 critical missing required fields (Submitter, Receiver, Box 22 connection)
- Fields that exist but aren't connected to API
- Fields on form that aren't in API

#### 2. **CMS1500_API_Field_Mapping.md**
Field-by-field mapping between CMS 1500 form and API:
- ✅ Comprehensive mapping tables
- ✅ Data transformation notes (dates, currency, phones)
- ✅ X12 EDI segment references
- ✅ Valid values for coded fields
- ✅ Discrepancies between form and API

## 🛠️ Development

### Backend (without Docker)

```bash
cd backend
npm install
npm run dev
```

Backend runs on **port 3002**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **port 5173**

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Outputs to frontend/dist/
```

## ⚙️ Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Backend server port |
| `OPTUM_CLIENT_ID` | - | Optum API client ID (optional) |
| `OPTUM_CLIENT_SECRET` | - | Optum API client secret (optional) |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3002` | Backend API URL |

## 🐛 Troubleshooting

### Backend Issues

**Port 3002 in use:**
```bash
# Check what's using the port
lsof -i :3002
# Change port in backend/src/server.ts or set PORT env var
```

**Docker container not starting:**
```bash
# Check Docker status
docker ps -a
# View logs
docker-compose logs backend
# Restart
docker-compose restart backend
```

### Frontend Issues

**Can't connect to backend:**
- Verify backend is running: `curl http://localhost:3002`
- Check `VITE_API_BASE_URL` in frontend `.env`
- Check browser console for CORS errors

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Issues

**OAuth2 token errors:**
- Verify credentials are correct for the selected environment
- Check Optum sandbox/production access is enabled
- Token cached for ~1 hour, may need to wait or clear cache

**Validation errors:**
- Check API_Requirements_Analysis.md for required fields
- Ensure date formats are CCYYMMDD (8 digits)
- Verify NPI is 10 digits
- Check diagnosis codes are valid ICD-10 codes

**"Failed to fetch" errors:**
- Backend may not be running (start with `docker-compose up -d`)
- Check network connectivity
- Verify API endpoints are accessible

## 🔮 Roadmap

### Immediate Priority
- [ ] Add Submitter information fields (required by API, not on CMS 1500)
- [ ] Add Receiver/Payer name field (required by API)
- [ ] Connect Box 22 (Resubmission Code) to API
- [ ] Add Provider Type selector (Organization vs Person)

### Near Term
- [ ] Implement Claims Status tab
- [ ] Implement Claims Reconciliation tab
- [ ] Add date fields (Boxes 14-18) connection to API
- [ ] Add Referring Provider fields (Box 17)
- [ ] Add Prior Authorization field (Box 23) connection

### Future Enhancements
- [ ] Secondary insurance (Boxes 9-9d) full implementation
- [ ] Claims history and search
- [ ] Bulk claim submission
- [ ] ERA (Electronic Remittance Advice) processing
- [ ] PDF claim form download improvements
- [ ] Real-time claim status updates
- [ ] Payment reconciliation tools
- [ ] Reports and analytics

## 📄 License

ISC

## 🤝 Contributing

This is a Reperio Health internal project. For questions or issues, contact the development team.

---

**Built with ❤️ by Reperio Health**
