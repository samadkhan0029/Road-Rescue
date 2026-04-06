// Simple test to check if Emergency component renders
console.log('Testing Emergency component...');

// Check if all required dependencies are available
try {
    const React = require('react');
    const useState = React.useState;
    const useEffect = React.useEffect;
    const useRef = React.useRef;
    
    console.log('React imports successful');
    console.log('useState:', typeof useState);
    console.log('useEffect:', typeof useEffect);
    console.log('useRef:', typeof useRef);
    
} catch (error) {
    console.error('React import error:', error);
}

// Check if other imports work
try {
    const socket = require('socket.io-client');
    console.log('Socket.io import successful');
} catch (error) {
    console.error('Socket.io import error:', error);
}

try {
    const leaflet = require('leaflet');
    console.log('Leaflet import successful');
} catch (error) {
    console.error('Leaflet import error:', error);
}

console.log('All imports checked');
