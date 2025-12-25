// Test script for student admission functionality
const { spawn } = require('child_process');

console.log('Testing student admission functionality...');

// Test 1: Check if the server is running
console.log('Test 1: Checking if server is accessible...');
const curl = spawn('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:3001']);

curl.stdout.on('data', (data) => {
  const statusCode = data.toString().trim();
  if (statusCode === '200') {
    console.log('✓ Server is accessible');
  } else {
    console.log('✗ Server is not accessible (HTTP ' + statusCode + ')');
  }
});

curl.on('error', (error) => {
  console.log('✗ Failed to check server accessibility:', error.message);
});

curl.on('close', (code) => {
  console.log('Test 1 completed');
});