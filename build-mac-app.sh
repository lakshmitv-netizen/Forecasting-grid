#!/bin/bash

# Build script for macOS .app file
# This script builds the React app and packages it as a macOS .app file

set -e

echo "🚀 Building React application..."
NODE_OPTIONS='--localstorage-file=/tmp/localstorage.json' npm run build

if [ ! -d "build" ]; then
  echo "❌ Build directory not found. Build failed."
  exit 1
fi

echo "📦 Packaging as macOS .app file..."
npm run dist-mac

if [ -d "dist/mac" ]; then
  echo "✅ macOS .app file created successfully!"
  echo "📍 Location: dist/mac/"
  echo ""
  echo "To create a zip file for sharing:"
  echo "  cd dist/mac && zip -r ManufacturingCloudForecast.app.zip ManufacturingCloudForecast.app"
  echo ""
  echo "Or run: zip -r ManufacturingCloudForecast-mac.zip dist/mac/"
else
  echo "❌ Failed to create .app file. Check the output above for errors."
  exit 1
fi


