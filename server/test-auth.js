// Test script for authentication endpoints
const testAuth = async () => {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing User Registration...');
    const registerResponse = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'testuser@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: 'user'
      })
    });

    const registerData = await registerResponse.json();
    console.log('Registration Response:', registerData.success ? '✅ Success' : '❌ Failed');
    if (!registerData.success) {
      console.log('Error:', registerData.error);
    }

    // Test 2: Login with the registered user
    console.log('\n2️⃣ Testing User Login...');
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData.success ? '✅ Success' : '❌ Failed');
    if (loginData.success) {
      console.log('User:', loginData.user.name, 'Role:', loginData.user.role);
      console.log('Token received:', loginData.token ? '✅' : '❌');
      
      // Test 3: Get user profile with token
      console.log('\n3️⃣ Testing Protected Profile Endpoint...');
      console.log('Token being sent:', loginData.token.substring(0, 20) + '...');
      
      const profileResponse = await fetch('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile Response Status:', profileResponse.status);
      const profileData = await profileResponse.json();
      console.log('Profile Response:', profileData.success ? '✅ Success' : '❌ Failed');
      console.log('Profile Error:', profileData.error || 'None');
      
      if (profileData.success) {
        console.log('Profile Name:', profileData.user.name);
      }
    } else {
      console.log('Login Error:', loginData.error);
    }

    // Test 4: Register a provider
    console.log('\n4️⃣ Testing Provider Registration...');
    const providerRegisterResponse = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Provider',
        email: 'testprovider@example.com',
        phone: '+1234567891',
        password: 'password123',
        role: 'provider',
        providerInfo: {
          businessName: 'Test Towing Service',
          services: ['Towing'],
          experience: 5,
          rating: 0,
          totalJobs: 0
        }
      })
    });

    const providerRegisterData = await providerRegisterResponse.json();
    console.log('Provider Registration Response:', providerRegisterData.success ? '✅ Success' : '❌ Failed');
    if (!providerRegisterData.success) {
      console.log('Error:', providerRegisterData.error);
    }

    // Test 5: Login with provider
    console.log('\n5️⃣ Testing Provider Login...');
    const providerLoginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testprovider@example.com',
        password: 'password123'
      })
    });

    const providerLoginData = await providerLoginResponse.json();
    console.log('Provider Login Response:', providerLoginData.success ? '✅ Success' : '❌ Failed');
    if (providerLoginData.success) {
      console.log('Provider:', providerLoginData.user.name, 'Role:', providerLoginData.user.role);
      console.log('Business Name:', providerLoginData.user.providerInfo?.businessName);
    }

    console.log('\n🎉 Authentication testing completed!');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
};

// Run the tests
testAuth();
