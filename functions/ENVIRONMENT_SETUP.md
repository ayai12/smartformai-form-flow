# Environment Setup Guide

This guide explains how to properly configure environment variables for your SmartFormAI server.

## Required Environment Variables

### 1. Create `.env` file
Create a `.env` file in the `functions/` directory with the following variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Firebase Configuration
FIREBASE_PROJECT_ID=smartformai-51e03

# Firebase Service Account (choose one option)
# Option 1: JSON string (recommended for production)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"smartformai-51e03",...}

# Option 2: Path to service account file (for local development)
# FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

## Setup Instructions

### For Local Development:

1. **Copy the example file:**
   ```bash
   cp env.example .env
   ```

2. **Fill in your actual values:**
   - Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Get your Firebase service account from Firebase Console → Project Settings → Service Accounts

3. **For Firebase Service Account:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Either:
     - Copy the entire JSON content to `FIREBASE_SERVICE_ACCOUNT` variable, OR
     - Save the file as `serviceAccountKey.json` in the functions directory

### For Production (Firebase Functions):

1. **Set Firebase Functions config:**
   ```bash
   firebase functions:config:set openai.chatgpt_key="your_openai_api_key"
   firebase functions:config:set firebase.project_id="smartformai-51e03"
   ```

2. **For service account in production:**
   - Use the JSON string approach with `FIREBASE_SERVICE_ACCOUNT`
   - Or let Firebase Functions handle authentication automatically

## Security Best Practices

1. **Never commit `.env` files** - they're already in `.gitignore`
2. **Use different API keys** for development and production
3. **Rotate API keys** regularly
4. **Use Firebase Functions config** for production secrets
5. **Validate environment variables** on startup

## Testing Your Setup

1. **Start the server:**
   ```bash
   npm run serve
   ```

2. **Test the endpoints:**
   ```bash
   curl http://localhost:5001/smartformai-51e03/us-central1/api/
   curl http://localhost:5001/smartformai-51e03/us-central1/api/test-firebase
   ```

## Troubleshooting

### Common Issues:

1. **"No valid Firebase service account configuration found"**
   - Check that your service account JSON is valid
   - Ensure the file path is correct if using `FIREBASE_SERVICE_ACCOUNT_PATH`

2. **"OpenAI API key not found"**
   - Verify your `.env` file exists and has the correct variable name
   - Check that the API key is valid

3. **"Project ID mismatch"**
   - Ensure `FIREBASE_PROJECT_ID` matches your actual Firebase project ID

### Debug Mode:
Add this to your `.env` file for debugging:
```bash
NODE_ENV=development
DEBUG=*
``` 