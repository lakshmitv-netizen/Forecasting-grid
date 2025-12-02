#!/bin/bash

echo "🚀 Deploying Forecasting Grid to Heroku..."
echo ""

# Check if logged in
if ! heroku auth:whoami &>/dev/null; then
    echo "📝 Please login to Heroku..."
    heroku login
fi

# Add remote if it doesn't exist
if ! git remote | grep -q heroku; then
    echo "🔗 Adding Heroku remote..."
    heroku git:remote -a forecasting-grid-prototype || {
        echo "Creating app..."
        heroku create forecasting-grid-prototype
        heroku git:remote -a forecasting-grid-prototype
    }
fi

# Deploy
echo "📤 Deploying to Heroku..."
git push heroku main

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app: https://forecasting-grid-prototype.herokuapp.com"
echo ""
echo "To view logs: heroku logs --tail -a forecasting-grid-prototype"

