// Comprehensive debugging script for frontend-backend connectivity
// Copy and paste this into the browser console

async function debugConnectivity() {
    console.log('🔍 Starting comprehensive connectivity debug...\n');
    
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing basic connectivity...');
    try {
        const response = await fetch('http://localhost:5001/api/health');
        const data = await response.json();
        console.log('✅ Basic connectivity successful:', data);
    } catch (error) {
        console.error('❌ Basic connectivity failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            type: error.type
        });
        return;
    }
    
    // Test 2: CORS preflight
    console.log('\n2️⃣ Testing CORS preflight...');
    try {
        const response = await fetch('http://localhost:5001/api/health', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        console.log('✅ CORS preflight successful:', response.status);
        console.log('CORS headers:', {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        });
    } catch (error) {
        console.error('❌ CORS preflight failed:', error);
    }
    
    // Test 3: POST request
    console.log('\n3️⃣ Testing POST request...');
    try {
        const response = await fetch('http://localhost:5001/api/health', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173'
            },
            body: JSON.stringify({ test: 'data' })
        });
        console.log('✅ POST request successful:', response.status);
    } catch (error) {
        console.error('❌ POST request failed:', error);
    }
    
    // Test 4: OTP endpoint
    console.log('\n4️⃣ Testing OTP endpoint...');
    try {
        const response = await fetch('http://localhost:5001/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173'
            },
            body: JSON.stringify({ phone: '+919876543210' })
        });
        const data = await response.json();
        console.log('✅ OTP endpoint successful:', data);
    } catch (error) {
        console.error('❌ OTP endpoint failed:', error);
    }
    
    // Test 5: Geolocation endpoint
    console.log('\n5️⃣ Testing Geolocation endpoint...');
    try {
        const response = await fetch('http://localhost:5001/api/geolocation/reverse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173'
            },
            body: JSON.stringify({ lat: 19.0760, lng: 72.8777 })
        });
        const data = await response.json();
        console.log('✅ Geolocation endpoint successful:', data);
    } catch (error) {
        console.error('❌ Geolocation endpoint failed:', error);
    }
    
    // Test 6: Request endpoint
    console.log('\n6️⃣ Testing Request endpoint...');
    try {
        const response = await fetch('http://localhost:5001/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173'
            },
            body: JSON.stringify({
                customerId: 'test123',
                customerName: 'Test User',
                customerPhone: '+1234567890',
                serviceType: 'Towing',
                location: { type: 'Point', coordinates: [72.8777, 19.0760] },
                address: 'Mumbai, India'
            })
        });
        const data = await response.json();
        console.log('✅ Request endpoint successful:', data);
    } catch (error) {
        console.error('❌ Request endpoint failed:', error);
    }
    
    console.log('\n🎉 Debugging complete!');
}

// Run the debug function
debugConnectivity();
