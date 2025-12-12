# Heroku GitHub Deployment Setup

## ✅ Completed Steps:
1. ✅ Code pushed to GitHub: `lakshmitv-netizen/Forecasting-grid` (branch: `rev_qty_kpi_version`)
2. ✅ Large files removed from git history
3. ✅ `.gitignore` updated to exclude dist files

## Next Steps - Connect GitHub to Heroku:

### Option 1: Via Heroku Dashboard (Recommended - Easiest)

1. **Login to Heroku:**
   - Go to https://dashboard.heroku.com
   - Login with your Heroku account

2. **Create App (if it doesn't exist):**
   - Click "New" → "Create new app"
   - App name: `forecasting-grid-prototype`
   - Choose a region
   - Click "Create app"

3. **Connect GitHub:**
   - In your app dashboard, go to the **"Deploy"** tab
   - Under "Deployment method", click **"Connect to GitHub"**
   - Authorize Heroku to access your GitHub account (if prompted)
   - Search for repository: `Forecasting-grid`
   - Click **"Connect"** next to your repository

4. **Configure Deployment:**
   - Under "Manual deploy", select branch: `rev_qty_kpi_version`
   - Click **"Deploy Branch"** to deploy immediately
   - (Optional) Enable "Automatic deploys" to auto-deploy on every push

5. **Your App URL:**
   - After deployment, your app will be available at:
   - **https://forecasting-grid-prototype.herokuapp.com**

### Option 2: Via CLI (If you're already logged in)

```bash
# Create app (if it doesn't exist)
heroku create forecasting-grid-prototype

# Set up GitHub integration (requires Heroku CLI plugin)
heroku plugins:install heroku-git

# Or use the dashboard method above (easier)
```

## Configuration Already Set:
- ✅ `Procfile` - configured with `web: npm run serve`
- ✅ `package.json` - has `heroku-postbuild` and `serve` scripts
- ✅ Node.js version should be specified in `package.json` engines

## Troubleshooting:
- If deployment fails, check logs: `heroku logs --tail -a forecasting-grid-prototype`
- Ensure you're logged into Heroku: `heroku auth:whoami`
- Check build logs in Heroku dashboard under "Activity" tab

