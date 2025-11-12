# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Start the Backend (Docker)

```bash
# From the project root
docker-compose up -d
```

The backend will be running at `http://localhost:3001`

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will be running at `http://localhost:5173`

### 3. Open Your Browser

Navigate to: **http://localhost:5173**

### 4. Enter API Credentials

You have two options:

**Option A: Use Environment Variables**
- Create a `.env` file in the project root:
  ```env
  OPTUM_CLIENT_ID=your_client_id
  OPTUM_CLIENT_SECRET=your_client_secret
  ```
- Restart the backend: `docker-compose restart backend`

**Option B: Enter Manually in UI**
- Click "Enter Manually" button
- Input your Optum Client ID and Client Secret
- These will be sent securely to the backend

### 5. Fill Out the Form

**Required Fields:**
- **Payer ID**: e.g., `CIGNA`, `AETNA`, `ANTHM`
- **Provider Name**: e.g., `Example Medical Center`
- **Provider NPI**: 10-digit number, e.g., `1234567890`
- **Member ID**: Patient's insurance member ID
- **First Name**: Patient's first name
- **Last Name**: Patient's last name
- **Date of Birth**: Patient's DOB
- **Gender**: M or F

**Optional Fields:**
- Group Number
- SSN

### 6. Submit

Click "Check Eligibility" and wait for the response!

## Example Test Data

```
Payer ID: CIGNA
Provider Organization: Test Medical Center
Provider NPI: 1234567890
Member ID: W123456789
First Name: John
Last Name: Doe
Date of Birth: 1980-01-02
Gender: Male
Group Number: GRP5000
```

## Troubleshooting

**Backend not responding?**
```bash
# Check if Docker container is running
docker ps

# Check logs
docker-compose logs -f backend
```

**Frontend can't connect?**
```bash
# Verify backend is running
curl http://localhost:3001/api/eligibility/check-eligibility
```

**Need to rebuild?**
```bash
docker-compose down
docker-compose up -d --build
```

## Stopping the Application

```bash
# Stop backend
docker-compose down

# Stop frontend
# Press Ctrl+C in the terminal running the frontend
```

## Next Steps

- Review the full [README.md](./README.md) for detailed documentation
- Check the [plan file](./optum-eligibility.plan.md) for implementation details
- Add more fields as needed for your use case

