#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Creating minimal .env file...');

// Create a minimal .env file that doesn't use the problematic FIREBASE_SERVICE_ACCOUNT variable
const envContent = `# Created by fix-env.js
# This is a minimal .env file that works with a local serviceAccountKey.json file

# OpenAI API Key - Replace with your actual key
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Project
FIREBASE_PROJECT_ID=smartformai-51e03

# Using local service account file directly - DO NOT set FIREBASE_SERVICE_ACCOUNT
# Note: The file serviceAccountKey.json should be in this directory
`;

try {
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created minimal .env file at: ' + envPath);
  console.log('🔑 Please edit the file and add your actual OpenAI API key');
  console.log('📁 Make sure serviceAccountKey.json exists in this directory');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
} 