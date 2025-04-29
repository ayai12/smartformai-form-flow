require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Use CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Get OpenAI API key from .env
const OPENAI_API_KEY = process.env.ChatGbtKey;
if (!OPENAI_API_KEY) {
  console.error('OpenAI API key not found in .env (ChatGbtKey)');
  process.exit(1);
}

// POST /chat endpoint
app.post('/chat', async (req, res) => {
  // Expect: { prompt: string } in the body
  const { prompt, model = "gpt-4.1-mini", temperature = 0.7, max_tokens = 512 } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body.' });
  }

  // Build the special system/user prompt
  const aiPrompt = `Using the following prompt:\n${prompt}\nI want you to generate a customer survey based on that. Please create appropriate questions and return the output in JSON format.\nI want you create at least 5 questions  \nEach question should clearly specify its type:\nIf it’s a text response, set the type as \"text box\".\nIf it’s a rating question, set the type as \"rating\" and include the full scale using numbers (e.g., \"1\", \"2\", ..., \"5\").\nIf it’s a multiple choice question, set the type as \"multiple choice\" and provide a list of options.\nPlease only return the json format and nothing else don't add any other thing except the json.`;

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

app.get('/', (req, res) => {
  res.send('ChatGPT Express backend is running!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
