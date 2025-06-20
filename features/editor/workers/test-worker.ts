// Minimal test worker to verify worker loading works
console.log('[Test Worker] Loading...');

self.onmessage = (event) => {
  console.log('[Test Worker] Received message:', event.data);
  
  const { type, id } = event.data;
  
  if (type === 'test') {
    console.log('[Test Worker] Sending test response');
    self.postMessage({ 
      type: 'test-response', 
      id,
      message: 'Worker is working!' 
    });
  }
};

console.log('[Test Worker] Ready'); 