## 🚂 QUICK FIX: Set Railway Environment Variables

Your deployment is failing health checks because Railway needs environment variables.

### 🌐 **Method 1: Railway Dashboard (EASIEST)**

1. Go to your Railway project dashboard
2. Click **"Variables"** tab
3. Add these variables one by one:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster
JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform
JWT_EXPIRES_IN=7d
UPLOAD_MAX_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. Click **"Deploy"** to restart with new variables

### 🔧 **Method 2: Railway CLI**

```bash
railway login
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster"
railway variables set JWT_SECRET="production-super-secure-jwt-secret-key-2024-metrouni-platform"
railway redeploy
```

### ✅ **Expected Result:**

- Health checks will pass
- Your app will be live in 2-3 minutes
- URL: `https://your-project.up.railway.app`

**Most likely issue:** Missing MONGODB_URI is preventing proper startup.
