# Heroku Deployment Guide

## Prerequisites

1. **Install Heroku CLI** (if not already installed):
   ```bash
   brew tap heroku/brew && brew install heroku
   ```

2. **Login to Heroku**:
   ```bash
   heroku login
   ```

## Deployment Steps

1. **Create a new Heroku app**:
   ```bash
   heroku create forecasting-grid-prototype
   ```
   (Replace `forecasting-grid-prototype` with your preferred app name)

2. **Deploy to Heroku**:
   ```bash
   git push heroku main
   ```
   (If your default branch is `master`, use `git push heroku master`)

3. **Open your app**:
   ```bash
   heroku open
   ```

## Your Heroku URL

After deployment, your app will be available at:
- `https://forecasting-grid-prototype.herokuapp.com` (or your chosen app name)

## Updating the App

To update the app after making changes:
```bash
git add .
git commit -m "Your commit message"
git push heroku main
```

## Notes

- The app uses the `serve` package to serve the built React app
- The `Procfile` tells Heroku how to run your app
- The `heroku-postbuild` script automatically builds the app during deployment

