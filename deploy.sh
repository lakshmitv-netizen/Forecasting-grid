#!/bin/bash

# Heroku Deployment Script for Forecasting Grid

echo "🚀 Deploying Forecasting Grid to Heroku..."

# Check if logged in
if ! heroku auth:whoami &>/dev/null; then
    echo "❌ Not logged in to Heroku. Please run: heroku login"
    exit 1
fi

# Create Heroku app (if it doesn't exist)
APP_NAME="forecasting-grid-prototype"
if ! heroku apps:info $APP_NAME &>/dev/null; then
    echo "📦 Creating Heroku app: $APP_NAME"
    heroku create $APP_NAME
else
    echo "✅ App $APP_NAME already exists"
fi

# Add Heroku remote if not exists
if ! git remote | grep -q heroku; then
    echo "🔗 Adding Heroku remote..."
    heroku git:remote -a $APP_NAME
fi

# Deploy
echo "📤 Deploying to Heroku..."
git push heroku main || git push heroku master

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is available at: https://$APP_NAME.herokuapp.com"
echo ""
echo "To open the app, run: heroku open -a $APP_NAME"

