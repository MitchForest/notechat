// Simple JavaScript worker for testing
console.log('[Test Worker JS] Loading...');

self.onmessage = function(event) {
  console.log('[Test Worker JS] Received message:', event.data);
  
  const { type, id } = event.data;
  
  if (type === 'test') {
    console.log('[Test Worker JS] Sending test response');
    self.postMessage({ 
      type: 'test-response', 
      id: id,
      message: 'JavaScript worker is working!' 
    });
  }
};

console.log('[Test Worker JS] Ready'); 