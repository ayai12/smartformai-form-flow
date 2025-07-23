#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 SmartFormAI Environment Setup\n');

const questions = [
  {
    name: 'OPENAI_API_KEY',
    message: 'Enter your OpenAI API key:',
    required: true
  },
  {
    name: 'FIREBASE_PROJECT_ID',
    message: 'Enter your Firebase Project ID (default: smartformai-51e03):',
    default: 'smartformai-51e03'
  },
  {
    name: 'SERVICE_ACCOUNT_METHOD',
    message: 'How do you want to configure Firebase service account?\n1. JSON string (recommended for production)\n2. File path (for local development)\nEnter choice (1 or 2):',
    validate: (input) => ['1', '2'].includes(input) ? true : 'Please enter 1 or 2'
  }
];

const envContent = [];

async function askQuestion(question, index) {
  return new Promise((resolve) => {
    rl.question(question.message, (answer) => {
      if (question.validate) {
        const validation = question.validate(answer);
        if (validation !== true) {
          console.log(validation);
          askQuestion(question, index).then(resolve);
          return;
        }
      }
      
      if (!answer && question.default) {
        answer = question.default;
      }
      
      if (answer || !question.required) {
        envContent.push(`${question.name}=${answer}`);
      }
      
      resolve();
    });
  });
}

async function setupEnvironment() {
  try {
    for (let i = 0; i < questions.length; i++) {
      await askQuestion(questions[i], i);
    }
    
    // Handle service account configuration
    const serviceAccountMethod = envContent.find(line => line.startsWith('SERVICE_ACCOUNT_METHOD='));
    if (serviceAccountMethod) {
      const method = serviceAccountMethod.split('=')[1];
      envContent.splice(envContent.indexOf(serviceAccountMethod), 1); // Remove the method line
      
      if (method === '1') {
        console.log('\n📝 For FIREBASE_SERVICE_ACCOUNT, you need to:');
        console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
        console.log('2. Click "Generate new private key"');
        console.log('3. Copy the entire JSON content');
        console.log('4. Add it to your .env file as: FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}');
        envContent.push('# FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"smartformai-51e03",...}');
      } else {
        envContent.push('FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json');
        console.log('\n📁 Make sure to place your serviceAccountKey.json file in the functions directory');
      }
    }
    
    // Write .env file
    const envPath = path.join(__dirname, '.env');
    const content = envContent.join('\n') + '\n';
    
    fs.writeFileSync(envPath, content);
    
    console.log('\n✅ .env file created successfully!');
    console.log('📁 Location:', envPath);
    console.log('\n🔒 Remember: Never commit your .env file to version control');
    console.log('🚀 You can now start your server with: npm run serve');
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  } finally {
    rl.close();
  }
}

setupEnvironment(); 