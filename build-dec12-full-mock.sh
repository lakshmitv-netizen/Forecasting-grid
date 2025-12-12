#!/bin/bash

# Build script for dec12-full-mock Mac app
# This script builds the React app and packages it as a Mac application

set -e

echo "🚀 Building dec12-full-mock Mac App..."
echo ""

# Step 1: Build the React app
echo "📦 Step 1: Building React application..."
NODE_OPTIONS='--localstorage-file=/tmp/localstorage.json' npm run build

# Step 2: Copy electron files to build directory
echo "📋 Step 2: Copying Electron files..."
cp public/electron.js build/electron.js
cp public/preload.js build/preload.js

# Step 3: Package as Mac app
echo "🍎 Step 3: Packaging as Mac application..."
electron-builder --mac

echo ""
echo "✅ Build complete! The app is in the 'dist' directory."
echo "📱 App name: dec12-full-mock"
echo ""
