#!/bin/bash

# Setup script for Electron wrapper
# This script installs dependencies and sets up the Electron environment

set -e

echo "🚀 Setting up Electron wrapper for Imhotep Finance..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version (should be 16 or higher)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install npm dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Available commands:"
echo "   npm run electron:dev          - Run Electron app in development mode"
echo "   npm run electron:build        - Build for current platform"
echo "   npm run electron:build:linux  - Build Linux (Flatpak + AppImage)"
echo "   npm run electron:build:flatpak - Build Linux Flatpak only"
echo "   npm run electron:build:appimage - Build Linux AppImage only"
echo "   npm run electron:build:win     - Build Windows .exe"
echo "   npm run electron:build:mac    - Build macOS .dmg"
echo "   npm run electron:build:all    - Build for all platforms"
echo ""
echo "⚠️  Note: Before building, update package.json with your GitHub username and repo name"
echo "   in the 'build.publish' section for auto-updates to work."
echo ""

