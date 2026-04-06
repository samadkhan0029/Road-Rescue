// Test script for Road Rescue API
const io = require('socket.io-client');

console.log('Testing Road Rescue API...');

// Test 1: Health Check
fetch('http://localhost:5001/api/health')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Health Check:', data.message);
  })
  .catch(err => console.log('❌ Health Check Failed:', err.message));

// Test 2: Geolocation
fetch('http://localhost:5001/api/geolocation/reverse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lat: 19.0760, lng: 72.8777 })
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Geolocation:', data.success ? data.address.split(',')[0] : 'Failed');
  })
  .catch(err => console.log('❌ Geolocation Failed:', err.message));

// Test 3: Socket.io Connection
const socket = io('http://localhost:5001');

socket.on('connect', () => {
  console.log('✅ Socket.io Connected');
  
  // Test 4: Submit Request
  const requestData = {
    customerId: 'test_user',
    customerName: 'Test User',
    customerPhone: '+1234567890',
    serviceType: 'Towing',
    location: { lat: 19.0760, lng: 72.8777 },
    address: 'Test Location'
  };

  fetch('http://localhost:5001/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('✅ Request Submitted:', data.request._id);
        
        // Join request room for updates
        socket.emit('join-request', data.request._id);
        console.log('✅ Joined request room for real-time updates');
      } else {
        console.log('❌ Request Submission Failed:', data.error);
      }
    })
    .catch(err => console.log('❌ Request Submission Failed:', err.message));
});

socket.on('request-update', (data) => {
  console.log('✅ Real-time Update:', data.status, '-', data.message);
  if (data.provider) {
    console.log('  Provider:', data.provider.providerName);
    console.log('  Distance:', data.provider.distance, 'km');
    console.log('  ETA:', Math.ceil(data.provider.distance * 3), 'minutes');
  }
});

socket.on('connect_error', (err) => {
  console.log('❌ Socket.io Connection Failed:', err.message);
});

setTimeout(() => {
  console.log('\n🎉 Test completed! Check the browser preview to test the full UI flow.');
  process.exit(0);
}, 5000);
