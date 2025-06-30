# 🚀 MetroUni Frontend Deployment Guide

## 🎯 **Option 1: Deploy to Vercel (Recommended)**

### **Quick Deployment:**

```bash
./deploy-frontend-vercel.sh
```

### **Manual Steps:**

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend:**

   ```bash
   cd frontend
   ```

3. **Login to Vercel:**

   ```bash
   vercel login
   ```

4. **Deploy:**

   ```bash
   vercel --prod
   ```

5. **Set Environment Variables in Vercel Dashboard:**
   - `VITE_API_URL`: `https://web-production-7bab5.up.railway.app`
   - `VITE_SOCKET_URL`: `https://web-production-7bab5.up.railway.app`
   - `VITE_APP_NAME`: `MetroUni`

---

## 🎯 **Option 2: Deploy to Netlify**

1. **Build the frontend:**

   ```bash
   cd frontend && npm run build
   ```

2. **Go to Netlify:**
   - Visit netlify.com
   - Drag and drop the `dist` folder
   - Set environment variables in site settings

---

## 🎯 **Option 3: Deploy to GitHub Pages**

1. **Install gh-pages:**

   ```bash
   cd frontend && npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts:**

   ```json
   "deploy": "gh-pages -d dist"
   ```

3. **Build and deploy:**
   ```bash
   npm run build && npm run deploy
   ```

---

## ✅ **After Deployment:**

Your complete MetroUni platform will have:

- **Frontend**: Your chosen hosting platform
- **Backend API**: Railway (https://web-production-7bab5.up.railway.app)
- **Database**: MongoDB Atlas

## 🔗 **Update CORS Settings:**

After getting your frontend URL, update the backend CORS settings in Railway:

- Add your frontend URL to `ALLOWED_ORIGINS` environment variable
- Example: `https://your-app.vercel.app,http://localhost:5173`

## 🎉 **Your MetroUni Platform Will Be Complete!**
