# Current Application Status

## ✅ Application Running

### Backend
- **Status:** Running in Docker container
- **Port:** 3001
- **Environment:** **PRODUCTION** (https://apigw.optum.com)
- **Container:** changehealth-backend-1
- **Logs:** `docker-compose logs -f backend`

### Frontend  
- **Status:** Running via Vite dev server
- **Port:** 5173
- **URL:** http://localhost:5173
- **Process:** Node.js Vite
- **Logs:** `/tmp/vite.log`

## Current Configuration

### Environment Setup

**Production URLs (ACTIVE):**
- Token endpoint: `https://apigw.optum.com/apip/auth/v2/token`
- Eligibility endpoint: `https://apigw.optum.com/rcm/eligibility/v1`

**To switch to Sandbox:**
Set environment variable `OPTUM_ENV=sandbox` in `.env` file or docker-compose.yml

### API Credentials

Can be provided via:
1. **UI Form** - Click "Enter Manually" in the browser
2. **Environment Variables** - Create `.env` file with:
   ```env
   OPTUM_CLIENT_ID=your_production_client_id
   OPTUM_CLIENT_SECRET=your_production_client_secret
   OPTUM_ENV=production
   ```

## Testing the Application

### 1. View in Browser
Already open at: http://localhost:5173

### 2. Enter Credentials
Click "Enter Manually" and provide your **production** Optum API credentials

### 3. Fill Form
- Payer ID: e.g., CIGNA, AETNA, ANTHM
- Provider Name: Your organization name
- Provider NPI: 10-digit NPI
- Patient Member ID: Real member ID
- Patient demographics: First name, last name, DOB, gender
- Optional: Group number, SSN

### 4. Submit
Click "Check Eligibility" to get real-time production eligibility data

## Important Notes

⚠️ **You are now using PRODUCTION endpoints** which:
- Use live/real data (not test data)
- May incur costs per transaction
- Require production API credentials (not sandbox credentials)
- Connect to actual payer systems

✅ **Production is appropriate when:**
- You have production API credentials
- You want real eligibility data
- You're ready for live testing with real patients

🔄 **To switch back to Sandbox:**
```bash
# Option 1: Environment variable in root .env file
OPTUM_ENV=sandbox

# Then restart backend
docker-compose restart backend
```

## Monitoring

### Check Backend Logs
```bash
docker-compose logs -f backend
```

### Check Frontend Logs  
```bash
tail -f /tmp/vite.log
```

### Verify Backend Health
```bash
curl http://localhost:3001/api/eligibility/check-eligibility
```

## Quick Commands

**Stop everything:**
```bash
docker-compose down
pkill -f "node.*vite"
```

**Restart backend:**
```bash
docker-compose restart backend
```

**Restart frontend:**
```bash
pkill -f "node.*vite"
cd frontend && npm run dev
```

