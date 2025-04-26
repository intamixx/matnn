#!/bin/bash

# Quick start script for the Web Form Application

echo "==== Web Form Application Quick Start ===="
echo "Installing Node.js dependencies..."
npm install

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Starting the application in development mode..."
npm run dev

echo "Application is running at http://localhost:5000"
echo "NOTE: Form submissions are configured to be sent to an external server on port 8090."
echo "Make sure this external server is running, or update the submission URL in client/src/pages/VueInspiredForm.tsx"