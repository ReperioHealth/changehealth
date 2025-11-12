# Optum Enhanced Eligibility Checker

A full-stack application for checking patient eligibility using Optum's Enhanced Eligibility API.

## Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- Docker + Docker Compose
- OAuth2 authentication
- Token caching

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- Fetch API

## Project Structure

```
changehealth/
├── backend/
│   ├── src/
│   │   ├── server.ts           # Express server
│   │   ├── routes/
│   │   │   └── eligibility.ts  # Eligibility API routes
│   │   └── services/
│   │       └── optum.ts        # Optum API service with OAuth2
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── CredentialsForm.tsx
│   │   │   ├── EligibilityForm.tsx
│   │   │   └── ResponseDisplay.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── eligibility.ts
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Features

- ✅ OAuth2 authentication with automatic token caching
- ✅ API credentials can be entered in UI or set via environment variables
- ✅ Basic eligibility check with required fields
- ✅ Real-time eligibility verification
- ✅ Full API response display
- ✅ Dockerized backend for easy deployment
- ✅ Clean, responsive UI with Tailwind CSS

## Setup

### Prerequisites

- Node.js 18+ (for local development)
- Docker & Docker Compose (for backend)
- Optum API credentials (Client ID and Client Secret)

### Backend Setup (with Docker)

1. Create `.env` file in project root (optional):
```bash
OPTUM_CLIENT_ID=your_client_id_here
OPTUM_CLIENT_SECRET=your_client_secret_here
```

2. Start backend with Docker Compose:
```bash
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f backend
```

Stop backend:
```bash
docker-compose down
```

Rebuild after changes:
```bash
docker-compose up -d --build
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```bash
VITE_API_BASE_URL=http://localhost:3001
```

4. Start development server:
```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

## Usage

1. **Start the backend** (Docker Compose)
2. **Start the frontend** (npm run dev)
3. **Open browser** to http://localhost:5173
4. **Enter API credentials** (optional - can use environment variables)
5. **Fill in eligibility form**:
   - Payer ID (e.g., CIGNA, AETNA)
   - Provider information (name, NPI)
   - Patient information (member ID, name, DOB, gender)
   - Optional: Group number, SSN
6. **Submit** to check eligibility
7. **View response** with eligibility status and details

## API Credentials

You can provide Optum API credentials in two ways:

### Option 1: Environment Variables (Recommended for Development)
Set in root `.env` file or in `docker-compose.yml`:
```env
OPTUM_CLIENT_ID=your_client_id
OPTUM_CLIENT_SECRET=your_client_secret
```

### Option 2: UI Form (Recommended for Testing)
Click "Enter Manually" in the API Credentials section and input your credentials directly in the UI. These are sent to the backend for OAuth2 token exchange and not stored.

## Required Fields

**Minimum required fields for eligibility check:**
- Control Number (auto-generated)
- Trading Partner Service ID / Payer ID
- Provider Organization Name
- Provider NPI
- Subscriber Member ID
- Subscriber First Name
- Subscriber Last Name
- Subscriber Date of Birth
- Subscriber Gender

**Optional but recommended:**
- Group Number
- SSN

## API Endpoints

### Backend

**POST** `/api/eligibility/check-eligibility`

Request body:
```json
{
  "credentials": {
    "clientId": "your_client_id",
    "clientSecret": "your_client_secret"
  },
  "eligibilityData": {
    "controlNumber": "123456789",
    "tradingPartnerServiceId": "CIGNA",
    "provider": {
      "organizationName": "Example Medical Center",
      "npi": "1234567890"
    },
    "subscriber": {
      "memberId": "W123456789",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "19800102",
      "gender": "M",
      "groupNumber": "GRP5000"
    }
  }
}
```

## Development

### Backend (without Docker)

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

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
```

## Environment Variables

### Backend

- `PORT` - Server port (default: 3001)
- `OPTUM_CLIENT_ID` - Optum API client ID (optional if provided in request)
- `OPTUM_CLIENT_SECRET` - Optum API client secret (optional if provided in request)

### Frontend

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:3001)

## Troubleshooting

### Backend not starting
- Check Docker is running: `docker ps`
- Check logs: `docker-compose logs backend`
- Verify port 3001 is not in use

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:3001/api/eligibility/check-eligibility`
- Check CORS settings in backend
- Verify `VITE_API_BASE_URL` in frontend `.env`

### OAuth2 errors
- Verify API credentials are correct
- Check Optum sandbox access is enabled
- Review token expiration (cached for ~1 hour)

## Next Steps

To extend this application, you can add:
- Address fields for subscriber
- Dependents array (for family eligibility checks)
- Encounter section with service type codes
- Benefits table display with formatted data
- Form validation with detailed error messages
- Response history and caching
- Export to PDF/CSV functionality

## License

ISC

