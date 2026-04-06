// Alternative fetch test to diagnose network issues
// Run this in browser console

async function testAlternativeFetch() {
    console.log('🔍 Testing alternative fetch methods...\n');
    
    // Test 1: Basic fetch with no-cors
    console.log('1️⃣ Testing fetch with no-cors mode...');
    try {
        const response = await fetch('http://localhost:5001/api/health', {
            mode: 'no-cors'
        });
        console.log('✅ No-cors fetch successful (opaque response)');
    } catch (error) {
        console.error('❌ No-cors fetch failed:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            constructor: error.constructor.name
        });
    }
    
    // Test 2: Basic fetch with different headers
    console.log('\n2️⃣ Testing fetch with different headers...');
    try {
        const response = await fetch('http://localhost:5001/api/health', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('✅ Alternative headers fetch successful:', data);
    } catch (error) {
        console.error('❌ Alternative headers fetch failed:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            constructor: error.constructor.name
        });
    }
    
    // Test 3: Using XMLHttpRequest
    console.log('\n3️⃣ Testing XMLHttpRequest...');
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://localhost:5001/api/health');
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                console.log('✅ XMLHttpRequest successful:', data);
            } else {
                console.error('❌ XMLHttpRequest failed with status:', xhr.status);
            }
        };
        
        xhr.onerror = function() {
            console.error('❌ XMLHttpRequest network error');
        };
        
        xhr.send();
    } catch (error) {
        console.error('❌ XMLHttpRequest setup failed:', error);
    }
    
    // Test 4: Check browser info
    console.log('\n4️⃣ Browser information...');
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Language:', navigator.language);
    console.log('OnLine:', navigator.onLine);
    console.log('Current URL:', window.location.href);
    console.log('Current protocol:', window.location.protocol);
    console.log('Current host:', window.location.host);
    
    // Test 5: Check if localhost is accessible
    console.log('\n5️⃣ Testing localhost accessibility...');
    try {
        const response = await fetch('http://127.0.0.1:5001/api/health');
        const data = await response.json();
        console.log('✅ 127.0.0.1 accessible:', data);
    } catch (error) {
        console.error('❌ 127.0.0.1 not accessible:', error);
    }
    
    console.log('\n🎉 Alternative fetch testing complete!');
}

// Run the test
testAlternativeFetch();
