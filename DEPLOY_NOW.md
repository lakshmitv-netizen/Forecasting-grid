# Deploy to Heroku - Quick Steps

Since the app already exists at `forecasting-grid-prototype.herokuapp.com`, follow these steps:

## Step 1: Login to Heroku
```bash
heroku login
```

## Step 2: Add Heroku Remote
```bash
heroku git:remote -a forecasting-grid-prototype
```

## Step 3: Deploy
```bash
git push heroku main
```

## Step 4: Check Logs (if needed)
```bash
heroku logs --tail -a forecasting-grid-prototype
```

## What Was Fixed

✅ **Build Issue Fixed**: Added `NODE_OPTIONS='--localstorage-file=/tmp/localstorage.json'` to the build script to fix the Node.js 25 localStorage error

✅ **Node Version**: Specified Node 18.x in package.json for Heroku compatibility

✅ **Build Completed**: The build now works locally and should work on Heroku

After deployment, your app should be live at:
**https://forecasting-grid-prototype.herokuapp.com**

