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

// In-memory cache for request deduplication and rate limiting
const analysisRequestCache = new Map(); // Key: userId_formId, Value: { lastRequest: timestamp, inProgress: boolean, requestCount: number }
const geminiRequestCache = new Map(); // Key: userId, Value: { lastRequest: timestamp, inProgress: boolean, hourlyRequests: [], dailyRequests: [], requestCount: number }
const ANALYSIS_RATE_LIMIT_MS = 60000; // 60 seconds between requests per user+form (increased to reduce costs)
const MAX_REQUESTS_PER_HOUR = 10; // Maximum 10 analysis requests per user+form per hour
const MAX_REQUESTS_PER_DAY = 50; // Maximum 50 analysis requests per user+form per day

// Rate limits for Gemini API calls (survey creation, etc.)
const GEMINI_RATE_LIMIT_MS = 30000; // 30 seconds between requests per user
const MAX_GEMINI_REQUESTS_PER_HOUR = 20; // Maximum 20 Gemini requests per user per hour
const MAX_GEMINI_REQUESTS_PER_DAY = 100; // Maximum 100 Gemini requests per user per day

// Reusable function to check user plan and apply rate limiting for Gemini API calls
async function checkGeminiRateLimit(userId, endpointName = 'Gemini API') {
  if (!userId) {
    return { allowed: true, userPlan: 'free' };
  }

  // Check user's subscription plan
  let userPlan = 'free';
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      userPlan = userDoc.data()?.plan || 'free';
    }
  } catch (error) {
    console.error('Error checking user plan:', error);
    // Default to free if check fails
  }

  const isProUser = userPlan === 'pro';
  
  // Pro users get unlimited requests
  if (isProUser) {
    console.log(`✅ [${endpointName}] Pro user ${userId} - unlimited requests`);
    // Still track in-progress to prevent duplicates
    const cached = geminiRequestCache.get(userId);
    if (cached?.inProgress) {
      return {
        allowed: false,
        userPlan: 'pro',
        error: 'Request already in progress. Please wait.',
        retryAfter: 10
      };
    }
    geminiRequestCache.set(userId, {
      lastRequest: Date.now(),
      inProgress: true,
      requestCount: (cached?.requestCount || 0) + 1
    });
    return { allowed: true, userPlan: 'pro' };
  }

  // Rate limiting for free/credit users
  const cacheKey = userId;
  const now = Date.now();
  const cached = geminiRequestCache.get(cacheKey);
  
  // Check if there's a request in progress
  if (cached?.inProgress) {
    console.log(`⚠️ [${endpointName}] Request already in progress for ${cacheKey}`);
    return {
      allowed: false,
      userPlan: 'free',
      error: 'Request already in progress. Please wait.',
      retryAfter: 30,
      requiresUpgrade: true,
      upgradeMessage: 'Upgrade to Pro for unlimited requests with no waiting!'
    };
  }
  
  // Check minimum time between requests (30 seconds)
  if (cached && (now - cached.lastRequest) < GEMINI_RATE_LIMIT_MS) {
    const waitTime = Math.ceil((GEMINI_RATE_LIMIT_MS - (now - cached.lastRequest)) / 1000);
    console.log(`⚠️ [${endpointName}] Rate limit: Request too soon for ${cacheKey}. Wait ${waitTime}s`);
    return {
      allowed: false,
      userPlan: 'free',
      error: `Rate limit exceeded. Please wait ${waitTime} seconds before requesting again.`,
      retryAfter: waitTime,
      requiresUpgrade: true,
      upgradeMessage: 'Upgrade to Pro for unlimited requests with no waiting!'
    };
  }
  
  // Check hourly limit (20 requests per hour)
  if (cached?.hourlyRequests) {
    const hourAgo = now - 3600000; // 1 hour in ms
    const recentRequests = cached.hourlyRequests.filter(timestamp => timestamp > hourAgo);
    if (recentRequests.length >= MAX_GEMINI_REQUESTS_PER_HOUR) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = Math.ceil((3600000 - (now - oldestRequest)) / 1000 / 60); // minutes
      console.log(`⚠️ [${endpointName}] Hourly limit exceeded for ${cacheKey}. ${recentRequests.length}/${MAX_GEMINI_REQUESTS_PER_HOUR} requests in last hour`);
      return {
        allowed: false,
        userPlan: 'free',
        error: `Hourly limit exceeded (${MAX_GEMINI_REQUESTS_PER_HOUR} requests/hour). Please wait ${waitTime} minutes.`,
        retryAfter: waitTime * 60,
        requiresUpgrade: true,
        upgradeMessage: `You've used ${MAX_GEMINI_REQUESTS_PER_HOUR} requests this hour. Upgrade to Pro for unlimited requests!`
      };
    }
    cached.hourlyRequests = recentRequests;
  }
  
  // Check daily limit (100 requests per day)
  if (cached?.dailyRequests) {
    const dayAgo = now - 86400000; // 24 hours in ms
    const recentRequests = cached.dailyRequests.filter(timestamp => timestamp > dayAgo);
    if (recentRequests.length >= MAX_GEMINI_REQUESTS_PER_DAY) {
      console.log(`⚠️ [${endpointName}] Daily limit exceeded for ${cacheKey}. ${recentRequests.length}/${MAX_GEMINI_REQUESTS_PER_DAY} requests in last 24 hours`);
      return {
        allowed: false,
        userPlan: 'free',
        error: `Daily limit exceeded (${MAX_GEMINI_REQUESTS_PER_DAY} requests/day). Please try again tomorrow.`,
        retryAfter: 86400, // 24 hours in seconds
        requiresUpgrade: true,
        upgradeMessage: `You've used ${MAX_GEMINI_REQUESTS_PER_DAY} requests today. Upgrade to Pro for unlimited daily requests!`
      };
    }
    cached.dailyRequests = recentRequests;
  }
  
  // Initialize or update cache
  if (!cached) {
    geminiRequestCache.set(cacheKey, {
      lastRequest: now,
      inProgress: true,
      hourlyRequests: [now],
      dailyRequests: [now],
      requestCount: 1
    });
  } else {
    cached.lastRequest = now;
    cached.inProgress = true;
    cached.requestCount = (cached.requestCount || 0) + 1;
    if (!cached.hourlyRequests) cached.hourlyRequests = [];
    if (!cached.dailyRequests) cached.dailyRequests = [];
    cached.hourlyRequests.push(now);
    cached.dailyRequests.push(now);
  }
  
  // Clean up old cache entries (older than 24 hours)
  for (const [key, value] of geminiRequestCache.entries()) {
    if (now - value.lastRequest > 86400000) {
      geminiRequestCache.delete(key);
    }
  }

  return { allowed: true, userPlan: 'free' };
}

// Function to clear in-progress flag after request completes
function clearGeminiInProgress(userId) {
  if (userId) {
    const cached = geminiRequestCache.get(userId);
    if (cached) {
      cached.inProgress = false;
    }
  }
}

// POST /analyzeSurvey endpoint - Dedicated AI analysis endpoint using Gemini
app.post('/analyzeSurvey', async (req, res) => {
  const { 
    surveyData,
    formTitle,
    responseCount,
    stage,
    formId,
    userId
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

  // Check user's subscription plan - Pro users get unlimited analysis
  let userPlan = 'free';
  if (userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        userPlan = userDoc.data()?.plan || 'free';
      }
    } catch (error) {
      console.error('Error checking user plan:', error);
      // Default to free if check fails
    }
  }

  const isProUser = userPlan === 'pro';
  
  // Rate limiting only applies to free/credit users - Pro users get unlimited
  if (!isProUser && userId && formId) {
    const cacheKey = `${userId}_${formId}`;
    const now = Date.now();
    const cached = analysisRequestCache.get(cacheKey);
    
    // Check if there's a request in progress
    if (cached?.inProgress) {
      console.log(`⚠️ [ANALYSIS] Request already in progress for ${cacheKey}`);
      return res.status(429).json({ 
        error: 'Analysis request already in progress. Please wait.',
        summaryText: '',
        retryAfter: 60,
        requiresUpgrade: true,
        upgradeMessage: 'Upgrade to Pro for unlimited analysis requests!'
      });
    }
    
    // Check minimum time between requests (60 seconds)
    if (cached && (now - cached.lastRequest) < ANALYSIS_RATE_LIMIT_MS) {
      const waitTime = Math.ceil((ANALYSIS_RATE_LIMIT_MS - (now - cached.lastRequest)) / 1000);
      console.log(`⚠️ [ANALYSIS] Rate limit: Request too soon for ${cacheKey}. Wait ${waitTime}s`);
      return res.status(429).json({ 
        error: `Rate limit exceeded. Please wait ${waitTime} seconds before requesting another analysis.`,
        summaryText: '',
        retryAfter: waitTime,
        requiresUpgrade: true,
        upgradeMessage: 'Upgrade to Pro for unlimited analysis requests with no waiting!'
      });
    }
    
    // Check hourly limit (10 requests per hour)
    if (cached?.hourlyRequests) {
      const hourAgo = now - 3600000; // 1 hour in ms
      const recentRequests = cached.hourlyRequests.filter(timestamp => timestamp > hourAgo);
      if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
        const oldestRequest = Math.min(...recentRequests);
        const waitTime = Math.ceil((3600000 - (now - oldestRequest)) / 1000 / 60); // minutes
        console.log(`⚠️ [ANALYSIS] Hourly limit exceeded for ${cacheKey}. ${recentRequests.length}/${MAX_REQUESTS_PER_HOUR} requests in last hour`);
        return res.status(429).json({ 
          error: `Hourly limit exceeded (${MAX_REQUESTS_PER_HOUR} requests/hour). Please wait ${waitTime} minutes.`,
          summaryText: '',
          retryAfter: waitTime * 60,
          requiresUpgrade: true,
          upgradeMessage: `You've used ${MAX_REQUESTS_PER_HOUR} analysis requests this hour. Upgrade to Pro for unlimited requests!`
        });
      }
      cached.hourlyRequests = recentRequests;
    }
    
    // Check daily limit (50 requests per day)
    if (cached?.dailyRequests) {
      const dayAgo = now - 86400000; // 24 hours in ms
      const recentRequests = cached.dailyRequests.filter(timestamp => timestamp > dayAgo);
      if (recentRequests.length >= MAX_REQUESTS_PER_DAY) {
        console.log(`⚠️ [ANALYSIS] Daily limit exceeded for ${cacheKey}. ${recentRequests.length}/${MAX_REQUESTS_PER_DAY} requests in last 24 hours`);
        return res.status(429).json({ 
          error: `Daily limit exceeded (${MAX_REQUESTS_PER_DAY} requests/day). Please try again tomorrow.`,
          summaryText: '',
          retryAfter: 86400, // 24 hours in seconds
          requiresUpgrade: true,
          upgradeMessage: `You've used ${MAX_REQUESTS_PER_DAY} analysis requests today. Upgrade to Pro for unlimited daily requests!`
        });
      }
      cached.dailyRequests = recentRequests;
    }
    
    // Initialize or update cache
    if (!cached) {
      analysisRequestCache.set(cacheKey, {
        lastRequest: now,
        inProgress: true,
        hourlyRequests: [now],
        dailyRequests: [now],
        requestCount: 1
      });
    } else {
      cached.lastRequest = now;
      cached.inProgress = true;
      cached.requestCount = (cached.requestCount || 0) + 1;
      if (!cached.hourlyRequests) cached.hourlyRequests = [];
      if (!cached.dailyRequests) cached.dailyRequests = [];
      cached.hourlyRequests.push(now);
      cached.dailyRequests.push(now);
    }
    
    // Clean up old cache entries (older than 24 hours)
    for (const [key, value] of analysisRequestCache.entries()) {
      if (now - value.lastRequest > 86400000) {
        analysisRequestCache.delete(key);
      }
    }
  } else if (isProUser) {
    console.log(`✅ [ANALYSIS] Pro user ${userId} - unlimited analysis requests`);
    // Still track in-progress to prevent duplicates, but no rate limits
    if (userId && formId) {
      const cacheKey = `${userId}_${formId}`;
      const cached = analysisRequestCache.get(cacheKey);
      if (cached?.inProgress) {
        console.log(`⚠️ [ANALYSIS] Request already in progress for ${cacheKey}`);
        return res.status(429).json({ 
          error: 'Analysis request already in progress. Please wait.',
          summaryText: '',
          retryAfter: 10
        });
      }
      analysisRequestCache.set(cacheKey, {
        lastRequest: Date.now(),
        inProgress: true,
        requestCount: (cached?.requestCount || 0) + 1
      });
    }
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
    
    // Clear in-progress flag on success
    if (userId && formId) {
      const cacheKey = `${userId}_${formId}`;
      const cached = analysisRequestCache.get(cacheKey);
      if (cached) {
        cached.inProgress = false;
        cached.lastRequest = Date.now();
      }
    }
    
    return res.json({ 
      summaryText,
      success: true
    });
    
  } catch (error) {
    console.error('❌ Error calling Gemini API for analysis:', error.response?.data || error.message);
    
    // Clear in-progress flag on error
    if (userId && formId) {
      const cacheKey = `${userId}_${formId}`;
      const cached = analysisRequestCache.get(cacheKey);
      if (cached) {
        cached.inProgress = false;
      }
    }
    
    let errorMessage = 'Failed to generate analysis';
    let statusCode = 500;
    let retryAfter = null;
    
    if (error.response?.status === 401) {
      errorMessage = 'Invalid Gemini API key';
      statusCode = 401;
    } else if (error.response?.status === 429) {
      errorMessage = 'Gemini API rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
      retryAfter = 60; // Suggest waiting 60 seconds
    }
    
    return res.status(statusCode).json({
      error: errorMessage,
      summaryText: '',
      retryAfter
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
    max_tokens = 2048,
    userId
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

  // Rate limiting for Gemini API calls (survey creation)
  const rateLimitCheck = await checkGeminiRateLimit(userId, 'Survey Creation');
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      error: rateLimitCheck.error,
      questions: [],
      retryAfter: rateLimitCheck.retryAfter,
      requiresUpgrade: rateLimitCheck.requiresUpgrade || false,
      upgradeMessage: rateLimitCheck.upgradeMessage || 'Upgrade to Pro for unlimited survey creation!'
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
        
        // Clear in-progress flag on success
        clearGeminiInProgress(userId);
        
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
      // Clear in-progress flag on success
      clearGeminiInProgress(userId);
      if (!json.questions && Array.isArray(json)) {
        return res.json({ questions: json });
      }
      return res.json(json);
    } catch (e) {
      console.error('❌ Failed to parse JSON, returning error response');
      console.error('Raw response:', aiText);
      // Clear in-progress flag even on parse error
      clearGeminiInProgress(userId);
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
        success_url: `${origin}/credit-purchase-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: userId,
          email: email,
          productId: 'credit_pack_9_99',
          creditsAmount: '40',
          purchaseType: 'credit_pack'
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
        success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}&success=true&productId=pro_subscription_29_99&type=subscription`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: userId,
          email: email,
          productId: 'pro_subscription_29_99',
          purchaseType: 'subscription'
        },
        subscription_data: {
          metadata: {
            userId: userId,
            email: email,
            productId: 'pro_subscription_29_99',
            purchaseType: 'subscription'
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

        // ============================================
        // CREDIT PACK PURCHASE HANDLING (ONE-TIME PAYMENT)
        // ============================================
        // This is completely separate from subscription handling
        if (session.mode === 'payment' && (productId === 'credit_pack_9_99' || session.metadata?.purchaseType === 'credit_pack')) {
          console.log(`💰 [CREDIT SYSTEM] Processing credit pack purchase for session ${session.id}`);
          console.log(`   Payment status: ${session.payment_status}`);
          console.log(`   Amount total: ${session.amount_total}`);
          console.log(`   Currency: ${session.currency}`);
          console.log(`   Mode: ${session.mode} (one-time payment)`);

          // For checkout sessions, payment_status might be 'paid' or session might still be processing
          // Let's be more permissive and only skip if clearly unpaid
          if (session.payment_status === 'unpaid' || session.payment_status === 'failed') {
            console.log(`⚠️ [CREDIT SYSTEM] Payment status is ${session.payment_status}, skipping credit addition`);
            return res.json({ received: true, skipped: true, reason: 'Payment not completed', system: 'credit' });
          }

          const creditsAmount = parseInt(session.metadata?.creditsAmount) || 40; // Default to 40 if not specified
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
                
                if (!userDoc.exists) {
                  console.error(`❌ [CREDIT SYSTEM] User document ${foundUserId} does not exist`);
                  return res.status(404).json({ error: 'User not found', system: 'credit' });
                }
                
                const userData = userDoc.data();
                const creditsBefore = userData?.credits ?? 0;

                console.log(`📊 [CREDIT SYSTEM] User ${foundUserId} has ${creditsBefore} credits before purchase`);

                // Use atomic increment to prevent race conditions
                await userRef.update({
                  credits: admin.firestore.FieldValue.increment(creditsAmount),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                const newCredits = creditsBefore + creditsAmount;
                console.log(`✅ [CREDIT SYSTEM] Added ${creditsAmount} credits using atomic increment. Expected new total: ${newCredits}`);
                
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

                console.log(`✅ [CREDIT SYSTEM] VERIFICATION: User ${foundUserId} now has ${actualCredits} credits (expected ${newCredits})`);

                if (actualCredits !== newCredits) {
                  console.error(`❌ [CREDIT SYSTEM] CREDIT MISMATCH! Expected ${newCredits}, got ${actualCredits}`);
                  // Force set to correct value
                  const difference = newCredits - actualCredits;
                  if (difference > 0) {
                    await userRef.update({
                      credits: admin.firestore.FieldValue.increment(difference),
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`🔧 [CREDIT SYSTEM] FORCED credits increment of ${difference} to reach ${newCredits}`);
                  } else {
                    await userRef.update({
                      credits: newCredits,
                      updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`🔧 [CREDIT SYSTEM] FORCED credits to ${newCredits}`);
                  }
                  
                  // Re-verify after fix
                  const finalVerify = await userRef.get();
                  const finalCredits = finalVerify.data()?.credits ?? 0;
                  console.log(`✅ [CREDIT SYSTEM] Final verification: ${finalCredits} credits`);
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

          // User ID found, add credits using atomic increment
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();
          
          if (!userDoc.exists) {
            console.error(`❌ [CREDIT SYSTEM] User document ${userId} does not exist`);
            return res.status(404).json({ error: 'User not found', system: 'credit' });
          }
          
          const userData = userDoc.data();
          const creditsBefore = userData?.credits ?? 0;

          console.log(`📊 [CREDIT SYSTEM] User ${userId} has ${creditsBefore} credits before purchase`);

          // Use atomic increment to prevent race conditions
          await userRef.update({
            credits: admin.firestore.FieldValue.increment(creditsAmount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          const newCredits = creditsBefore + creditsAmount;
          console.log(`✅ [CREDIT SYSTEM] Added ${creditsAmount} credits using atomic increment. Expected new total: ${newCredits}`);
          
          // Record in credit history
          await db.collection('credit_history').add({
            userId: userId,
            action: 'Credit Purchase: Credit Pack',
            creditsUsed: -creditsAmount, // Negative for additions
            creditsBefore: creditsBefore,
            creditsAfter: newCredits,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Verify the update
          const verifyDoc = await userRef.get();
          const verifyData = verifyDoc.data();
          const actualCredits = verifyData?.credits ?? 0;

          console.log(`✅ [CREDIT SYSTEM] VERIFICATION: User ${userId} now has ${actualCredits} credits (expected ${newCredits})`);
              
          if (actualCredits !== newCredits) {
            console.error(`❌ [CREDIT SYSTEM] CREDIT MISMATCH! Expected ${newCredits}, got ${actualCredits}`);
            // Force set to correct value using increment to get to the right total
            const difference = newCredits - actualCredits;
            if (difference > 0) {
              await userRef.update({
                credits: admin.firestore.FieldValue.increment(difference),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              console.log(`🔧 [CREDIT SYSTEM] FORCED credits increment of ${difference} to reach ${newCredits}`);
            } else {
              // If somehow we have more credits, we need to set directly
              await userRef.update({
                credits: newCredits,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              console.log(`🔧 [CREDIT SYSTEM] FORCED credits to ${newCredits}`);
            }
            
            // Re-verify after fix
            const finalVerify = await userRef.get();
            const finalCredits = finalVerify.data()?.credits ?? 0;
            console.log(`✅ [CREDIT SYSTEM] Final verification: ${finalCredits} credits`);
          }

          return res.json({
            received: true,
            system: 'credit',
            purchaseType: 'credit_pack',
            creditsAdded: creditsAmount,
            newBalance: actualCredits,
            userId: userId
          });
        }

        // ============================================
        // SUBSCRIPTION HANDLING (RECURRING PAYMENT)
        // ============================================
        // Subscriptions are handled via customer.subscription.* events below
        // This checkout.session.completed for subscriptions just logs for now
        if (session.mode === 'subscription' && (productId === 'pro_subscription_29_99' || session.metadata?.purchaseType === 'subscription')) {
          console.log(`📝 [SUBSCRIPTION SYSTEM] Subscription checkout completed for session ${session.id}`);
          console.log(`   Subscription ID: ${session.subscription}`);
          console.log(`   Mode: ${session.mode} (recurring subscription)`);
          console.log(`   Note: Subscription activation handled via customer.subscription.updated event`);
          // Subscription activation is handled by customer.subscription.updated webhook
          return res.json({ received: true, system: 'subscription', note: 'Subscription will be activated via subscription.updated event' });
        }

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

// Manual credit addition endpoint (for testing - DEV ONLY)
app.post('/addCreditsTest', async (req, res) => {
  // SECURITY: Only allow in development
  if (process.env.NODE_ENV === 'production' || process.env.FIREBASE_FUNCTIONS) {
    console.error('❌ [SECURITY] addCreditsTest endpoint called in production - BLOCKED');
    return res.status(403).json({ error: 'This endpoint is only available in development' });
  }

  try {
    const { userId, creditsAmount = 40 } = req.body;
    console.log(`🧪 [DEV ONLY] MANUAL CREDIT TEST: Adding ${creditsAmount} credits to user ${userId}`);

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

// Manual webhook simulation endpoint (for testing - DEV ONLY)
app.post('/simulateWebhook', async (req, res) => {
  // SECURITY: Only allow in development
  if (process.env.NODE_ENV === 'production' || process.env.FIREBASE_FUNCTIONS) {
    console.error('❌ [SECURITY] simulateWebhook endpoint called in production - BLOCKED');
    return res.status(403).json({ error: 'This endpoint is only available in development' });
  }

  try {
    const { userId, productId = 'credit_pack_9_99', paymentStatus = 'paid' } = req.body;

    console.log(`🎭 [DEV ONLY] SIMULATING WEBHOOK: ${productId} for user ${userId}`);

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

// Check and process missed credit purchases from Stripe
// SECURITY: This endpoint has multiple safeguards to prevent abuse
app.post('/checkMissedCreditPurchases', async (req, res) => {
  try {
    const { userId } = req.body;
    const authToken = req.headers.authorization;

    console.log(`🔍 [CREDIT SYSTEM] Checking for missed credit purchases for user ${userId}`);

    // Verify authentication
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken || decodedToken.uid !== userId) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // SECURITY: Rate limiting - check if user has called this recently (within last 5 minutes)
    const rateLimitKey = `checkMissedCredits_${userId}`;
    const rateLimitDoc = await db.collection('rate_limits').doc(rateLimitKey).get();
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    if (rateLimitDoc.exists) {
      const rateLimitData = rateLimitDoc.data();
      const lastCall = rateLimitData?.lastCall?.toDate()?.getTime() || 0;
      
      if (lastCall > fiveMinutesAgo) {
        const timeRemaining = Math.ceil((lastCall + (5 * 60 * 1000) - now) / 1000);
        console.log(`⚠️ [CREDIT SYSTEM] Rate limit: User ${userId} called this endpoint too recently`);
        return res.status(429).json({ 
          error: 'Please wait before checking again',
          retryAfter: timeRemaining,
          message: `You can only check for missed purchases once every 5 minutes. Please wait ${timeRemaining} seconds.`
        });
      }
    }

    // Update rate limit
    await db.collection('rate_limits').doc(rateLimitKey).set({
      lastCall: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId
    }, { merge: true });

    // Get user's Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData?.stripeCustomerId) {
      return res.json({ 
        success: true, 
        message: 'No Stripe customer ID found',
        processed: 0 
      });
    }

    // Get recent checkout sessions for this customer (last 30 days only)
    const thirtyDaysAgo = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);
    const sessions = await stripeClient.checkout.sessions.list({
      customer: userData.stripeCustomerId,
      limit: 20,
      created: { gte: thirtyDaysAgo } // Only check sessions from last 30 days
    });

    let processedCount = 0;
    const results = [];

    // Track processed session IDs to prevent duplicates in this run
    const processedSessionIds = new Set();

    for (const session of sessions.data) {
      // Only process paid credit pack purchases
      if (session.mode === 'payment' && 
          session.payment_status === 'paid' &&
          (session.metadata?.productId === 'credit_pack_9_99' || 
           session.metadata?.productId === 'credit_pack_9_99' ||
           session.metadata?.purchaseType === 'credit_pack')) {
        
        const sessionId = session.id;
        
        // Skip if already processed in this run
        if (processedSessionIds.has(sessionId)) {
          continue;
        }
        
        const creditsAmount = parseInt(session.metadata?.creditsAmount) || 40;
        
        // SECURITY: Check credit history to see if this session was already processed
        // Check by sessionId first (most reliable)
        const sessionIdCheck = await db.collection('credit_history')
          .where('userId', '==', userId)
          .where('sessionId', '==', sessionId)
          .limit(1)
          .get();

        if (!sessionIdCheck.empty) {
          console.log(`✅ [CREDIT SYSTEM] Session ${sessionId} already processed (found in history)`);
          continue; // Already processed, skip
        }

        // Also check by timestamp window as backup
        const historyQuery = await db.collection('credit_history')
          .where('userId', '==', userId)
          .limit(50)
          .get();
        
        // Filter for credit pack purchases and check timestamps
        const creditPurchases = historyQuery.docs.filter(doc => {
          const action = doc.data().action;
          return action === 'Credit Purchase: Credit Pack' || 
                 action === 'Credit Purchase: Credit Pack (Recovered)' ||
                 (action && action.includes('Credit Pack'));
        });

        const sessionTime = new Date(session.created * 1000);
        const tenMinutesAfter = new Date(sessionTime.getTime() + 10 * 60 * 1000);
        const tenMinutesBefore = new Date(sessionTime.getTime() - 10 * 60 * 1000);

        const alreadyProcessedByTime = creditPurchases.some(doc => {
          const purchaseData = doc.data();
          const purchaseTime = purchaseData.timestamp?.toDate();
          const purchaseCredits = Math.abs(purchaseData.creditsUsed || 0);
          // Check if purchase happened around the same time with same amount
          return purchaseTime && 
                 purchaseTime >= tenMinutesBefore && 
                 purchaseTime <= tenMinutesAfter &&
                 purchaseCredits === creditsAmount;
        });

        if (alreadyProcessedByTime) {
          console.log(`✅ [CREDIT SYSTEM] Session ${sessionId} already processed (found by timestamp)`);
          continue; // Already processed, skip
        }

        // SECURITY: Verify the session is actually paid and valid
        if (session.payment_status !== 'paid') {
          console.log(`⚠️ [CREDIT SYSTEM] Session ${sessionId} not paid, skipping`);
          continue;
        }

        // SECURITY: Verify amount matches credit pack price (€9.99 = 999 cents)
        if (session.amount_total !== 999) {
          console.log(`⚠️ [CREDIT SYSTEM] Session ${sessionId} amount mismatch: ${session.amount_total}, expected 999`);
          continue;
        }

        console.log(`💰 [CREDIT SYSTEM] Found unprocessed credit purchase: ${sessionId}`);
        
        // Process this purchase using atomic increment
        const userRef = db.collection('users').doc(userId);
        const currentUserDoc = await userRef.get();
        const currentCredits = currentUserDoc.data()?.credits ?? 0;

        await userRef.update({
          credits: admin.firestore.FieldValue.increment(creditsAmount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const newCredits = currentCredits + creditsAmount;

        // Record in credit history with sessionId for future duplicate detection
        await db.collection('credit_history').add({
          userId: userId,
          action: 'Credit Purchase: Credit Pack (Recovered)',
          creditsUsed: -creditsAmount,
          creditsBefore: currentCredits,
          creditsAfter: newCredits,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          sessionId: sessionId, // Store sessionId to prevent duplicates
          recoveredAt: admin.firestore.FieldValue.serverTimestamp()
        });

        processedSessionIds.add(sessionId);
        processedCount++;
        results.push({
          sessionId: sessionId,
          creditsAdded: creditsAmount,
          newBalance: newCredits,
          sessionCreated: new Date(session.created * 1000).toISOString()
        });

        console.log(`✅ [CREDIT SYSTEM] Processed missed purchase: Added ${creditsAmount} credits for session ${sessionId}`);
      }
    }

    // Get final credit balance
    const finalDoc = await db.collection('users').doc(userId).get();
    const finalCredits = finalDoc.data()?.credits ?? 0;

    return res.json({
      success: true,
      processed: processedCount,
      results: results,
      currentCredits: finalCredits,
      message: processedCount > 0 
        ? `Processed ${processedCount} missed credit purchase(s)` 
        : 'No missed purchases found'
    });
  } catch (error) {
    console.error('❌ [CREDIT SYSTEM] Error checking missed purchases:', error);
    res.status(500).json({ error: error.message || 'Failed to check missed purchases' });
  }
});

// ============================================
// SIMPLE CREDIT PURCHASE COMPLETION (NO WEBHOOKS)
// ============================================
// This endpoint verifies payment and adds credits directly
// Used by the success page after Stripe checkout
app.post('/completeCreditPurchase', async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    const authToken = req.headers.authorization;

    console.log(`💰 [CREDIT SYSTEM] Completing credit purchase for user ${userId}, session ${sessionId}`);

    // Verify authentication
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken || decodedToken.uid !== userId) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Retrieve and verify the Stripe session
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    // CRITICAL: Verify payment was completed FIRST - no credits without successful payment
    if (session.payment_status !== 'paid') {
      console.error(`❌ [CREDIT SYSTEM] Payment not completed for session ${sessionId}. Status: ${session.payment_status}`);
      return res.status(400).json({ 
        error: 'Payment not completed. Credits will only be added after successful payment.',
        paymentStatus: session.payment_status
      });
    }

    // Verify it's a credit pack purchase (not subscription)
    if (session.mode !== 'payment') {
      return res.status(400).json({ error: 'This endpoint is for one-time credit purchases only' });
    }

    if (session.metadata?.productId !== 'credit_pack_9_99' && session.metadata?.purchaseType !== 'credit_pack') {
      return res.status(400).json({ error: 'This session is not a credit pack purchase' });
    }

    // Verify amount matches (€9.99 = 999 cents)
    if (session.amount_total !== 999) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    // Verify the session customer matches the user's Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (userData?.stripeCustomerId && session.customer && session.customer !== userData.stripeCustomerId) {
      console.error(`❌ [CREDIT SYSTEM] Customer ID mismatch. Session customer: ${session.customer}, User customer: ${userData.stripeCustomerId}`);
      return res.status(403).json({ error: 'Session customer does not match user account' });
    }

    // Check if this session was already processed (prevent duplicates)
    const sessionIdCheck = await db.collection('credit_history')
      .where('userId', '==', userId)
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get();

    if (!sessionIdCheck.empty) {
      // Already processed, return current credits
      const currentCredits = userData?.credits ?? 0;
      console.log(`✅ [CREDIT SYSTEM] Session ${sessionId} already processed. User has ${currentCredits} credits`);
      return res.json({
        success: true,
        credits: currentCredits,
        creditsAdded: 0,
        alreadyProcessed: true,
        message: 'Credits already added for this session'
      });
    }

    // Get user document reference (userDoc already retrieved above for customer verification)
    const userRef = db.collection('users').doc(userId);
    const creditsBefore = userData?.credits ?? 0;
    const creditsAmount = 40; // Fixed amount for credit pack

    // Add credits using atomic increment (prevents race conditions)
    await userRef.update({
      credits: admin.firestore.FieldValue.increment(creditsAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const newCredits = creditsBefore + creditsAmount;

    // Record in credit history
    await db.collection('credit_history').add({
      userId: userId,
      action: 'Credit Purchase: Credit Pack',
      creditsUsed: -creditsAmount, // Negative for additions
      creditsBefore: creditsBefore,
      creditsAfter: newCredits,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sessionId: sessionId
    });

    // Verify the update
    const verifyDoc = await userRef.get();
    const actualCredits = verifyDoc.data()?.credits ?? 0;

    console.log(`✅ [CREDIT SYSTEM] Added ${creditsAmount} credits for session ${sessionId}. User now has ${actualCredits} credits`);

    return res.json({
      success: true,
      credits: actualCredits,
      creditsAdded: creditsAmount,
      creditsBefore: creditsBefore,
      creditsAfter: actualCredits,
      message: `Successfully added ${creditsAmount} credits`
    });
  } catch (error) {
    console.error('❌ [CREDIT SYSTEM] Error completing credit purchase:', error);
    res.status(500).json({ error: error.message || 'Failed to complete credit purchase' });
  }
});

// Manual credit fix endpoint (for fixing missed webhook payments)
// SECURITY: This should only be used by admins or in development
app.post('/fixCredits', async (req, res) => {
  try {
    const { userId, creditsAmount = 40, reason = 'Manual credit fix' } = req.body;
    const authToken = req.headers.authorization;

    console.log(`🔧 [CREDIT SYSTEM] Manual credit fix requested for user ${userId}, amount: ${creditsAmount}`);

    // SECURITY: In production, only allow admins or restrict usage
    if (process.env.NODE_ENV === 'production' || process.env.FIREBASE_FUNCTIONS) {
      // In production, require admin role or special authorization
      // For now, we'll still allow users to fix their own credits but with stricter limits
      console.log(`⚠️ [SECURITY] Manual credit fix called in production for user ${userId}`);
    }

    // Verify authentication
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    // SECURITY: Rate limiting for manual fixes (once per hour)
    const rateLimitKey = `fixCredits_${userId}`;
    const rateLimitDoc = await db.collection('rate_limits').doc(rateLimitKey).get();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    if (rateLimitDoc.exists) {
      const rateLimitData = rateLimitDoc.data();
      const lastCall = rateLimitData?.lastCall?.toDate()?.getTime() || 0;
      
      if (lastCall > oneHourAgo && decodedToken.uid !== 'admin') {
        const timeRemaining = Math.ceil((lastCall + (60 * 60 * 1000) - now) / 1000 / 60);
        console.log(`⚠️ [SECURITY] Rate limit: User ${userId} called fixCredits too recently`);
        return res.status(429).json({ 
          error: 'Please wait before requesting another manual fix',
          retryAfter: timeRemaining,
          message: `You can only request a manual credit fix once per hour. Please wait ${timeRemaining} minutes.`
        });
      }
    }

    // Only allow user to fix their own credits OR admin
    if (decodedToken.uid !== userId && decodedToken.uid !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to add credits for this user' });
    }

    // SECURITY: Limit credit amount in production (max 200 credits per fix)
    const maxCredits = process.env.NODE_ENV === 'production' || process.env.FIREBASE_FUNCTIONS ? 200 : 1000;
    if (creditsAmount > maxCredits) {
      return res.status(400).json({ 
        error: `Credit amount exceeds maximum allowed (${maxCredits})`,
        maxAllowed: maxCredits
      });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Update rate limit
    await db.collection('rate_limits').doc(rateLimitKey).set({
      lastCall: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId
    }, { merge: true });

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      await userRef.set({
        credits: creditsAmount,
        plan: 'free',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({
        success: true,
        userId: userId,
        creditsAdded: creditsAmount,
        creditsBefore: 0,
        creditsAfter: creditsAmount,
        message: `Successfully created user with ${creditsAmount} credits`
      });
    }

    const userData = userDoc.data();
    const creditsBefore = userData?.credits ?? 0;

    // Update existing credits atomically
    await userRef.update({
      credits: admin.firestore.FieldValue.increment(creditsAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

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

    console.log(`✅ [CREDIT SYSTEM] Manual credit fix: User ${userId} now has ${verifyData?.credits ?? 0} credits`);

    res.json({
      success: true,
      userId: userId,
      creditsAdded: creditsAmount,
      creditsBefore: creditsBefore,
      creditsAfter: verifyData?.credits ?? 0,
      message: `Successfully added ${creditsAmount} credits`
    });
  } catch (error) {
    console.error('❌ [CREDIT SYSTEM] Error in manual credit fix:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CREDIT SYSTEM ENDPOINTS (ONE-TIME PAYMENTS)
// ============================================

// Verify credit purchase endpoint (separate from subscription sync)
app.post('/verifyCreditPurchase', async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    const authToken = req.headers.authorization;

    console.log(`💰 [CREDIT SYSTEM] Verifying credit purchase for user ${userId}, session ${sessionId}`);

    // Verify authentication
    if (!authToken) {
      console.error('❌ [CREDIT SYSTEM] No authorization token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken) {
      console.error('❌ [CREDIT SYSTEM] Invalid or expired auth token');
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    if (decodedToken.uid !== userId) {
      console.error('❌ [CREDIT SYSTEM] User ID mismatch:', { provided: userId, authenticated: decodedToken.uid });
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!stripeClient) {
      console.error('❌ [CREDIT SYSTEM] Stripe client not configured');
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Get user's current credit balance
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const currentCredits = userData?.credits ?? 0;

    // If sessionId provided, verify with Stripe
    if (sessionId) {
      try {
        const session = await stripeClient.checkout.sessions.retrieve(sessionId);
        
        // Only process if it's a credit pack purchase
        if (session.mode === 'payment' && 
            (session.metadata?.productId === 'credit_pack_9_99' || session.metadata?.purchaseType === 'credit_pack')) {
          
          if (session.payment_status === 'paid') {
            // Check if credits were already added (webhook might have processed)
            const creditsAmount = parseInt(session.metadata?.creditsAmount) || 40;
            
            // Check credit history to see if this purchase was already processed
            const creditHistoryQuery = await db.collection('credit_history')
              .where('userId', '==', userId)
              .where('action', '==', 'Credit Purchase: Credit Pack')
              .orderBy('timestamp', 'desc')
              .limit(1)
              .get();

            const recentPurchase = creditHistoryQuery.docs[0]?.data();
            const purchaseTime = recentPurchase?.timestamp?.toDate();
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            if (recentPurchase && purchaseTime && purchaseTime > fiveMinutesAgo) {
              // Recent purchase found, credits likely already added
              return res.json({
                success: true,
                system: 'credit',
                credits: currentCredits,
                message: 'Credit purchase already processed',
                alreadyProcessed: true
              });
            }

            // Purchase verified but credits not yet added - return current state
            return res.json({
              success: true,
              system: 'credit',
              credits: currentCredits,
              sessionVerified: true,
              paymentStatus: session.payment_status,
              message: 'Purchase verified, credits processing'
            });
          } else {
            return res.json({
              success: false,
              system: 'credit',
              message: 'Payment not completed',
              paymentStatus: session.payment_status
            });
          }
        } else {
          return res.status(400).json({ 
            error: 'This endpoint is for credit purchases only. Use /syncSubscription for subscriptions.',
            system: 'credit'
          });
        }
      } catch (stripeError) {
        console.error('❌ [CREDIT SYSTEM] Error retrieving Stripe session:', stripeError);
        // Still return current credits even if session lookup fails
        return res.json({
          success: true,
          system: 'credit',
          credits: currentCredits,
          message: 'Could not verify session, but returning current credit balance'
        });
      }
    }

    // No sessionId - just return current credits
    return res.json({
      success: true,
      system: 'credit',
      credits: currentCredits
    });
  } catch (error) {
    console.error('❌ [CREDIT SYSTEM] Error verifying credit purchase:', error);
    res.status(500).json({ error: error.message || 'Failed to verify credit purchase', system: 'credit' });
  }
});

// ============================================
// SUBSCRIPTION SYSTEM ENDPOINTS (RECURRING PAYMENTS)
// ============================================

// Get subscription details
app.get('/getSubscription', async (req, res) => {
  try {
    const userId = req.query.userId;
    const authToken = req.headers.authorization;

    console.log(`📝 [SUBSCRIPTION SYSTEM] Getting subscription for user ${userId}`);

    // Verify authentication
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken || decodedToken.uid !== userId) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Get user's Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData?.stripeCustomerId) {
      return res.json({ 
        hasSubscription: false,
        subscription: null,
        plan: 'free'
      });
    }

    // Get subscriptions from Stripe
    const subscriptions = await stripeClient.subscriptions.list({
      customer: userData.stripeCustomerId,
      limit: 1,
      status: 'all'
    });

    if (subscriptions.data.length === 0) {
      return res.json({ 
        hasSubscription: false,
        subscription: null,
        plan: 'free'
      });
    }

    const subscription = subscriptions.data[0];
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    return res.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        plan: isActive ? 'pro' : 'free'
      },
      plan: isActive ? 'pro' : 'free'
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION SYSTEM] Error getting subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to get subscription' });
  }
});

// Cancel subscription
app.post('/cancelSubscription', async (req, res) => {
  try {
    const { userId } = req.body;
    const authToken = req.headers.authorization;

    console.log(`📝 [SUBSCRIPTION SYSTEM] Canceling subscription for user ${userId}`);

    // Verify authentication
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken || decodedToken.uid !== userId) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Get user's subscription
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData?.stripeCustomerId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Get active subscription
    const subscriptions = await stripeClient.subscriptions.list({
      customer: userData.stripeCustomerId,
      limit: 1,
      status: 'all'
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const subscription = subscriptions.data[0];

    // Cancel at period end (don't cancel immediately)
    const canceledSubscription = await stripeClient.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });

    console.log(`✅ [SUBSCRIPTION SYSTEM] Subscription ${subscription.id} will cancel at period end`);

    return res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION SYSTEM] Error canceling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
app.post('/reactivateSubscription', async (req, res) => {
  try {
    const { userId } = req.body;
    const authToken = req.headers.authorization;

    console.log(`📝 [SUBSCRIPTION SYSTEM] Reactivating subscription for user ${userId}`);

    // Verify authentication
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken || decodedToken.uid !== userId) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }

    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Get user's subscription
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData?.stripeCustomerId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Get subscription
    const subscriptions = await stripeClient.subscriptions.list({
      customer: userData.stripeCustomerId,
      limit: 1,
      status: 'all'
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const subscription = subscriptions.data[0];

    // Reactivate by removing cancel_at_period_end
    const reactivatedSubscription = await stripeClient.subscriptions.update(subscription.id, {
      cancel_at_period_end: false
    });

    console.log(`✅ [SUBSCRIPTION SYSTEM] Subscription ${subscription.id} reactivated`);

    return res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscription: {
        id: reactivatedSubscription.id,
        status: reactivatedSubscription.status,
        cancelAtPeriodEnd: reactivatedSubscription.cancel_at_period_end,
        currentPeriodEnd: new Date(reactivatedSubscription.current_period_end * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [SUBSCRIPTION SYSTEM] Error reactivating subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to reactivate subscription' });
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
    console.log('📝 [SUBSCRIPTION SYSTEM] Creating customer portal session request received');
    
    const { userId, returnUrl } = req.body;
    const authToken = req.headers.authorization;

    // Verify authentication
    if (!authToken) {
      console.error('❌ [SUBSCRIPTION SYSTEM] No authorization token provided');
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const decodedToken = await verifyAuthToken(authToken);
    if (!decodedToken) {
      console.error('❌ [SUBSCRIPTION SYSTEM] Invalid or expired auth token');
      return res.status(401).json({ error: 'Invalid or expired authentication. Please sign in again.' });
    }

    // Verify userId matches the authenticated user
    if (decodedToken.uid !== userId) {
      console.error('❌ [SUBSCRIPTION SYSTEM] User ID mismatch:', { provided: userId, authenticated: decodedToken.uid });
      return res.status(403).json({ error: 'User ID does not match authenticated user.' });
    }

    if (!userId) {
      console.error('❌ [SUBSCRIPTION SYSTEM] userId is required');
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!stripeClient) {
      console.error('❌ [SUBSCRIPTION SYSTEM] Stripe client not configured');
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Get user's Stripe customer ID
    console.log(`📝 [SUBSCRIPTION SYSTEM] Fetching user data for ${userId}`);
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error(`❌ [SUBSCRIPTION SYSTEM] User document not found for ${userId}`);
      return res.status(404).json({ error: 'User not found. Please complete a purchase first.' });
    }
    
    const userData = userDoc.data();
    console.log(`📝 [SUBSCRIPTION SYSTEM] User data retrieved. Has stripeCustomerId: ${!!userData?.stripeCustomerId}`);

    if (!userData?.stripeCustomerId) {
      console.error(`❌ [SUBSCRIPTION SYSTEM] No Stripe customer ID found for user ${userId}`);
      return res.status(404).json({ 
        error: 'No Stripe customer found for this user. Please complete a purchase first to create a customer account.',
        code: 'NO_CUSTOMER_ID'
      });
    }

    // Determine return URL
    const finalReturnUrl = returnUrl || `${req.headers.origin || 'http://localhost:5173'}/profile`;
    console.log(`📝 [SUBSCRIPTION SYSTEM] Creating portal session for customer ${userData.stripeCustomerId}`);
    console.log(`   Return URL: ${finalReturnUrl}`);

    try {
      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: userData.stripeCustomerId,
        return_url: finalReturnUrl,
      });

      console.log(`✅ [SUBSCRIPTION SYSTEM] Portal session created: ${portalSession.id}`);
      res.json({ url: portalSession.url });
    } catch (stripeError) {
      console.error('❌ [SUBSCRIPTION SYSTEM] Stripe API error:', stripeError);
      console.error('   Error type:', stripeError.type);
      console.error('   Error code:', stripeError.code);
      console.error('   Error message:', stripeError.message);
      
      // Handle specific Stripe errors
      if (stripeError.code === 'resource_missing') {
        return res.status(404).json({ 
          error: 'Stripe customer not found. Please contact support.',
          code: 'STRIPE_CUSTOMER_NOT_FOUND'
        });
      }
      
      // Handle billing portal configuration error
      if (stripeError.message && stripeError.message.includes('No configuration provided')) {
        console.error('❌ [SUBSCRIPTION SYSTEM] Billing portal not configured in Stripe dashboard');
        return res.status(500).json({ 
          error: 'Billing portal is not configured. Please configure it in the Stripe dashboard at https://dashboard.stripe.com/test/settings/billing/portal (test mode) or https://dashboard.stripe.com/settings/billing/portal (live mode).',
          code: 'BILLING_PORTAL_NOT_CONFIGURED',
          setupUrl: process.env.NODE_ENV === 'production' 
            ? 'https://dashboard.stripe.com/settings/billing/portal'
            : 'https://dashboard.stripe.com/test/settings/billing/portal'
        });
      }
      
      // Handle other Stripe API errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          error: stripeError.message || 'Invalid request to Stripe',
          code: stripeError.code || 'STRIPE_INVALID_REQUEST'
        });
      }
      
      return res.status(500).json({ 
        error: stripeError.message || 'Failed to create customer portal session',
        code: stripeError.code || 'STRIPE_ERROR'
      });
    }
  } catch (error) {
    console.error('❌ [SUBSCRIPTION SYSTEM] Unexpected error creating customer portal session:', error);
    console.error('   Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'An unexpected error occurred while creating the portal session',
      code: 'INTERNAL_ERROR'
    });
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
    console.log(`   - GET  http://localhost:${PORT}/getSubscription (Subscription System - Get Details)`);
    console.log(`   - POST http://localhost:${PORT}/cancelSubscription (Subscription System - Cancel)`);
    console.log(`   - POST http://localhost:${PORT}/reactivateSubscription (Subscription System - Reactivate)`);
    console.log(`   - POST http://localhost:${PORT}/verifyCreditPurchase (Credit System - Verify Purchase)`);
    console.log(`   - POST http://localhost:${PORT}/checkMissedCreditPurchases (Credit System - Check Missed)`);
    console.log(`   - POST http://localhost:${PORT}/fixCredits (Credit System - Manual Fix)`);
    console.log(`   - POST http://localhost:${PORT}/syncSubscription (Subscription System - Manual Sync)`);
    console.log(`   - POST http://localhost:${PORT}/addCreditsTest (Credit System - Manual Test)`);
    console.log(`   - POST http://localhost:${PORT}/simulateWebhook (Webhook Simulation)`);
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