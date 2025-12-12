# Heroku Deployment via GitHub

## Prerequisites
1. Heroku account (sign up at https://heroku.com if needed)
2. GitHub repository (create one if you don't have it)

## Step 1: Login to Heroku
```bash
heroku login
```
This will open a browser for authentication.

## Step 2: Create Heroku App
```bash
heroku create forecasting-grid-prototype
```

## Step 3: Set up GitHub Repository

### Option A: If you already have a GitHub repo
```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin rev_qty_kpi_version
```

### Option B: Create a new GitHub repo
1. Go to https://github.com/new
2. Create a new repository (e.g., `retrieve-clone`)
3. Don't initialize with README
4. Copy the repository URL
5. Run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin rev_qty_kpi_version
```

## Step 4: Connect GitHub to Heroku

### Via Heroku Dashboard (Recommended):
1. Go to https://dashboard.heroku.com/apps
2. Click on `forecasting-grid-prototype` (or create it if it doesn't exist)
3. Go to "Deploy" tab
4. Under "Deployment method", click "Connect to GitHub"
5. Authorize Heroku to access your GitHub account
6. Search for your repository and click "Connect"
7. Select the branch `rev_qty_kpi_version`
8. Click "Enable Automatic Deploys" (optional)
9. Click "Deploy Branch" to deploy immediately

### Via CLI:
```bash
# First, ensure you're logged in
heroku login

# Create app if it doesn't exist
heroku create forecasting-grid-prototype

# Add GitHub remote if not already added
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin rev_qty_kpi_version

# Then use Heroku Dashboard to connect GitHub (easier than CLI)
```

## Step 5: Verify Deployment
After deployment, your app will be available at:
```
https://forecasting-grid-prototype.herokuapp.com
```

## Configuration Files Already Set Up:
- ✅ `Procfile` - configured with `web: npm run serve`
- ✅ `package.json` - has `heroku-postbuild` and `serve` scripts
- ✅ Node.js version specified in `engines` (if present)

## Troubleshooting:
- If deployment fails, check logs: `heroku logs --tail -a forecasting-grid-prototype`
- Ensure `build` directory is in `.gitignore` (it should be)
- Make sure all dependencies are in `package.json`

