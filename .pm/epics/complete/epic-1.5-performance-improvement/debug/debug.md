# Complete Spell Check Debug & Fix Guide

## Overview
The spell check system is not showing any errors. This document provides a systematic approach to debug and fix the issue.

## System Architecture
1. **EditorService** → Detects changes and sends text to check
2. **CheckOrchestrator** → Manages worker and caching
3. **grammar.worker** → Performs actual spell/grammar checking
4. **ErrorRegistry** → Stores and deduplicates errors
5. **SpellCheckExtension** → Creates visual decorations

## Step 1: Fix the Grammar Worker

**File: `grammar.worker.ts`**

The main issue is that `paragraphId` is not being properly tracked. Replace the message handler section with:

```typescript
// Replace the existing message handler and check function with this:

// Store active check data
const activeChecks = new Map<string, { paragraphId: string; skipWords?: string[] }>();

async function checkText(id: string, text: string, paragraphId: string, skipWords: string[] = []) {
  try {
    console.log(`[Grammar Worker] Starting check:`, {
      id,
      paragraphId,
      textLength: text.length,
      textPreview: text.substring(0, 50) + '...',
      skipWordsCount: skipWords.length
    });
    
    // Store the check info
    activeChecks.set(id, { paragraphId, skipWords });
    
    // Get processor with skip words
    const localProcessor = await getProcessor({ ignore: skipWords });
    
    // Process the text
    const file = await localProcessor.process(text);
    
    console.log(`[Grammar Worker] Processing complete for ${id}:`, {
      messagesFound: file.messages.length
    });
    
    // Convert messages to errors
    const errors = file.messages
      .map((msg: any) => convertMessageToError(msg, text))
      .filter((error: TextError | null): error is TextError => error !== null);

    console.log(`[Grammar Worker] Converted to ${errors.length} errors for ${id}`);
    
    // Get the stored check info
    const checkInfo = activeChecks.get(id);
    if (!checkInfo) {
      console.error(`[Grammar Worker] No check info found for ${id}`);
      return;
    }

    // Send the result with the correct paragraph ID
    const result = {
      type: 'result',
      id: id,
      paragraphId: checkInfo.paragraphId,
      errors: errors
    };
    
    console.log(`[Grammar Worker] Sending result:`, result);
    
    self.postMessage(result);
    
    // Clean up
    activeChecks.delete(id);

  } catch (error) {
    console.error("[Grammar Worker] Check failed:", error);
    const checkInfo = activeChecks.get(id);
    
    self.postMessage({ 
      type: "error", 
      id: id,
      paragraphId: checkInfo?.paragraphId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    activeChecks.delete(id);
  }
}

// Replace the message handler
self.onmessage = async (event) => {
  const { type, id, text, baseUrl: newBaseUrl, paragraphId, skipWords } = event.data;
  
  console.log(`[Grammar Worker] Received message:`, {
    type,
    id,
    paragraphId,
    hasText: !!text,
    textLength: text?.length
  });
  
  switch(type) {
    case "init":
      if (!newBaseUrl) {
        console.error('[Grammar Worker] No baseUrl provided for init');
        return;
      }
      baseUrl = newBaseUrl;
      await initialize();
      break;
      
    case "check":
      if (!isInitialized) {
        console.error('[Grammar Worker] Not initialized yet, cannot check');
        self.postMessage({ 
          type: "error", 
          id: id,
          paragraphId: paragraphId,
          error: "Worker not initialized" 
        });
        return;
      }
      
      if (!text || !id || !paragraphId) {
        console.error('[Grammar Worker] Missing required fields for check:', { 
          text: !!text, 
          id: !!id, 
          paragraphId: !!paragraphId 
        });
        return;
      }
      
      await checkText(id, text, paragraphId, skipWords || []);
      break;
      
    default:
      console.log('[Grammar Worker] Unknown message type:', type);
  }
};
```

## Step 2: Add Debug Logging

**File: `CheckOrchestrator.ts`**

Add this enhanced logging to the `handleWorkerMessage` method:

```typescript
private handleWorkerMessage(event: MessageEvent) {
    console.log(`[DEBUG] CheckOrchestrator: Full worker message:`, event.data);
    
    const { type, id, errors, paragraphId } = event.data;
    
    if (type === 'result') {
      console.log(`[DEBUG] CheckOrchestrator: Processing result:`, {
        id,
        paragraphId,
        errorsCount: errors?.length,
        errors: errors?.slice(0, 2) // Show first 2 errors
      });
      
      const pending = this.pendingChecks.get(id);
      if (pending) {
        console.log(`[DEBUG] CheckOrchestrator: Resolving pending check`);
        performanceMonitor.endTimer(pending.timerId);
        pending.resolver({ id, errors, paragraphId });
        this.pendingChecks.delete(id);
        
        // THIS IS CRITICAL - Make sure this happens!
        console.log(`[DEBUG] CheckOrchestrator: Emitting results event`);
        this.emit('results', { id, errors, paragraphId });
      } else {
        console.warn(`[DEBUG] CheckOrchestrator: No pending check found for ${id}`);
      }
    } else if (type === 'error') {
      console.error(`[DEBUG] CheckOrchestrator: Worker error:`, event.data);
    } else if (type === 'ready') {
      console.log('[DEBUG] CheckOrchestrator: Worker is ready');
    }
}
```

## Step 3: Add Test Pipeline

**File: `EditorService.ts`**

Add this test method to your EditorService class:

```typescript
// Add this method to EditorService class
public async testPipeline() {
    console.log('=== STARTING SPELL CHECK PIPELINE TEST ===');
    
    // Test 1: Check if worker is initialized
    console.log('[TEST 1] Testing worker initialization...');
    const testText = "This is a testt with errrors and and repeated words.";
    const testParagraphId = "p-test-manual";
    
    // Listen for results
    const resultPromise = new Promise((resolve) => {
        const handler = (result: any) => {
            console.log('[TEST 1] Received result:', result);
            this.checkOrchestrator.off('results', handler);
            resolve(result);
        };
        this.checkOrchestrator.on('results', handler);
    });
    
    // Send test
    console.log('[TEST 1] Sending test text to orchestrator');
    this.checkOrchestrator.check(testText, testParagraphId);
    
    // Wait for result
    try {
        const result = await Promise.race([
            resultPromise,
            new Promise((_, reject) => setTimeout(() => reject('Timeout'), 5000))
        ]);
        console.log('[TEST 1] ✅ Worker pipeline works!', result);
    } catch (error) {
        console.error('[TEST 1] ❌ Worker pipeline failed:', error);
    }
    
    // Test 2: Check error registry
    console.log('\n[TEST 2] Testing error registry...');
    setTimeout(() => {
        const errors = this.errorRegistry.getErrors();
        console.log('[TEST 2] Errors in registry:', errors);
        
        if (errors.length === 0) {
            console.log('[TEST 2] No errors in registry, adding manual error...');
            
            // Add error directly
            this.errorRegistry.addConfirmed('p-0', [{
                message: 'Manual test error',
                start: 0,
                end: 4,
                source: 'test',
                rule: 'test-rule',
                suggestions: ['This'],
                word: 'This'
            }]);
            
            // Force decoration update
            this.editor.view.dispatch(this.editor.state.tr.setMeta('updated_errors', true));
            
            setTimeout(() => {
                const newErrors = this.errorRegistry.getErrors();
                console.log('[TEST 2] Errors after manual add:', newErrors);
                
                // Check DOM for decorations
                const decorations = this.editor.view.dom.querySelectorAll('.error-wrapper');
                console.log('[TEST 2] Decorations in DOM:', decorations.length);
                
                if (decorations.length > 0) {
                    console.log('[TEST 2] ✅ Decoration system works!');
                } else {
                    console.log('[TEST 2] ❌ Decoration system broken');
                }
            }, 500);
        } else {
            console.log('[TEST 2] ✅ Registry has errors:', errors.length);
        }
    }, 1000);
    
    // Test 3: Debug paragraph structure
    console.log('\n[TEST 3] Current paragraph structure:');
    this.debugParagraphs();
}

private debugParagraphs() {
    let index = 0;
    this.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph') {
            console.log(`Paragraph ${index}:`, {
                pos,
                nodeSize: node.nodeSize,
                content: node.textContent.substring(0, 50) + '...',
                paragraphId: `p-${pos}`
            });
            index++;
        }
    });
}
```

Then in the constructor, add:

```typescript
// At the end of EditorService constructor
setTimeout(() => {
    this.testPipeline();
}, 2000);
```

## Step 4: Verify Dictionary Loading

**File: `grammar.worker.ts`**

Add logging to dictionary loading:

```typescript
async function getProcessor(options: { ignore?: string[] } = {}) {
  if (processor && (!options.ignore || options.ignore.length === 0)) {
    return processor;
  }

  console.log('[Grammar Worker] Loading dictionaries from:', baseUrl);
  
  try {
    const [dicResponse, affResponse] = await Promise.all([
      fetch(`${baseUrl}/dictionaries/en_US.dic`),
      fetch(`${baseUrl}/dictionaries/en_US.aff`)
    ]);
    
    console.log('[Grammar Worker] Dictionary responses:', {
      dic: { status: dicResponse.status, ok: dicResponse.ok },
      aff: { status: affResponse.status, ok: affResponse.ok }
    });
    
    if (!dicResponse.ok || !affResponse.ok) {
      throw new Error(`Failed to load dictionaries: dic=${dicResponse.status}, aff=${affResponse.status}`);
    }
    
    const [dicBuffer, affBuffer] = await Promise.all([
      dicResponse.arrayBuffer(),
      affResponse.arrayBuffer()
    ]);
    
    console.log('[Grammar Worker] Dictionary sizes:', {
      dic: dicBuffer.byteLength,
      aff: affBuffer.byteLength
    });
    
    // Rest of the function...
  } catch (error) {
    console.error('[Grammar Worker] Failed to load dictionaries:', error);
    throw error;
  }
}
```

## Step 5: Common Issues & Solutions

### Issue 1: Dictionary files not found
**Check:** Look for 404 errors in Network tab  
**Fix:** Ensure `/public/dictionaries/en_US.dic` and `/public/dictionaries/en_US.aff` exist

### Issue 2: Worker not initializing
**Check:** Look for "[Grammar Worker] Initialization complete" in console  
**Fix:** Check if worker file is loading correctly, check for syntax errors

### Issue 3: Paragraph IDs mismatch
**Check:** Compare paragraph IDs in EditorService vs CheckOrchestrator logs  
**Fix:** Ensure consistent paragraph ID generation using `p-${pos}`

### Issue 4: Decorations not showing
**Check:** Look for "[DEBUG] SpellCheckExtension: Creating decorations" in console  
**Fix:** Verify CSS classes exist and `contentEditable: 'false'` is set

## Step 6: Quick Test Commands

Run these in the browser console after the page loads:

```javascript
// Test 1: Check if worker is alive
console.log('Worker state:', window.editorService?.checkOrchestrator?.worker);

// Test 2: Manually trigger a check
window.editorService?.testPipeline();

// Test 3: Check error registry
console.log('Current errors:', window.editorService?.errorRegistry?.getErrors());

// Test 4: Debug paragraphs
window.editorService?.debugParagraphs();
```

## Expected Console Output When Working

```
[Grammar Worker] Loading...
[Grammar Worker] Ready
[Grammar Worker] Initialization complete
[CheckOrchestrator] Worker is ready
[TEST 1] ✅ Worker pipeline works!
[TEST 2] ✅ Registry has errors: 3
[DEBUG] SpellCheckExtension: Creating decorations for errors: 3
```

## If Nothing Works

1. **Disable custom rules**: Comment out `customContractionsRule` and `customCapitalizationRule`
2. **Test with simple text**: Use "teh teh" which should always trigger errors
3. **Check browser console for errors**: Any uncaught exceptions will break the pipeline
4. **Verify Turbopack config**: Ensure workers are properly configured in your build setup

This guide should help identify exactly where the pipeline is breaking. Start with Step 1 (fixing the worker) and run the tests in Step 3. The console output will tell you exactly what's working and what isn't.