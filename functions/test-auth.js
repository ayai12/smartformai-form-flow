const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Simple function to test authentication
async function testAuth() {
  try {
    console.log('Attempting to list users...');
    const listUsersResult = await admin.auth().listUsers(10);
    console.log('Successfully listed users:', listUsersResult.users.length);
    console.log('Authentication with service account is working!');
  } catch (error) {
    console.error('Error listing users:', error);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.error('\nPERMISSION ERROR: The service account lacks necessary permissions.');
      console.error('Please add the "Firebase Authentication Admin" role (roles/firebaseauth.admin) to your service account.');
    }
  }
}

// Run the test
testAuth(); 