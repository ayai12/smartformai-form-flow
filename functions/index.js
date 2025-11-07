const functions = require('firebase-functions');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
const stripe = require('stripe');
const path = require('path');

// Load .env file with explicit path
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug: Log environment variable loading
console.log('🔍 Checking environment variables...');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found (' + process.env.GEMINI_API_KEY.substring(0, 10) + '...)' : '❌ Not found');
console.log('OPENAI_API_KEY (fallback):', process.env.OPENAI_API_KEY ? '✅ Found' : '❌ Not found');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Found (' + process.env.STRIPE_SECRET_KEY.substring(0, 15) + '...)' : '❌ Not found');
console.log('STRIPE_PRIVATE_KEY:', process.env.STRIPE_PRIVATE_KEY ? '✅ Found (' + process.env.STRIPE_PRIVATE_KEY.substring(0, 15) + '...)' : '❌ Not found');

// Load environment variables with fallbacks
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || functions.config().gemini?.key || functions.config().openai?.chatgpt_key;
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

// Configure CORS FIRST (before any routes)
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 
                        'http://localhost:8080', 'http://127.0.0.1:8080'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) or from allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development - restrict in production
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests for all routes
app.options('*', cors(corsOptions), (req, res) => {
  res.status(204).send('');
});

// Middleware: Apply raw body parser ONLY for webhook route, JSON for everything else
app.use((req, res, next) => {
  if (req.path === '/stripeWebhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

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

// Check if Gemini API key is available
if (!GEMINI_API_KEY) {
  console.error('Gemini API key not found in environment variables or Firebase config');
}

// Initialize Stripe
// Priority: 1. .env file (STRIPE_SECRET_KEY), 2. Firebase config (stripe.secret)
// Also check for STRIPE_PRIVATE_KEY as fallback (common naming convention)
const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_PRIVATE_KEY || functions.config().stripe?.secret;
let stripeClient;
if (stripeSecret) {
  stripeClient = stripe(stripeSecret);
  const source = process.env.STRIPE_SECRET_KEY ? '.env (STRIPE_SECRET_KEY)' : 
                 process.env.STRIPE_PRIVATE_KEY ? '.env (STRIPE_PRIVATE_KEY)' : 
                 'Firebase config';
  console.log('✅ Stripe initialized from', source);
} else {
  console.warn('⚠️ Stripe secret key not found in .env (STRIPE_SECRET_KEY or STRIPE_PRIVATE_KEY) or Firebase config (stripe.secret) - subscription features will not work');
  console.warn('   Checked:', {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_PRIVATE_KEY: !!process.env.STRIPE_PRIVATE_KEY,
    'firebase.config.stripe.secret': !!functions.config().stripe?.secret
  });
}

// Validate environment configuration
const validateEnvironment = () => {
  const errors = [];
  const warnings = [];

  if (!GEMINI_API_KEY) {
    // Only error in production, warn in development
    if (process.env.NODE_ENV === 'production' || process.env.FIREBASE_FUNCTIONS) {
      errors.push('GEMINI_API_KEY is required');
    } else {
      warnings.push('GEMINI_API_KEY is not set - AI features will not work');
      console.warn('⚠️  GEMINI_API_KEY not found. Please add it to functions/.env file');
      console.warn('   Example: GEMINI_API_KEY=your_gemini_api_key_here');
    }
  }
  
  if (!FIREBASE_PROJECT_ID) {
    errors.push('FIREBASE_PROJECT_ID is required');
  }
  
  if (!serviceAccount) {
    errors.push('Firebase service account configuration is required');
  }
  
  // Only exit on critical errors, not warnings
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    if (warnings.length > 0) {
      warnings.forEach(warning => console.warn(`   ⚠️  ${warning}`));
    }
    console.error('\nPlease check your .env file or Firebase Functions config.');
    console.error('📁 Expected location: functions/.env');
    console.error('📝 Example .env file:');
    console.error('   GEMINI_API_KEY=your_gemini_api_key_here');
    console.error('   STRIPE_SECRET_KEY=your_stripe_key_here');
    console.error('   STRIPE_WEBHOOK_SECRET=your_webhook_secret_here');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
  console.log(`📁 Project ID: ${FIREBASE_PROJECT_ID}`);
  console.log(`🔑 Gemini API Key: ${GEMINI_API_KEY ? '✅ Configured (' + GEMINI_API_KEY.substring(0, 10) + '...)' : '❌ Missing'}`);
  console.log(`🔥 Firebase Service Account: ✅ Configured`);
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
};

// Run validation
validateEnvironment();

// POST /analyzeSurvey endpoint - Dedicated AI analysis endpoint using Gemini
app.post('/analyzeSurvey', async (req, res) => {
  const { 
    surveyData,
    formTitle,
    responseCount,
    stage 
  } = req.body;
  
  if (!surveyData || !formTitle) {
    return res.status(400).json({ error: 'Missing surveyData or formTitle in request body.' });
  }

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing!');
    return res.status(500).json({ 
      error: 'Gemini API key not configured',
      summaryText: ''
    });
  }

  try {
    // Build analysis prompt - STRICT: NO question echoing, only interpretation
    let analysisPrompt = `You are an AI analyst for survey results. Your job is to analyze survey response data and generate insights.

**CRITICAL RULES:**
1. NEVER repeat or echo the question text. DO NOT mention question wording.
2. ONLY interpret what the RESPONSES reveal about user opinions, satisfaction, and behavior.
3. Focus on patterns, trends, sentiment, and actionable insights.
4. Write as if you're telling someone what the data shows, not what questions were asked.

Survey Context:
- Survey Title: "${formTitle}"
- Total Responses: ${responseCount || 0}
`;

    // Add question analysis data - DO NOT include question text, only data patterns
    if (Array.isArray(surveyData) && surveyData.length > 0) {
      analysisPrompt += `\n\nResponse Data Analysis:\n`;
      
      surveyData.forEach((item, idx) => {
        analysisPrompt += `\nData Point ${idx + 1}:\n`;
        
        if (item.numericData) {
          const avg = item.numericData.average.toFixed(1);
          const min = item.numericData.min;
          const max = item.numericData.max;
          analysisPrompt += `- Numeric ratings: Average ${avg} (range ${min}-${max})\n`;
          analysisPrompt += `- Distribution: ${JSON.stringify(item.numericData.valueCounts)}\n`;
          analysisPrompt += `- ${item.responseCount} responses\n`;
          analysisPrompt += `- What does this reveal about satisfaction levels?\n`;
        } else if (item.textData) {
          analysisPrompt += `- Text responses: ${item.textData.totalTextResponses} total\n`;
          analysisPrompt += `- Sentiment: ${item.textData.sentimentDistribution.positive} positive, `;
          analysisPrompt += `${item.textData.sentimentDistribution.neutral} neutral, `;
          analysisPrompt += `${item.textData.sentimentDistribution.negative} negative\n`;
          if (item.textData.sampleResponses && item.textData.sampleResponses.length > 0) {
            analysisPrompt += `- Sample themes: ${item.textData.sampleResponses.slice(0, 2).map((r) => `"${r.substring(0, 40)}${r.length > 40 ? '...' : ''}"`).join(', ')}\n`;
          }
          analysisPrompt += `- What themes emerge from these responses?\n`;
        } else if (item.choiceData) {
          analysisPrompt += `- Multiple choice distribution: ${JSON.stringify(item.choiceData.options)}\n`;
          analysisPrompt += `- ${item.responseCount} responses\n`;
          analysisPrompt += `- What preferences or patterns do these choices reveal?\n`;
        }
      });
    }

    // Add stage-specific instructions
    if (responseCount < 5) {
      analysisPrompt += `\n\n**IMPORTANT**: There are only ${responseCount} response(s). Provide a motivational message that encourages collecting more responses, but still suggest something actionable based on the data available.`;
    } else {
      analysisPrompt += `\n\n**Instructions:**
- Interpret the data meaningfully - focus on what responses reveal about user satisfaction, preferences, and behavior
- For numeric ratings: Mention averages or ranges (e.g., "Most respondents rated between 6-7, showing high satisfaction")
- For text responses: Identify sentiment patterns and common themes
- For multiple choice: Highlight preference distributions
- Provide 1-2 actionable insights or recommendations
- Write in a friendly, conversational tone
- Keep it concise: 3-6 sentences maximum
- DO NOT mention question wording - only interpret what the data shows`;
    }

    analysisPrompt += `\n\nGenerate ONLY the analysis summary text - no explanations, no formatting, no meta-commentary. Just the insights.`;

    // Call Gemini API directly
    const model = "gemini-2.0-flash";
    const apiVersion = 'v1';
    const geminiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log('📊 Calling Gemini API for survey analysis');
    console.log('   Model:', model);
    console.log('   Survey:', formTitle);
    console.log('   Responses:', responseCount);
    
    const response = await axios.post(
      geminiUrl,
      {
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.8,
          topK: 40
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract the text from Gemini response
    let summaryText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!summaryText) {
      const finishReason = response.data?.candidates?.[0]?.finishReason;
      console.error('❌ Empty response from Gemini for analysis');
      console.error('Finish reason:', finishReason);
      return res.status(500).json({ 
        error: 'Empty response from Gemini API',
        summaryText: ''
      });
    }
    
    // Clean up the response - remove any markdown formatting or extra text
    summaryText = summaryText.trim();
    // Remove markdown code blocks if present
    summaryText = summaryText.replace(/```json|```|`/g, '').trim();
    // Remove any "Summary:" or "Analysis:" prefixes
    summaryText = summaryText.replace(/^(Summary|Analysis|Insights?):\s*/i, '').trim();
    
    console.log('✅ Generated analysis summary:', summaryText.substring(0, 100) + '...');
    
    return res.json({ 
      summaryText,
      success: true
    });
    
  } catch (error) {
    console.error('❌ Error calling Gemini API for analysis:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to generate analysis';
    if (error.response?.status === 401) {
      errorMessage = 'Invalid Gemini API key';
    } else if (error.response?.status === 429) {
      errorMessage = 'Gemini API rate limit exceeded';
    }
    
    return res.status(500).json({
      error: errorMessage,
      summaryText: ''
    });
  }
});

// POST /chat endpoint - Using Google Gemini
app.post('/chat', async (req, res) => {
  // Expect: { prompt: string } in the body
  const { 
    prompt, 
    tone = "business", 
    questionCount = 5,
    action = "add",
    currentQuestions = [],
    model = "gemini-2.0-flash", 
    temperature = 0.7, 
    max_tokens = 2048
  } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body.' });
  }

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing!');
    console.error('   Checked: process.env.GEMINI_API_KEY, process.env.OPENAI_API_KEY, functions.config()');
    return res.status(500).json({ 
      error: 'Gemini API key not configured',
      details: 'Please add GEMINI_API_KEY to your .env file in the functions/ directory',
      questions: []
    });
  }

  // Build the special system/user prompt - using the same format as the original SmartFormAI
  let aiPrompt;
  
  // Use the same prompt format that worked with OpenAI - ensures consistent results
  aiPrompt = `Using the following prompt:\n${prompt}\nI want you to generate a customer survey based on that with a tone of ${tone}. Please create appropriate questions and return the output in JSON format.\nI want you to create exactly ${questionCount} questions.\n\nIMPORTANT: Return a JSON object with a "questions" array. Each question object MUST have a "question" field containing the actual question text.\n\nExample format:\n{\n  "questions": [\n    {\n      "question": "What is your overall satisfaction with our product?",\n      "type": "rating",\n      "scale": 5\n    },\n    {\n      "question": "Which features do you use most often?",\n      "type": "multiple choice",\n      "options": ["Feature A", "Feature B", "Feature C"]\n    },\n    {\n      "question": "What improvements would you like to see?",\n      "type": "text box"\n    }\n  ]\n}\n\nEach question should clearly specify its type:\n- If it's a text response, set the type as "text box".\n- If it's a rating question, set the type as "rating" and include the full scale using numbers (e.g., "1", "2", ..., "5").\n- If it's a multiple choice question, set the type as "multiple choice" and provide a list of options.\n\nCRITICAL: Each question object MUST have a "question" field with the actual question text. Do NOT use "text", "content", "prompt", or any other field name. Use ONLY "question".\n\nPlease only return the JSON format and nothing else don't add any other thing except the json.`;

  try {
    // Gemini API endpoint - use v1 API for newer models (2.0+), v1beta for older models
    const apiVersion = model.includes('gemini-2.0') || model.includes('gemini-1.5') ? 'v1' : 'v1beta';
    const geminiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log('📡 Calling Gemini API');
    console.log('   Model:', model);
    console.log('   Prompt preview:', prompt?.substring(0, 100) + '...');
    console.log('   API Key configured:', !!GEMINI_API_KEY);
    
    const response = await axios.post(
      geminiUrl,
      {
        contents: [{
          parts: [{
            text: aiPrompt
          }]
        }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: Math.max(max_tokens, 2048), // Ensure minimum 2048 tokens for responses
          topP: 0.8,
          topK: 40
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract the text from Gemini response
    let aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Check finish reason first
    const finishReason = response.data?.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
      console.error('❌ Response cut off due to MAX_TOKENS limit');
      console.error('   Prompt tokens:', response.data?.usageMetadata?.promptTokenCount);
      console.error('   Total tokens:', response.data?.usageMetadata?.totalTokenCount);
      // Still try to use what we got if there's any text
      if (!aiText) {
        return res.status(500).json({
          error: 'Response was too long and got cut off. Please try with fewer questions or a shorter prompt.',
          details: 'The AI response exceeded the token limit. Try requesting fewer questions.',
          questions: []
        });
      }
      // If we have partial text, continue and try to parse it
      console.warn('⚠️ Response was truncated, but attempting to parse partial response');
    }
    
    if (!aiText) {
      console.error('❌ Empty response from Gemini');
      console.error('Finish reason:', finishReason);
      console.error('Full response:', JSON.stringify(response.data, null, 2));
      
      let errorMsg = 'Empty response from Gemini API';
      if (finishReason === 'SAFETY') {
        errorMsg = 'Response was blocked by content safety filters. Please try a different prompt.';
      } else if (finishReason === 'RECITATION') {
        errorMsg = 'Response blocked due to recitation. Please rephrase your request.';
      } else if (finishReason === 'OTHER') {
        errorMsg = 'Response generation failed. Please try again.';
      }
      
      return res.status(500).json({
        error: errorMsg,
        details: finishReason || 'No text in response',
        questions: []
      });
    }
    
    console.log('📝 Raw Gemini response:', aiText.substring(0, 500) + '...');
    console.log('📝 Full Gemini response length:', aiText.length);
    
    // Try to extract the first JSON object from the response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiText = jsonMatch[0];
      try {
        const json = JSON.parse(aiText);
        console.log('✅ Successfully parsed JSON from Gemini');
        console.log('📋 JSON structure:', {
          hasQuestions: !!json.questions,
          isArray: Array.isArray(json),
          keys: Object.keys(json)
        });
        
        // Ensure questions array exists and normalize structure
        let questions = [];
        if (json.questions && Array.isArray(json.questions)) {
          questions = json.questions;
        } else if (Array.isArray(json)) {
          questions = json;
        } else if (json.data && Array.isArray(json.data)) {
          questions = json.data;
        }
        
        // Validate and normalize each question
        questions = questions.map((q, idx) => {
          // If question is a string, convert to object
          if (typeof q === 'string') {
            return {
              question: q,
              type: 'text',
              required: true
            };
          }
          
          // Debug: Log the raw question object
          if (idx === 0) {
            console.log('🔍 Raw question object from Gemini:', JSON.stringify(q, null, 2));
            console.log('🔍 Question object keys:', Object.keys(q));
          }
          
          // Ensure question field exists - try multiple possible field names
          if (!q.question) {
            if (q.text) q.question = q.text;
            else if (q.content) q.question = q.content;
            else if (q.prompt) q.question = q.prompt;
            else if (q.query) q.question = q.query;
            else if (q.title) q.question = q.title;
            else if (q.label) q.question = q.label;
            else {
              // Last resort: use the first string value we find
              const firstStringValue = Object.values(q).find(v => typeof v === 'string' && v.length > 10);
              if (firstStringValue) {
                q.question = firstStringValue;
                console.log(`⚠️ Question ${idx + 1}: Using first string value as question: ${firstStringValue.substring(0, 50)}`);
              } else {
                q.question = `Question ${idx + 1}`;
                console.error(`❌ Question ${idx + 1} has no question text! Full object:`, JSON.stringify(q, null, 2));
              }
            }
          }
          
          // Normalize type
          if (q.type) {
            const typeLower = q.type.toLowerCase();
            if (typeLower === 'multiple choice' || typeLower === 'multiple_choice') {
              q.type = 'multiple_choice';
            } else if (typeLower === 'rating') {
              q.type = 'rating';
            } else if (typeLower === 'text box' || typeLower === 'textbox') {
              q.type = 'text';
            }
          } else {
            q.type = 'text';
          }
          
          // Ensure options is an array for multiple choice
          if (q.type === 'multiple_choice' && q.options && !Array.isArray(q.options)) {
            q.options = [];
          }
          
          // Normalize scale for rating questions
          if (q.type === 'rating' && q.scale) {
            if (Array.isArray(q.scale)) {
              q.scale = q.scale.length;
            } else if (typeof q.scale === 'string') {
              q.scale = parseInt(q.scale) || 5;
            }
          }
          
          return q;
        });
        
        console.log(`✅ Processed ${questions.length} questions`);
        if (questions.length > 0) {
          console.log('📋 First question sample:', JSON.stringify(questions[0], null, 2));
          console.log('📋 All questions keys:', questions.map(q => Object.keys(q)));
        }
        
        return res.json({ questions });
      } catch (e) {
        console.error('❌ Error parsing JSON from Gemini:', e);
        console.error('Raw text:', aiText);
        // If parsing fails, try to send the text as is
      }
    }
    
    // If no JSON found, try to parse the whole response
    try {
      const json = JSON.parse(aiText);
      if (!json.questions && Array.isArray(json)) {
        return res.json({ questions: json });
      }
      return res.json(json);
    } catch (e) {
      console.error('❌ Failed to parse JSON, returning error response');
      console.error('Raw response:', aiText);
      // Last resort: send error with empty questions array
      return res.status(500).json({ 
        error: 'Failed to parse JSON response from Gemini',
        rawResponse: aiText.substring(0, 500),
        questions: []
      });
    }
  } catch (error) {
    console.error('❌ Error calling Gemini API:', error.response?.data || error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Check for specific error types
    let errorMessage = 'Failed to communicate with Gemini API';
    let errorDetails = error.message;
    
    if (error.response) {
      // HTTP error response
      errorDetails = error.response.data || error.message;
      if (error.response.status === 401) {
        errorMessage = 'Invalid Gemini API key. Please check your configuration.';
      } else if (error.response.status === 429) {
        errorMessage = 'Gemini API rate limit exceeded. Please try again later.';
      } else if (error.response.status === 400) {
        errorMessage = 'Invalid request to Gemini API.';
      } else if (error.response.status === 404) {
        errorMessage = 'Gemini model not found. The model may not be available or the API version is incorrect.';
        // Check if it's a model name issue
        if (error.response.data?.error?.message?.includes('not found')) {
          errorDetails = `Model "${model}" is not available. Try using "gemini-pro" instead.`;
        }
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Gemini API. Check your internet connection.';
    } else if (error.message?.includes('API key')) {
      errorMessage = 'Gemini API key is missing or invalid.';
    }
    
    // Return a proper error response that frontend can handle
    return res.status(500).json({
      error: errorMessage,
      details: errorDetails,
      questions: []
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

// ============================================
// STRIPE SUBSCRIPTION ENDPOINTS
// ============================================

// Helper function to verify Firebase auth token
const verifyAuthToken = async (authToken) => {
  if (!authToken) return null;
  
  try {
    // Remove 'Bearer ' prefix if present
    const token = authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error.message);
    return null;
  }
};

// Create Stripe Checkout Session
app.post('/createCheckoutSession', async (req, res) => {
  try {
    console.log('📝 CreateCheckoutSession request received');
    
    const { userId, email, productId } = req.body; // productId: 'credit_pack_9_99' or 'pro_subscription_29_99'
    const authToken = req.headers.authorization;

    // Verify authentication
    if (!authToken) {
      console.error('❌ No authorization token provided');
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken) {
      console.error('❌ Invalid or expired auth token');
      return res.status(401).json({ error: 'Invalid or expired authentication. Please sign in again.' });
    }

    // Verify userId matches the authenticated user
    if (decodedToken.uid !== userId) {
      console.error('❌ User ID mismatch:', { provided: userId, authenticated: decodedToken.uid });
      return res.status(403).json({ error: 'User ID does not match authenticated user.' });
    }

    if (!userId || !email) {
      console.error('❌ Missing required fields:', { userId: !!userId, email: !!email });
      return res.status(400).json({ error: 'userId and email are required' });
    }

    if (!stripeClient) {
      console.error('❌ Stripe client not configured');
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Validate productId
    const validProductIds = ['credit_pack_9_99', 'pro_subscription_29_99'];
    const selectedProductId = productId || 'pro_subscription_29_99'; // Default to pro subscription for backward compatibility
    
    if (!validProductIds.includes(selectedProductId)) {
      return res.status(400).json({ error: `Invalid productId. Must be one of: ${validProductIds.join(', ')}` });
    }

    const origin = req.headers.origin || 'http://localhost:5173';

    // Create or retrieve Stripe customer
    let customer;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.stripeCustomerId) {
      // Try to retrieve existing customer, but handle case where customer doesn't exist (API key change)
      try {
      customer = await stripeClient.customers.retrieve(userData.stripeCustomerId);
        console.log(`✅ Retrieved existing customer ${customer.id} for user ${userId}`);
      } catch (error) {
        console.log(`⚠️ Customer ${userData.stripeCustomerId} not found (API key change?), creating new customer`);
        // Customer doesn't exist, create new one
        customer = await stripeClient.customers.create({
          email: email,
          metadata: {
            userId: userId
          }
        });
        // Update the customer ID in Firestore
        await db.collection('users').doc(userId).update({
          stripeCustomerId: customer.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Created new customer ${customer.id} and updated Firestore for user ${userId}`);
      }
    } else {
      // No customer ID in Firestore, create new customer
      customer = await stripeClient.customers.create({
        email: email,
        metadata: {
          userId: userId
        }
      });

      // Save customer ID to Firestore
      const existingUserDoc = await db.collection('users').doc(userId).get();
      if (!existingUserDoc.exists) {
        // New user - give 8 free credits on signup
        await db.collection('users').doc(userId).set({
          stripeCustomerId: customer.id,
          email: email,
          plan: 'free',
          credits: 8, // 8 free credits given on signup
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        // Existing user - just update Stripe customer ID
        await db.collection('users').doc(userId).update({
          stripeCustomerId: customer.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      console.log(`✅ Created new customer ${customer.id} for user ${userId}`);
    }

    // Determine mode and line items based on product
    let sessionConfig;
    
    if (selectedProductId === 'credit_pack_9_99') {
      // One-time payment for credit pack
      sessionConfig = {
        customer: customer.id,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Credit Pack - 40 Credits',
                description: 'Get 40 credits to use for AI-powered actions',
              },
              unit_amount: 999, // €9.99 in cents
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: userId,
          email: email,
          productId: 'credit_pack_9_99',
          creditsAmount: '40'
        }
      };
      console.log(`📝 Creating one-time payment session for credit pack`);
    } else {
      // Subscription for Pro plan
      sessionConfig = {
        customer: customer.id,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'SmartFormAI Agents Pro',
                description: 'Full access to train and manage AI agents',
              },
              recurring: {
                interval: 'month',
              },
              unit_amount: 1499, // €14.99 in cents
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: userId,
          email: email,
          productId: 'pro_subscription_29_99'
        },
        subscription_data: {
          metadata: {
            userId: userId,
            email: email,
            productId: 'pro_subscription_29_99'
          }
        }
      };
      console.log(`📝 Creating subscription session for Pro plan`);
    }

    // Create checkout session
    const session = await stripeClient.checkout.sessions.create(sessionConfig);
    
    console.log(`✅ Created checkout session ${session.id} for user ${userId}`);
    console.log(`   Product: ${selectedProductId}`);
    console.log(`   Customer: ${customer.id}`);
    console.log(`   Mode: ${sessionConfig.mode}`);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook Handler (must use raw body for signature verification)
app.post('/stripeWebhook', async (req, res) => {
  console.log('🎣 WEBHOOK RECEIVED! Processing Stripe webhook...');

  const sig = req.headers['stripe-signature'];
  console.log('🔐 Webhook signature present:', !!sig);

  // Priority: 1. .env file (STRIPE_WEBHOOK_SECRET), 2. Firebase config (stripe.webhook)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || functions.config().stripe?.webhook;
  console.log('🔑 Webhook secret configured:', !!webhookSecret);

  if (!webhookSecret) {
    console.error('⚠️ Stripe webhook secret not found in .env (STRIPE_WEBHOOK_SECRET) or Firebase config (stripe.webhook)');
    return res.status(500).json({ error: 'Webhook secret not configured. Add STRIPE_WEBHOOK_SECRET to .env file or Firebase config' });
  }

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log(`🎯 Processing event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.metadata?.userId || session.subscription_data?.metadata?.userId;
        const productId = session.metadata?.productId || session.subscription_data?.metadata?.productId;

        console.log(`📝 Processing checkout.session.completed for session ${session.id}`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Product ID: ${productId}`);
        console.log(`   Session metadata:`, JSON.stringify(session.metadata, null, 2));
        console.log(`   Subscription metadata:`, JSON.stringify(session.subscription_data?.metadata, null, 2));
        console.log(`   Customer: ${session.customer}`);
        console.log(`   Subscription ID: ${session.subscription}`);
        console.log(`   Payment Status: ${session.payment_status}`);
        console.log(`   Mode: ${session.mode}`);
        console.log(`   Amount: ${session.amount_total} ${session.currency}`);

        // Handle credit pack (one-time payment)
        if (session.mode === 'payment' && productId === 'credit_pack_9_99') {
          console.log(`💰 Processing credit pack purchase for session ${session.id}`);
          console.log(`   Payment status: ${session.payment_status}`);
          console.log(`   Amount total: ${session.amount_total}`);
          console.log(`   Currency: ${session.currency}`);

          // For checkout sessions, payment_status might be 'paid' or session might still be processing
          // Let's be more permissive and only skip if clearly unpaid
          if (session.payment_status === 'unpaid' || session.payment_status === 'failed') {
            console.log(`⚠️ Payment status is ${session.payment_status}, skipping credit addition`);
            return res.json({ received: true, skipped: true, reason: 'Payment not completed' });
          }

          const creditsAmount = 40; // Hardcoded for now to ensure it's always 40
          console.log(`💰 Adding ${creditsAmount} credits for user ${userId || 'unknown'}`);
          
          if (!userId) {
            // Try to find user by customer ID
            if (session.customer) {
              const customerQuery = await db.collection('users')
                .where('stripeCustomerId', '==', session.customer)
                .limit(1)
                .get();
              
              if (!customerQuery.empty) {
                const foundUserId = customerQuery.docs[0].id;
                console.log(`✅ Found user ${foundUserId} by customer ID for credit pack`);
                
                // Get current credits
                const userRef = db.collection('users').doc(foundUserId);
                const userDoc = await userRef.get();
                const userData = userDoc.data();
                const creditsBefore = userData?.credits ?? 0;

                console.log(`📊 User ${foundUserId} has ${creditsBefore} credits before purchase`);

                // Add credits with direct update (simpler than transaction for now)
                const newCredits = creditsBefore + creditsAmount;
                  await userRef.update({
                  credits: newCredits,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });

                console.log(`✅ Set credits to ${newCredits} for user ${foundUserId}`);
                
                // Record in credit history
                await db.collection('credit_history').add({
                  userId: foundUserId,
                  action: 'Credit Purchase: Credit Pack',
                  creditsUsed: -creditsAmount, // Negative for additions
                  creditsBefore: creditsBefore,
                  creditsAfter: newCredits,
                  timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
                
                // Verify
                const verifyDoc = await userRef.get();
                const verifyData = verifyDoc.data();
                const actualCredits = verifyData?.credits ?? 0;

                console.log(`✅ VERIFICATION: User ${foundUserId} now has ${actualCredits} credits`);

                if (actualCredits !== newCredits) {
                  console.error(`❌ CREDIT MISMATCH! Expected ${newCredits}, got ${actualCredits}`);
                  // Force set to correct value
                  await userRef.update({
                    credits: newCredits,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                  console.log(`🔧 FORCED credits to ${newCredits}`);
                }
                
                return res.json({
                  received: true,
                  creditsAdded: creditsAmount,
                  newBalance: actualCredits,
                  userId: foundUserId
                });
              } else {
                console.log(`❌ No user found for customer ID ${session.customer} - webhook may be for old customer`);
                return res.json({ received: true, skipped: true, reason: 'No user found for customer ID' });
              }
            } else {
              console.error('❌ No userId in session metadata and no customer ID available');
            return res.status(400).json({ error: 'No userId found for credit pack purchase' });
            }
          }

          // User ID found, add credits
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          const creditsBefore = userData?.credits ?? 0;

          console.log(`📊 User ${userId} has ${creditsBefore} credits before purchase`);

          // Add credits with direct update
          const newCredits = creditsBefore + creditsAmount;
            await userRef.update({
            credits: newCredits,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

          console.log(`✅ Set credits to ${newCredits} for user ${userId}`);
          
          // Record in credit history
          await db.collection('credit_history').add({
            userId: userId,
            action: 'Credit Purchase: Credit Pack',
            creditsUsed: -creditsAmount, // Negative for additions
            creditsBefore: creditsBefore,
            creditsAfter: newCredits,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Verify
          const verifyDoc = await userRef.get();
          const verifyData = verifyDoc.data();
          const actualCredits = verifyData?.credits ?? 0;

          console.log(`✅ VERIFICATION: User ${userId} now has ${actualCredits} credits`);
              
          if (actualCredits !== newCredits) {
            console.error(`❌ CREDIT MISMATCH! Expected ${newCredits}, got ${actualCredits}`);
            // Force set to correct value
            await userRef.update({
              credits: newCredits,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`🔧 FORCED credits to ${newCredits}`);
          }

          return res.json({
            received: true,
            creditsAdded: creditsAmount,
            newBalance: actualCredits,
            userId: userId
          });
        }

        // Handle Pro subscription (existing logic) - temporarily commented out
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const customerId = deletedSubscription.customer;

        console.log(`📝 Processing customer.subscription.deleted for subscription ${deletedSubscription.id}`);
        console.log(`   Customer: ${customerId}`);

        // Find user by Stripe customer ID
        const userQuery = await db.collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          const userDoc = userQuery.docs[0];
          
          // Use batch write for atomic operations
          const deleteBatch = db.batch();
          const deleteUserRef = db.collection('users').doc(userDoc.id);
          const deleteSubRef = db.collection('subscriptions').doc(userDoc.id);

          deleteBatch.set(deleteUserRef, {
            plan: 'free',
            credits: 0, // Reset credits to 0 when subscription expires
            subscriptionId: null,
            subscriptionStatus: 'canceled',
            current_period_end: null,
            current_period_start: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          deleteBatch.set(deleteSubRef, {
            status: 'canceled',
            endDate: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          await deleteBatch.commit();

          console.log(`✅ User ${userDoc.id} downgraded to Free with 0 credits - subscription canceled`);
        } else {
          console.error(`❌ No user found with customer ID ${customerId}`);
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        const updatedCustomerId = updatedSubscription.customer;

        // Find user by Stripe customer ID
        const updatedUserQuery = await db.collection('users')
          .where('stripeCustomerId', '==', updatedCustomerId)
          .limit(1)
          .get();

        if (!updatedUserQuery.empty) {
          const updatedUserDoc = updatedUserQuery.docs[0];
          const isPro = updatedSubscription.status === 'active' || updatedSubscription.status === 'trialing';
          
          // Use batch write for atomic operations
          const updateBatch = db.batch();
          const updateUserRef = db.collection('users').doc(updatedUserDoc.id);
          const updateSubRef = db.collection('subscriptions').doc(updatedUserDoc.id);

          updateBatch.set(updateUserRef, {
            plan: isPro ? 'pro' : 'free',
            subscriptionId: updatedSubscription.id,
            subscriptionStatus: updatedSubscription.status,
            current_period_end: admin.firestore.Timestamp.fromDate(
              new Date(updatedSubscription.current_period_end * 1000)
            ),
            current_period_start: admin.firestore.Timestamp.fromDate(
              new Date(updatedSubscription.current_period_start * 1000)
            ),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          updateBatch.set(updateSubRef, {
            planId: isPro ? 'pro' : 'free',
            status: updatedSubscription.status,
            currentPeriodEnd: admin.firestore.Timestamp.fromDate(
              new Date(updatedSubscription.current_period_end * 1000)
            ),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          await updateBatch.commit();

          console.log(`✅ Updated subscription for user ${updatedUserDoc.id} - Status: ${updatedSubscription.status}`);
        }
        break;
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    console.error('Error stack:', error.stack);
    // Return 200 to prevent Stripe from retrying (we'll handle manually if needed)
    res.status(200).json({ 
      received: true, 
      error: error.message,
      note: 'Webhook received but processing failed. Check logs and use manual fix if needed.'
    });
  }
});

// Manual credit addition endpoint (for testing)
app.post('/addCreditsTest', async (req, res) => {
  try {
    const { userId, creditsAmount = 40 } = req.body;
    console.log(`🧪 MANUAL CREDIT TEST: Adding ${creditsAmount} credits to user ${userId}`);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`❌ User ${userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const creditsBefore = userData?.credits ?? 0;
    const newCredits = creditsBefore + creditsAmount;

    console.log(`📊 Before: ${creditsBefore} credits`);

    await userRef.update({
      credits: newCredits,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Record in credit history
    await db.collection('credit_history').add({
      userId: userId,
      action: `Manual Test: Credit Pack Test`,
      creditsUsed: -creditsAmount, // Negative for additions
      creditsBefore: creditsBefore,
      creditsAfter: newCredits,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Verify
    const verifyDoc = await userRef.get();
    const verifyData = verifyDoc.data();
    const actualCredits = verifyData?.credits ?? 0;

    console.log(`✅ After: ${actualCredits} credits`);

    res.json({
      success: true,
      creditsAdded: creditsAmount,
      creditsBefore: creditsBefore,
      creditsAfter: actualCredits,
      message: `Added ${creditsAmount} credits. User now has ${actualCredits} credits.`
    });
  } catch (error) {
    console.error('Error in credit test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual webhook simulation endpoint (for testing)
app.post('/simulateWebhook', async (req, res) => {
  try {
    const { userId, productId = 'credit_pack_9_99', paymentStatus = 'paid' } = req.body;

    console.log(`🎭 SIMULATING WEBHOOK: ${productId} for user ${userId}`);

    // Create a fake session object like Stripe would send
    const fakeSession = {
      id: `sim_${Date.now()}`,
      mode: productId === 'credit_pack_9_99' ? 'payment' : 'subscription',
      payment_status: paymentStatus,
      metadata: {
        userId: userId,
        productId: productId,
        creditsAmount: '40'
      },
      customer: `cus_sim_${Date.now()}`,
      amount_total: 999,
      currency: 'eur'
    };

    console.log(`📝 Fake session created:`, JSON.stringify(fakeSession, null, 2));

    // Now run the same logic as the webhook
    const session = fakeSession;
    const userIdFromSession = session.metadata?.userId;
    const productIdFromSession = session.metadata?.productId;

    console.log(`🎯 Processing simulated checkout.session.completed`);
    console.log(`   User ID: ${userIdFromSession}`);
    console.log(`   Product ID: ${productIdFromSession}`);
    console.log(`   Payment Status: ${session.payment_status}`);

    if (session.mode === 'payment' && productIdFromSession === 'credit_pack_9_99') {
      console.log(`💰 Processing simulated credit pack purchase`);

      const creditsAmount = 40;
      console.log(`💰 Adding ${creditsAmount} credits for user ${userIdFromSession || 'unknown'}`);

      if (!userIdFromSession) {
        return res.status(400).json({ error: 'No userId in simulated session' });
      }

      const userRef = db.collection('users').doc(userIdFromSession);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      const creditsBefore = userData?.credits ?? 0;

      console.log(`📊 User ${userIdFromSession} has ${creditsBefore} credits before purchase`);

      const newCredits = creditsBefore + creditsAmount;
      await userRef.update({
        credits: newCredits,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Set credits to ${newCredits} for user ${userIdFromSession}`);

      // Record in credit history
      await db.collection('credit_history').add({
        userId: userIdFromSession,
        action: 'Simulated Credit Purchase: Credit Pack',
        creditsUsed: -creditsAmount,
        creditsBefore: creditsBefore,
        creditsAfter: newCredits,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Verify
      const verifyDoc = await userRef.get();
      const verifyData = verifyDoc.data();
      const actualCredits = verifyData?.credits ?? 0;

      console.log(`✅ VERIFICATION: User ${userIdFromSession} now has ${actualCredits} credits`);

      res.json({
        success: true,
        simulated: true,
        creditsAdded: creditsAmount,
        creditsBefore: creditsBefore,
        creditsAfter: actualCredits,
        message: `SIMULATED: Added ${creditsAmount} credits. User now has ${actualCredits} credits.`
      });
    } else {
      res.json({ success: false, message: 'Not a credit pack purchase' });
    }

  } catch (error) {
    console.error('Error in webhook simulation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual credit fix endpoint (for fixing missed webhook payments)
app.post('/fixCredits', async (req, res) => {
  try {
    const { userId, creditsAmount = 40, reason = 'Manual credit fix' } = req.body;
    const authToken = req.headers.authorization;

    console.log(`🔧 Manual credit fix requested for user ${userId}, amount: ${creditsAmount}`);

    // Verify authentication
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    // Only allow user to fix their own credits OR admin
    if (decodedToken.uid !== userId && decodedToken.uid !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to add credits for this user' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const creditsBefore = userData?.credits ?? 0;

    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      await userRef.set({
        credits: creditsAmount,
        plan: 'free',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update existing credits atomically
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(creditsAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Record in credit history
    await db.collection('credit_history').add({
      userId: userId,
      action: `Manual Fix: ${reason}`,
      creditsUsed: -creditsAmount, // Negative for additions
      creditsBefore: creditsBefore,
      creditsAfter: creditsBefore + creditsAmount,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Verify the update
    const verifyDoc = await db.collection('users').doc(userId).get();
    const verifyData = verifyDoc.data();

    console.log(`✅ Manual credit fix: User ${userId} now has ${verifyData?.credits ?? 0} credits`);

    res.json({
      success: true,
      userId: userId,
      creditsAdded: creditsAmount,
      creditsBefore: creditsBefore,
      creditsAfter: verifyData?.credits ?? 0,
      message: `Successfully added ${creditsAmount} credits`
    });
  } catch (error) {
    console.error('❌ Error in manual credit fix:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual subscription sync endpoint (for fixing missed webhooks)
app.post('/syncSubscription', async (req, res) => {
  try {
    const { userId } = req.body;
    const authToken = req.headers.authorization;

    console.log(`🔄 Manual subscription sync requested for user ${userId}`);

    // Verify authentication
    if (!authToken) {
      console.error('❌ No authorization token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken) {
      console.error('❌ Invalid or expired auth token');
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    if (decodedToken.uid !== userId) {
      console.error('❌ User ID mismatch:', { provided: userId, authenticated: decodedToken.uid });
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!stripeClient) {
      console.error('❌ Stripe client not configured');
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Get user's Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      console.error(`❌ No Stripe customer ID found for user ${userId}`);
      return res.status(404).json({ error: 'No Stripe customer found. Please complete checkout first.' });
    }

    console.log(`📝 Fetching subscriptions for customer ${userData.stripeCustomerId}`);

    // Get latest subscription from Stripe
    const subscriptions = await stripeClient.subscriptions.list({
      customer: userData.stripeCustomerId,
      limit: 10,
      status: 'all'
    });

    if (subscriptions.data.length === 0) {
      console.log(`⚠️ No subscriptions found for customer ${userData.stripeCustomerId}`);
      // User has no subscription, ensure they're marked as free
      await db.collection('users').doc(userId).set({
        plan: 'free',
        subscriptionId: null,
        subscriptionStatus: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return res.json({ 
        success: true, 
        plan: 'free',
        status: 'no_subscription',
        message: 'No active subscription found. Plan set to free.'
      });
    }

    // Get the most recent active or trialing subscription, or most recent overall
    const activeSubscription = subscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    ) || subscriptions.data[0];

    const isPro = activeSubscription.status === 'active' || activeSubscription.status === 'trialing';

    console.log(`✅ Found subscription ${activeSubscription.id} with status ${activeSubscription.status}`);

    // Use batch write for atomic operations
    const batch = db.batch();

    // Update users collection
    const userRef = db.collection('users').doc(userId);
    batch.set(userRef, {
      plan: isPro ? 'pro' : 'free',
      subscriptionId: activeSubscription.id,
      subscriptionStatus: activeSubscription.status,
      current_period_end: admin.firestore.Timestamp.fromDate(
        new Date(activeSubscription.current_period_end * 1000)
      ),
      current_period_start: admin.firestore.Timestamp.fromDate(
        new Date(activeSubscription.current_period_start * 1000)
      ),
      stripeCustomerId: userData.stripeCustomerId,
      subscriptionCreated: admin.firestore.Timestamp.fromDate(
        new Date(activeSubscription.created * 1000)
      ),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Also save to subscriptions collection
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    batch.set(subscriptionRef, {
      planId: isPro ? 'pro' : 'free',
      status: activeSubscription.status,
      stripeSubscriptionId: activeSubscription.id,
      stripeCustomerId: userData.stripeCustomerId,
                  billingCycle: 'monthly',
                  price: 14.99, // Updated to €14.99
                  startDate: admin.firestore.Timestamp.fromDate(
        new Date(activeSubscription.created * 1000)
      ),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(
        new Date(activeSubscription.current_period_end * 1000)
      ),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Commit batch
    await batch.commit();

    console.log(`✅ Successfully synced subscription for user ${userId}`);
    console.log(`   Plan: ${isPro ? 'pro' : 'free'}, Status: ${activeSubscription.status}`);

    res.json({ 
      success: true, 
      plan: isPro ? 'pro' : 'free',
      status: activeSubscription.status,
      subscriptionId: activeSubscription.id,
      currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000).toISOString()
    });
  } catch (error) {
    console.error('❌ Error syncing subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to sync subscription' });
  }
});

// Create Customer Portal Session
app.post('/createCustomerPortalSession', async (req, res) => {
  try {
    const { userId, returnUrl } = req.body;
    const authToken = req.headers.authorization;

    // Verify authentication
    if (!authToken) {
      console.error('❌ No authorization token provided');
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken) {
      console.error('❌ Invalid or expired auth token');
      return res.status(401).json({ error: 'Invalid or expired authentication. Please sign in again.' });
    }

    // Verify userId matches the authenticated user
    if (decodedToken.uid !== userId) {
      console.error('❌ User ID mismatch:', { provided: userId, authenticated: decodedToken.uid });
      return res.status(403).json({ error: 'User ID does not match authenticated user.' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Get user's Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      return res.status(404).json({ error: 'No Stripe customer found for this user' });
    }

    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: returnUrl || `${req.headers.origin || 'http://localhost:5173'}/profile`,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);

// Local development server
if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_FUNCTIONS) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at:`);
    console.log(`   - GET  http://localhost:${PORT}/`);
    console.log(`   - POST http://localhost:${PORT}/chat (Gemini AI)`);
    console.log(`   - POST http://localhost:${PORT}/createCheckoutSession (Stripe)`);
    console.log(`   - POST http://localhost:${PORT}/createCustomerPortalSession (Stripe)`);
    console.log(`   - POST http://localhost:${PORT}/syncSubscription (Stripe - Manual Sync)`);
    console.log(`   - POST http://localhost:${PORT}/addCreditsTest (Manual Credit Test)`);
    console.log(`   - POST http://localhost:${PORT}/simulateWebhook (Webhook Simulation)`);
    console.log(`   - POST http://localhost:${PORT}/fixCredits (Manual Credit Fix)`);
    console.log(`   - POST http://localhost:${PORT}/stripeWebhook (Stripe)`);
    console.log(`   - GET  http://localhost:${PORT}/test-firebase`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error(`💡 Solution: Kill the process using port ${PORT} or use a different port.`);
      console.error(`   Run: lsof -ti:${PORT} | xargs kill -9`);
      console.error(`   Or set PORT environment variable: PORT=3001 npm run local`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}