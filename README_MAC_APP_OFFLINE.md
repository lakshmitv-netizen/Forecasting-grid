# Building Mac App for Offline Use

This guide explains how to build your React application as a standalone macOS `.app` file that works completely offline.

## Quick Start

Run the build script:

```bash
./build-mac-app-offline.sh
```

This will:
1. Build the React application
2. Package it as a Mac `.app` file
3. Create a zip file for easy sharing

## Manual Build

If you prefer to build manually:

```bash
# 1. Build the React app
NODE_OPTIONS='--localstorage-file=/tmp/localstorage.json' npm run build

# 2. Copy Electron files
cp public/electron.js build/
cp public/preload.js build/

# 3. Package as Mac app
electron-builder --mac
```

## Output Location

After building, you'll find:
- **App file**: `dist/mac/Manufacturing Cloud Forecast.app`
- **Zip file**: `dist/mac/Manufacturing Cloud Forecast.app.zip`

## Installing the App

1. **Unzip** the `.zip` file (if you downloaded it)
2. **First time opening**: Right-click the `.app` file and select "Open"
   - This bypasses macOS security (only needed once)
   - Click "Open" in the security dialog
3. **Move to Applications** (optional): Drag the `.app` file to your Applications folder
4. **Launch**: Double-click the app to run it

## Offline Capabilities

The app is completely self-contained and works offline:
- ✅ No internet connection required
- ✅ All assets bundled in the app
- ✅ Data stored locally
- ✅ Full functionality available offline

## Troubleshooting

### "App is damaged" Error

If macOS says the app is damaged:
1. Right-click the `.app` file
2. Select "Open" (don't double-click)
3. Click "Open" in the security dialog
4. This only needs to be done once per Mac

### App Won't Open

- Make sure you're on macOS (the `.app` file only works on Mac)
- Try right-clicking and selecting "Open" instead of double-clicking
- Check Console.app for error messages
- Ensure you have macOS 10.13 or later

### Build Fails

- Make sure all dependencies are installed: `npm install`
- Check that you're on macOS
- Ensure you have enough disk space (at least 500MB free)
- Check the error messages in the terminal
- Make sure Node.js 22.x is installed

### App Crashes on Launch

- Check Console.app for error messages
- Try rebuilding: `./build-mac-app-offline.sh`
- Make sure you have the latest version of Electron Builder

## System Requirements

- **macOS**: 10.13 (High Sierra) or later
- **Architecture**: Intel (x64) or Apple Silicon (arm64)
- **Disk Space**: ~200MB for the app
- **Memory**: 2GB RAM minimum, 4GB recommended

## Development vs Production

- **Development**: Run `npm run electron-dev` to test with React dev server
- **Production**: Run `./build-mac-app-offline.sh` to build standalone app

## File Structure

```
dist/mac/
  └── Manufacturing Cloud Forecast.app/  (The macOS application bundle)
      ├── Contents/
      │   ├── MacOS/                     (Executable)
      │   ├── Resources/                 (App files and assets)
      │   └── Frameworks/                (Electron framework)
```

The `.app` file is actually a directory bundle that contains all necessary files to run the application offline.

## Sharing the App

1. **Zip the app**: The build script automatically creates a zip file
2. **Share the zip**: Send `Manufacturing Cloud Forecast.app.zip` to others
3. **Recipients**: They unzip and follow the installation steps above

## Notes

- The app is signed for local use only (not notarized for distribution)
- First launch may take a few seconds to load
- All data is stored locally in the app's data directory
- The app works completely offline - no network access required

