// Test if the page loads without errors
console.log('Page loading...');

// Wait for page to load
window.addEventListener('load', function() {
    console.log('Page loaded successfully');
    
    // Check if React is available
    if (window.React) {
        console.log('React is available');
    } else {
        console.error('React is not available');
    }
    
    // Check if there are any error elements
    const errorElements = document.querySelectorAll('[data-testid="error"]');
    if (errorElements.length > 0) {
        console.error('Found error elements:', errorElements);
    }
    
    // Check if main app container exists
    const appContainer = document.getElementById('root');
    if (appContainer) {
        console.log('App container found');
    } else {
        console.error('App container not found');
    }
});

// Check for console errors
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

console.log('Test script loaded');
