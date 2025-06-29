# 🚀 Backend CORS Fix Deployment Guide

## What was fixed

✅ **Fixed CORS Configuration Bug**: The wildcard matching logic in `backend/middleware/security.js` was broken. Updated to properly handle patterns like `https://*.netlify.app`.

## Deployment Options

### Option 1: Railway CLI (Recommended if working)

1. **Login to Railway** (try again):
   ```bash
   railway login
   ```
   
2. **Deploy directly**:
   ```bash
   cd /Users/avishekchandradas/Desktop/MetroUni
   railway up --dockerfile Dockerfile.backend
   ```

### Option 2: Git Push to Railway (Alternative)

1. **Check your git status**:
   ```bash
   git status
   git add .
   git commit -m "Fix CORS wildcard matching logic"
   ```

2. **Push to trigger Railway deployment**:
   ```bash
   git push origin main
   ```

### Option 3: Railway Dashboard (Manual)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Find your MetroUni project
3. Go to your backend service
4. Click "Deploy" → "Redeploy"
5. Or connect your GitHub repo and trigger a new deployment

## After Deployment

### 1. Verify Environment Variables

Make sure these are set in Railway dashboard:

```
ALLOWED_ORIGINS=https://wondrous-souffle-ff83f7.netlify.app,http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=3000
```

### 2. Test the Backend

```bash
# Test health endpoint
curl https://your-railway-backend.railway.app/api/health

# Should return: {"status":"OK","timestamp":"...","environment":"production"}
```

### 3. Test CORS Fix

Open the CORS test file:
```bash
open /Users/avishekchandradas/Desktop/MetroUni/test-cors.html
```

Or test via browser console on your Netlify frontend:
```javascript
fetch('https://your-railway-backend.railway.app/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('✅ CORS working:', data))
.catch(error => console.error('❌ CORS failed:', error));
```

## Expected Results

- ✅ No more 500 errors on OPTIONS requests
- ✅ Proper CORS headers returned
- ✅ Frontend can successfully make API calls
- ✅ Login and other authenticated requests work

## Next Steps

Once CORS is working:

1. **Test full authentication flow** from Netlify frontend
2. **Remove debug logging** from CORS middleware (optional)
3. **Tighten CORS origins** to only include production domains (remove wildcards if not needed)

## Rollback Plan

If issues persist, you can temporarily allow all origins for debugging:

```javascript
// In backend/middleware/security.js - TEMPORARY DEBUG ONLY
origin: true, // Allow all origins - REMOVE IN PRODUCTION
```

But this should NOT be needed with the current fix.
