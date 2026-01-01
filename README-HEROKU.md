# Heroku Deployment Guide

This guide explains how to deploy the Forecasting & Planning Tool to Heroku.

## Prerequisites

- Heroku account (sign up at https://www.heroku.com)
- Heroku CLI installed (https://devcenter.heroku.com/articles/heroku-cli)
- Git installed

## Quick Deploy

### 1. Login to Heroku
```bash
heroku login
```

### 2. Create a Heroku App
```bash
heroku create your-app-name
```

### 3. Set Environment Variables (if needed)
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
```

### 4. Deploy
```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main
```

### 5. Open Your App
```bash
heroku open
```

## Environment Variables

The following environment variables can be configured:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Port for the server to listen on | `5000` | No (Heroku sets this automatically) |
| `NODE_ENV` | Node environment | `production` | No |

### Setting Environment Variables

**Via Heroku CLI:**
```bash
heroku config:set KEY=value
```

**Via Heroku Dashboard:**
1. Go to your app's settings
2. Click "Reveal Config Vars"
3. Add your variables

**View all config vars:**
```bash
heroku config
```

## Build Process

Heroku will automatically:
1. Install dependencies (`npm install`)
2. Run the build script (`npm run build`)
3. Start the server using the Procfile (`npm start`)

## Project Structure

- `Procfile` - Defines the web process for Heroku
- `package.json` - Contains scripts and dependencies
- `vite.config.ts` - Vite configuration
- `.env.example` - Example environment variables

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (check `engines` in package.json)
- View build logs: `heroku logs --tail`

### App Crashes
- Check application logs: `heroku logs --tail`
- Verify environment variables are set correctly
- Ensure PORT is not hardcoded (use `process.env.PORT`)

### Static Files Not Loading
- Verify build completed successfully
- Check that `dist` folder is being created
- Ensure base path in vite.config.ts is correct

## Useful Heroku Commands

```bash
# View logs
heroku logs --tail

# Run commands in dyno
heroku run bash

# Scale dynos
heroku ps:scale web=1

# Restart app
heroku restart

# View app info
heroku info
```

## Notes

- The app uses Vite's preview server for production serving
- Static files are served from the `dist` directory after build
- Heroku automatically sets the PORT environment variable
- The app will rebuild on every push to the main branch


