// Simple test to check if frontend can reach backend
// Run this in the browser console

fetch('http://localhost:5001/api/health')
  .then(response => response.json())
  .then(data => console.log('Backend reachable:', data))
  .catch(error => console.error('Backend not reachable:', error));
