// Debug script to test frontend-backend connectivity
// Add this to the browser console to debug issues

async function debugBackendConnection() {
    console.log('🔍 Testing Backend Connection...');
    
    // Test 1: Health endpoint
    try {
        const healthResponse = await fetch('http://localhost:5001/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health endpoint:', healthData);
    } catch (error) {
        console.error('❌ Health endpoint failed:', error);
    }
    
    // Test 2: Geolocation endpoint
    try {
        const geoResponse = await fetch('http://localhost:5001/api/geolocation/reverse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: 19.0760, lng: 72.8777 })
        });
        const geoData = await geoResponse.json();
        console.log('✅ Geolocation endpoint:', geoData);
    } catch (error) {
        console.error('❌ Geolocation endpoint failed:', error);
    }
    
    // Test 3: Request submission
    try {
        const requestResponse = await fetch('http://localhost:5001/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: 'test123',
                customerName: 'Test User',
                customerPhone: '+1234567890',
                serviceType: 'Towing',
                location: { type: 'Point', coordinates: [72.8777, 19.0760] },
                address: 'Mumbai, India'
            })
        });
        const requestData = await requestResponse.json();
        console.log('✅ Request endpoint:', requestData);
    } catch (error) {
        console.error('❌ Request endpoint failed:', error);
    }
    
    // Test 4: OTP endpoint
    try {
        const otpResponse = await fetch('http://localhost:5001/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '+919876543210' })
        });
        const otpData = await otpResponse.json();
        console.log('✅ OTP endpoint:', otpData);
    } catch (error) {
        console.error('❌ OTP endpoint failed:', error);
    }
    
    // Test 5: Auth endpoint
    try {
        const authResponse = await fetch('http://localhost:5001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                phone: '+919876543210',
                password: 'password123',
                role: 'user'
            })
        });
        const authData = await authResponse.json();
        console.log('✅ Auth endpoint:', authData);
    } catch (error) {
        console.error('❌ Auth endpoint failed:', error);
    }
}

// Auto-run the debug function
debugBackendConnection();
