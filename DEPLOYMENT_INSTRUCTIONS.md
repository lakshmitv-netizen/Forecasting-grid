# Deployment Instructions for rev_qty_kpi_version

## Vercel Deployment

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from the branch**:
   ```bash
   git checkout rev_qty_kpi_version
   vercel --prod
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Project name: `rev-qty-kpi-version` (or your preferred name)
   - Directory: `.` (current directory)
   - Build settings: Vercel will auto-detect from `vercel.json`

### Option 2: Deploy via Vercel Dashboard

1. **Push branch to GitHub** (if not already):
   ```bash
   # Add remote if needed
   git remote add origin <your-github-repo-url>
   git push -u origin rev_qty_kpi_version
   ```

2. **Go to Vercel Dashboard**:
   - Visit https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Select branch: `rev_qty_kpi_version`
   - Framework Preset: Create React App (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `build` (auto-detected)
   - Click "Deploy"

3. **Get Deployment URL**:
   - After deployment, Vercel will provide a URL like: `https://rev-qty-kpi-version.vercel.app`
   - You can also set a custom domain in project settings

## Local Development

To run locally from this milestone:

```bash
# Checkout the milestone branch
git checkout rev_qty_kpi_version

# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:3000`

## Building for Production

```bash
# Build the production bundle
npm run build

# The build output will be in the `build` directory
```

## Creating a New Project from This Milestone

To create a new Cursor project based on this milestone:

1. **Clone or copy the repository**:
   ```bash
   # If you have the repo URL
   git clone <repo-url>
   cd retrieve-clone
   
   # Or copy the directory to a new location
   cp -r /Users/lakshmi.tv/Desktop/Cursor/retrieve-clone /path/to/new/project
   cd /path/to/new/project
   ```

2. **Checkout the milestone branch**:
   ```bash
   git checkout rev_qty_kpi_version
   ```

3. **Create a new branch for your work**:
   ```bash
   git checkout -b your-new-feature-branch
   ```

4. **Open in Cursor**:
   - Open the project directory in Cursor
   - All the code from this milestone will be available

## Branch Information

- **Current Branch**: `rev_qty_kpi_version`
- **Base Branch**: `main`
- **Commit**: Latest commit with milestone message

## Environment Variables

If you need to add environment variables for Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add any required variables
3. Redeploy

## Troubleshooting

### Build Fails on Vercel
- Check Node.js version (should be 22.x as per package.json)
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Deployment URL Not Working
- Check that the build completed successfully
- Verify `vercel.json` configuration
- Check browser console for errors

