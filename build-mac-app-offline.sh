#!/bin/bash

# Build Mac App for Offline Use
# This script builds the React app and packages it as a standalone Mac .app file

set -e  # Exit on error

echo "🚀 Building Mac App for Offline Use..."
echo ""

# Step 1: Clean previous builds
echo "📦 Cleaning previous builds..."
rm -rf build dist

# Step 2: Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install
fi

# Step 3: Build React app
echo "🔨 Building React application..."
NODE_OPTIONS='--localstorage-file=/tmp/localstorage.json' npm run build

# Step 4: Copy Electron files to build directory
echo "📋 Copying Electron files..."
cp public/electron.js build/
cp public/preload.js build/

# Step 5: Package as Mac app
echo "🍎 Packaging as Mac .app file..."
electron-builder --mac

# Step 6: Create zip file for easy sharing
echo "📦 Creating zip file..."
cd dist/mac
if [ -d "Manufacturing Cloud Forecast.app" ]; then
  zip -r -q "Manufacturing Cloud Forecast.app.zip" "Manufacturing Cloud Forecast.app"
  echo ""
  echo "✅ Success! Mac app created at:"
  echo "   📁 dist/mac/Manufacturing Cloud Forecast.app"
  echo "   📦 dist/mac/Manufacturing Cloud Forecast.app.zip"
  echo ""
  echo "💡 To use the app:"
  echo "   1. Unzip the .zip file"
  echo "   2. Right-click the .app file and select 'Open' (first time only)"
  echo "   3. The app will work completely offline!"
else
  echo "❌ Error: .app file not found"
  exit 1
fi

