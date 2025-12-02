# Quick Heroku Deployment

## Step 1: Login to Heroku
```bash
heroku login
```
This will open a browser window for you to log in.

## Step 2: Deploy
Run the deployment script:
```bash
./deploy.sh
```

Or manually:
```bash
# Create app (first time only)
heroku create forecasting-grid-prototype

# Deploy
git push heroku main
```

## Step 3: Get Your URL
After deployment, your app will be available at:
**https://forecasting-grid-prototype.herokuapp.com**

You can also run:
```bash
heroku open
```

## Updating the App
After making changes:
```bash
git add .
git commit -m "Your changes"
git push heroku main
```

