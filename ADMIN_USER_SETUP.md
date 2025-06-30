# 🚨 URGENT: Create Admin User for Production

## 🎯 **The Problem:**

The admin user doesn't exist in the production database, causing login to fail.

## ✅ **Quick Solution:**

### **Step 1: Register a temporary admin account**

1. **Go to**: https://wondrous-souffle-ff83f7.netlify.app/register
2. **Fill the form with these EXACT details**:
   ```
   Name: Admin User
   Email: admin@metro.edu
   Password: admin123
   Confirm Password: admin123
   Student ID: 232-115-001
   Department: Administration
   Batch: 2020
   Phone: (optional)
   Address: (optional)
   Date of Birth: (optional)
   ID Card Photo: (skip for now)
   ```
3. **Submit the registration**
4. **You'll see**: "Registration submitted successfully. Please wait for admin approval."

### **Step 2: Manually approve via database or API**

Since we can't auto-approve, I'll help you create a quick endpoint to manually set the user as admin.

### **Step 3: Alternative - Use a temporary super-admin endpoint**

Let me create an emergency endpoint that bypasses validation...

---

## 🔧 **Alternative: Quick Database Fix**

If you have access to your MongoDB Atlas dashboard:

1. **Go to**: MongoDB Atlas → Clusters → Browse Collections
2. **Find**: `metriuni` database → `users` collection
3. **Find the user** with email `admin@metro.edu`
4. **Edit the document** and change:
   ```json
   {
     "role": "admin",
     "status": "approved"
   }
   ```

---

## 🚀 **Try this first:**

Register the account manually through the UI with the exact details above, then I'll help you approve it via API.
