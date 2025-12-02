# Building macOS .app File

This guide explains how to build the React application as a standalone macOS .app file that can be opened offline and shared as a zip file.

## Prerequisites

1. **Node.js and npm** - Make sure you have Node.js 18.x and npm 9.x installed
2. **macOS** - You need to be on a Mac to build the .app file
3. **Dependencies** - Run `npm install` if you haven't already

## Quick Build

Run the build script:

```bash
./build-mac-app.sh
```

Or manually:

```bash
npm run dist-mac
```

## What Happens

1. **Build React App**: The script builds the React application into the `build/` directory
2. **Package Electron App**: Electron Builder packages the app as a macOS .app file
3. **Output Location**: The .app file is created in `dist/mac/ManufacturingCloudForecast.app`

## Creating a Zip File for Sharing

After building, create a zip file:

```bash
cd dist/mac
zip -r ManufacturingCloudForecast.app.zip ManufacturingCloudForecast.app
```

Or from the project root:

```bash
zip -r ManufacturingCloudForecast-mac.zip dist/mac/
```

## Sharing the App

1. **Zip the .app file** as shown above
2. **Share the zip file** - Recipients can:
   - Download and unzip the file
   - Right-click the .app file and select "Open" (first time only, to bypass macOS security)
   - Or move it to Applications folder and open from there

## Troubleshooting

### "App is damaged" Error

If macOS says the app is damaged:
1. Right-click the .app file
2. Select "Open"
3. Click "Open" in the security dialog
4. This only needs to be done once

### Build Fails

- Make sure all dependencies are installed: `npm install`
- Check that you're on macOS
- Ensure you have enough disk space
- Check the error messages in the terminal

### App Won't Open

- Make sure you're on macOS (the .app file only works on Mac)
- Try right-clicking and selecting "Open" instead of double-clicking
- Check Console.app for error messages

## Development vs Production

- **Development**: Run `npm run electron-dev` to test the Electron app with the React dev server
- **Production**: Run `npm run dist-mac` to build a standalone .app file

## File Structure

```
dist/mac/
  └── ManufacturingCloudForecast.app  (The macOS application)
```

The .app file is actually a directory bundle that contains all necessary files to run the application offline.


