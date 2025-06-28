#!/bin/bash

# MongoDB Atlas Troubleshooting & Fix Helper

echo "🔧 MongoDB Atlas Connection Troubleshooting"
echo "============================================="
echo ""

echo "Your cluster appears to be: metrouni-cluster.dtqxnr1.mongodb.net"
echo "Username is set to: metrouni_admin"
echo ""

echo "Let's troubleshoot the connection issue:"
echo ""

echo "1. Atlas Dashboard Check:"
echo "   • Go to https://cloud.mongodb.com"
echo "   • Check if your cluster shows 'Connected' status"
echo "   • If it's still 'Creating', wait 2-3 more minutes"
echo ""

echo "2. Database User Check:"
echo "   • Go to 'Database Access' → find 'metrouni_admin'"
echo "   • If user doesn't exist, create it with 'Read and write to any database' privileges"
echo "   • Note the password you set (or reset it if forgotten)"
echo ""

echo "3. Network Access Check:"
echo "   • Go to 'Network Access'"
echo "   • Ensure 0.0.0.0/0 is listed and 'Active'"
echo "   • If not, add it: 'Add IP Address' → 'Allow Access from Anywhere'"
echo ""

echo "4. Once verified, let's update your password:"
echo ""

read -p "Do you have the correct password for metrouni_admin user? (y/n): " HAS_PASSWORD

if [[ $HAS_PASSWORD == "y" || $HAS_PASSWORD == "Y" ]]; then
    echo ""
    echo "Great! Let's update the connection string with the correct password:"
    echo ""
    read -s -p "Enter the correct password for metrouni_admin: " CORRECT_PASSWORD
    echo ""
    
    # Update password in connection string
    ENV_FILE="/Users/avishekchandradas/Desktop/MetroUni/backend/.env.production"
    sed -i.bak "s/<db_password>/$CORRECT_PASSWORD/g" "$ENV_FILE"
    
    echo "✅ Password updated in configuration"
    echo ""
    
    # Test connection again
    echo "🧪 Testing connection with correct password..."
    
    cd "/Users/avishekchandradas/Desktop/MetroUni/backend"
    
    node -e "
    require('dotenv').config({path: '.env.production'});
    const mongoose = require('mongoose');
    
    console.log('🔗 Testing Atlas connection...');
    
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000
    })
    .then(() => {
        console.log('✅ SUCCESS! MongoDB Atlas connected!');
        console.log('📊 Database:', mongoose.connection.name);
        console.log('');
        console.log('🎉 Your MetroUni platform is ready!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Still failing:', err.message);
        
        if (err.message.includes('authentication failed')) {
            console.log('💡 Password is still incorrect. Double-check in Atlas Database Access.');
        }
        if (err.message.includes('ENOTFOUND')) {
            console.log('💡 Cluster may not be ready yet. Wait 2-3 minutes.');
        }
        if (err.message.includes('IP not authorized')) {
            console.log('💡 Check Network Access settings in Atlas.');
        }
        
        process.exit(1);
    });
    
    setTimeout(() => {
        console.error('❌ Timeout - cluster may not be ready yet');
        process.exit(1);
    }, 20000);
    "
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎯 Perfect! Atlas connection is working!"
        echo ""
        echo "Next steps:"
        echo "1. Seed the production database"
        echo "2. Deploy to production server"
        echo ""
        
        read -p "Would you like to seed the production database now? (y/n): " SEED_DB
        
        if [[ $SEED_DB == "y" || $SEED_DB == "Y" ]]; then
            echo ""
            echo "🌱 Seeding production database..."
            NODE_ENV=production node scripts/seed-mongodb.js
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "🎉 Database seeded successfully!"
                echo ""
                echo "🔐 Admin credentials:"
                echo "   Email: admin@avishekchandradas.me"
                echo "   Password: SecureAdmin2024!"
                echo ""
                echo "🚀 Your MetroUni platform is now ready for production deployment!"
                echo ""
                echo "Next: Run ./deploy-mongo-production.sh to deploy to your server"
            else
                echo "❌ Database seeding failed. Check the error above."
            fi
        fi
    else
        echo ""
        echo "❌ Connection still failing. Please:"
        echo "1. Double-check your Atlas setup"
        echo "2. Verify the password in Atlas Database Access"
        echo "3. Make sure cluster is fully ready"
        echo "4. Run this script again"
    fi
    
else
    echo ""
    echo "No problem! Here's how to get/reset your password:"
    echo ""
    echo "1. Go to https://cloud.mongodb.com"
    echo "2. Navigate to 'Database Access'"
    echo "3. Find your 'metrouni_admin' user"
    echo "4. Click 'Edit' next to the user"
    echo "5. Click 'Edit Password'"
    echo "6. Generate a new password or set your own"
    echo "7. Save the password securely"
    echo "8. Run this script again with the new password"
    echo ""
fi

echo ""
echo "For additional help, check the Atlas documentation or run ./atlas-setup-helper.sh"
