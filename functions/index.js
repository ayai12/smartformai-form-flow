const functions = require('firebase-functions');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Load environment variables with fallbacks
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || functions.config().openai?.chatgpt_key;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'smartformai-51e03';
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;
const FIREBASE_SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

// Initialize Firebase Admin with service account from environment or file
let serviceAccount;
try {
  // First try to load from file directly (most reliable method)
  serviceAccount = require('./serviceAccountKey.json');
  console.log('✅ Loaded service account from serviceAccountKey.json');
} catch (fileError) {
  console.log('⚠️ Could not load serviceAccountKey.json, trying environment variables');
  
  // If file not found, try loading from environment variable path
  if (FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      serviceAccount = require(FIREBASE_SERVICE_ACCOUNT_PATH);
      console.log(`✅ Loaded service account from path: ${FIREBASE_SERVICE_ACCOUNT_PATH}`);
    } catch (pathError) {
      console.error('❌ Error loading service account from path:', pathError);
    }
  }
  
  // If path failed, try the JSON string
  if (!serviceAccount && FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
      console.log('✅ Loaded service account from environment variable');
    } catch (jsonError) {
      console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', jsonError);
    }
  }
  
  // If all methods failed
  if (!serviceAccount) {
    console.error('❌ Failed to load Firebase service account');
    throw new Error('No valid Firebase service account configuration found');
  }
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: FIREBASE_PROJECT_ID
});

const db = admin.firestore();
const auth = admin.auth();

const app = express();

// Use CORS and JSON body parsing
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 
           'http://localhost:8080', 'http://127.0.0.1:8080'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Set security headers for all responses
app.use((req, res, next) => {
  // Allow cross-origin embedding and resource sharing
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send('');
});

// Check if OpenAI API key is available
if (!OPENAI_API_KEY) {
  console.error('OpenAI API key not found in environment variables or Firebase config');
}

// Validate environment configuration
const validateEnvironment = () => {
  const errors = [];
  
  if (!OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required');
  }
  
  if (!FIREBASE_PROJECT_ID) {
    errors.push('FIREBASE_PROJECT_ID is required');
  }
  
  if (!serviceAccount) {
    errors.push('Firebase service account configuration is required');
  }
  
  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`- ${error}`));
    console.error('\nPlease check your .env file or Firebase Functions config.');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
  console.log(`📁 Project ID: ${FIREBASE_PROJECT_ID}`);
  console.log(`🔑 OpenAI API Key: ${OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🔥 Firebase Service Account: ✅ Configured`);
};

// Run validation
validateEnvironment();

// POST /chat endpoint
app.post('/chat', async (req, res) => {
  // Expect: { prompt: string } in the body
  const { 
    prompt, 
    tone = "business", 
    questionCount = 5,
    action = "add",
    currentQuestions = [],
    model = "gpt-4.1-mini", 
    temperature = 0.7, 
    max_tokens = 512
  } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body.' });
  }

  // Build the special system/user prompt
  let aiPrompt;
  
  // Use the same prompt for both 'add' and 'rebuild' - frontend will handle clearing old questions
  aiPrompt = `Using the following prompt:\n${prompt}\nI want you to generate a customer survey based on that with a tone of ${tone}. Please create appropriate questions and return the output in JSON format.\nI want you to create exactly ${questionCount} questions.\nEach question should clearly specify its type:\nIf it's a text response, set the type as \"text box\".\nIf it's a rating question, set the type as \"rating\" and include the full scale using numbers (e.g., \"1\", \"2\", ..., \"5\").\nIf it's a multiple choice question, set the type as \"multiple choice\" and provide a list of options.\nPlease only return the json format and nothing else don't add any other thing except the json.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: 'You are a helpful AI Form Generator.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature,
        max_tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // Extract only the JSON from the response
    let aiText = response.data.choices?.[0]?.message?.content || '';
    // Try to extract the first JSON object from the response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiText = jsonMatch[0];
      try {
        const json = JSON.parse(aiText);
        res.json(json);
        return;
      } catch (e) {
        // If parsing fails, just send the text
      }
    }
    res.send(aiText);
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to communicate with OpenAI API',
      details: error.response?.data || error.message
    });
  }
});

// Add a test endpoint to verify Firebase Admin is working
app.get('/test-firebase', async (req, res) => {
  try {
    console.log('Testing Firebase Admin connection...');
    
    // Test Firestore
    const snapshot = await db.collection('users').limit(1).get();
    console.log(`Firestore test: Found ${snapshot.size} documents`);
    
    // Test Authentication
    const usersList = await auth.listUsers(1);
    console.log(`Auth test: Found ${usersList.users.length} users`);
    
    res.json({ 
      success: true, 
      message: 'Firebase Admin SDK is working correctly',
      firestoreTest: `Found ${snapshot.size} documents`,
      authTest: `Found ${usersList.users.length} users`
    });
  } catch (error) {
    console.error('Error testing Firebase Admin:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});

app.get('/', (req, res) => {
  res.send('SmartFormAI Express backend is running!');
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);

// Local development server
if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_FUNCTIONS) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at:`);
    console.log(`   - GET  http://localhost:${PORT}/`);
    console.log(`   - POST http://localhost:${PORT}/chat`);
    console.log(`   - GET  http://localhost:${PORT}/test-firebase`);
  });
}