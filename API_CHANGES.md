# API Update - Medical Network Eligibility V3

## ✅ Changes Made

### Switched from Enhanced Eligibility API V1 to Medical Network Eligibility V3

**Old API:**
- Endpoint: `/rcm/eligibility/v1`
- Header: `x-optum-correlation-id`

**New API (Current):**
- Endpoint: `/medicalnetwork/eligibility/v3/`
- Header: `x-chng-trace-id`

## Required Fields Comparison

### Medical Network Eligibility V3 (Current Implementation)

**Schema Required:**
- ✅ `controlNumber` (9 digits)
- ✅ `subscriber` (object)

**Actually Required in Practice:**
- ✅ Payer ID (`tradingPartnerServiceId`)
- ✅ Subscriber Member ID
- ✅ Subscriber First Name
- ✅ Subscriber Last Name
- ✅ Subscriber Date of Birth (YYYYMMDD)
- ✅ Subscriber Gender (M/F)

**Optional Fields:**
- ❌ Provider (entire section is optional!)
  - Organization Name
  - NPI
- Group Number
- SSN

## Key Differences from Enhanced Eligibility API

1. **Provider is OPTIONAL** - Medical Network Eligibility V3 does NOT require provider information
2. **Different endpoint** - `/medicalnetwork/eligibility/v3/` vs `/rcm/eligibility/v1`
3. **Different trace header** - `x-chng-trace-id` vs `x-optum-correlation-id`
4. **Simpler requirements** - Fewer required fields overall

## Current Form Configuration

### Required Fields (red asterisk):
- Payer ID
- Member ID
- First Name
- Last Name
- Date of Birth
- Gender

### Optional Fields (marked as optional):
- Provider Organization Name
- Provider NPI
- Group Number
- SSN

## Environment Switching

✅ **Sandbox Mode** (Default)
- URL: `https://sandbox-apigw.optum.com/medicalnetwork/eligibility/v3/`
- Uses test data
- Safe for development

✅ **Production Mode**
- URL: `https://apigw.optum.com/medicalnetwork/eligibility/v3/`
- Uses live data
- May incur costs
- Shows warning message

## Testing

Now you can test with minimal information:

**Minimal Test:**
```json
{
  "controlNumber": "123456789",
  "tradingPartnerServiceId": "CIGNA",
  "subscriber": {
    "memberId": "W123456789",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "19800102",
    "gender": "M"
  }
}
```

No provider information needed!

## Benefits

1. ✅ Simpler API - fewer required fields
2. ✅ Provider optional - can check eligibility without provider details
3. ✅ Correct endpoint for Medical Network Eligibility
4. ✅ Works with Change Healthcare infrastructure

