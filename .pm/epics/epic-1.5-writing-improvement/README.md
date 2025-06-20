# Performance & Real-Time Sprint Plan for Spell Check System

## Current State
- ✅ Decorations working correctly
- ✅ Browser spellcheck interference fixed
- ❌ Checking entire document on every change (major bottleneck)
- ❌ No caching (repeated work)
- ❌ No instant feedback (waits for debounce)
- ❌ No deduplication (same errors checked multiple times)
- ❌ No paste optimization

## Sprint Overview
- **Sprint 1**: Paragraph-Based Checking (3 days) - *Biggest performance gain*
- **Sprint 2**: Caching System (2 days) - *Avoid repeated work*
- **Sprint 3**: Instant Word Checking (3 days) - *Real-time feedback*
- **Sprint 4**: Deduplication & Error Registry (2 days) - *Prevent duplicates*
- **Sprint 5**: Paste & Bulk Operations (2 days) - *Handle edge cases*
- **Sprint 6**: Performance Monitoring & Optimization (2 days) - *Fine-tuning*

---

## Sprint 1: Paragraph-Based Checking (3 days) 🚀

### Goal
Check only changed paragraphs instead of entire document - this alone will make the system 10x faster on long documents.

### Task 1.1: Track Document Structure
```typescript
// EditorService.ts - Add paragraph tracking
export class EditorService {
    private paragraphRegistry = new Map<number, {
        content: string;
        hash: string;
        position: number;
    }>();
    
    constructor() {
        this.editor = new Editor({
            // ... existing config
            onCreate: ({ editor }) => {
                this.indexDocument(editor.state.doc);
            },
            onUpdate: ({ editor, transaction }) => {
                if (transaction.docChanged) {
                    this.handleDocumentChange(transaction);
                }
            }
        });
    }
    
    private indexDocument(doc: Node) {
        this.paragraphRegistry.clear();
        let paragraphIndex = 0;
        
        doc.descendants((node, pos) => {
            if (node.type.name === 'paragraph') {
                const content = node.textContent;
                this.paragraphRegistry.set(paragraphIndex, {
                    content,
                    hash: this.quickHash(content),
                    position: pos
                });
                paragraphIndex++;
            }
        });
    }
    
    private quickHash(str: string): string {
        // Fast non-cryptographic hash
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(31, h) + str.charCodeAt(i) | 0;
        }
        return h.toString(36);
    }
}
```

### Task 1.2: Detect Changed Paragraphs
```typescript
// EditorService.ts - Detect what changed
private handleDocumentChange(transaction: Transaction) {
    const changedParagraphs: ParagraphCheckRequest[] = [];
    let paragraphIndex = 0;
    
    transaction.doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph') {
            const content = node.textContent;
            const newHash = this.quickHash(content);
            const existing = this.paragraphRegistry.get(paragraphIndex);
            
            // Check if paragraph changed
            if (!existing || existing.hash !== newHash) {
                changedParagraphs.push({
                    index: paragraphIndex,
                    content: content,
                    position: pos,
                    hash: newHash
                });
                
                // Update registry
                this.paragraphRegistry.set(paragraphIndex, {
                    content,
                    hash: newHash,
                    position: pos
                });
            }
            paragraphIndex++;
        }
    });
    
    // Only check changed paragraphs
    if (changedParagraphs.length > 0) {
        this.scheduleChecks(changedParagraphs);
    }
}

private scheduleChecks = debounce((paragraphs: ParagraphCheckRequest[]) => {
    console.log(`[Performance] Checking ${paragraphs.length} paragraphs instead of entire document`);
    
    paragraphs.forEach(para => {
        this.checkOrchestrator.checkParagraph(para);
    });
}, 300);
```

### Task 1.3: Update CheckOrchestrator
```typescript
// CheckOrchestrator.ts - Handle paragraph-based requests
export interface ParagraphCheckRequest {
    index: number;
    content: string;
    position: number;
    hash: string;
}

export class CheckOrchestrator {
    async checkParagraph(request: ParagraphCheckRequest) {
        const result = await this.queue.add(async () => {
            // Send to worker with paragraph context
            return new Promise((resolve) => {
                const id = crypto.randomUUID();
                
                this.pendingRequests.set(id, resolve);
                
                this.worker.postMessage({
                    id,
                    type: 'checkParagraph',
                    content: request.content,
                    metadata: {
                        paragraphIndex: request.index,
                        position: request.position
                    }
                });
            });
        });
        
        // Emit paragraph-specific results
        this.emit('paragraphChecked', {
            paragraphIndex: request.index,
            position: request.position,
            errors: result.errors
        });
    }
}
```

### Task 1.4: Update DecorationManager for Incremental Updates
```typescript
// DecorationManager.ts - Handle paragraph-specific updates
export class DecorationManager {
    private paragraphErrors = new Map<number, TextError[]>();
    
    public updateParagraphErrors(
        paragraphIndex: number, 
        errors: TextError[], 
        paragraphPosition: number
    ) {
        console.log(`[DecorationManager] Updating paragraph ${paragraphIndex} with ${errors.length} errors`);
        
        // Adjust error positions to document coordinates
        const adjustedErrors = errors.map(error => ({
            ...error,
            start: error.start + paragraphPosition + 1, // +1 for ProseMirror indexing
            end: error.end + paragraphPosition + 1
        }));
        
        // Store errors for this paragraph
        this.paragraphErrors.set(paragraphIndex, adjustedErrors);
        
        // Rebuild decorations efficiently
        this.rebuildDecorations();
    }
    
    private rebuildDecorations() {
        // Combine all paragraph errors
        const allErrors: TextError[] = [];
        
        // Sort paragraph indices to maintain order
        const sortedIndices = Array.from(this.paragraphErrors.keys()).sort((a, b) => a - b);
        
        sortedIndices.forEach(index => {
            const errors = this.paragraphErrors.get(index) || [];
            allErrors.push(...errors);
        });
        
        // Update decorations once
        this.updateDecorations(allErrors);
    }
    
    // Clean up when paragraphs are deleted
    public removeParagraph(index: number) {
        this.paragraphErrors.delete(index);
        this.rebuildDecorations();
    }
}
```

### Success Metrics
- ⏱️ Check time reduced by 80%+ on documents > 10 paragraphs
- 📊 Only changed paragraphs sent to worker
- ✅ No full document scans

---

## Sprint 2: Smart Caching System (2 days) 💾

### Goal
Cache check results to eliminate redundant processing.

### Task 2.1: Implement LRU Cache
```typescript
// CheckOrchestrator.ts - Add caching layer
import { LRUCache } from 'lru-cache';

export class CheckOrchestrator {
    private paragraphCache = new LRUCache<string, CheckResult>({
        max: 500, // Cache 500 paragraphs
        ttl: 1000 * 60 * 10, // 10 minute TTL
        updateAgeOnGet: true,
        updateAgeOnHas: true
    });
    
    private wordCache = new LRUCache<string, SpellResult>({
        max: 10000, // Cache 10k words
        ttl: 1000 * 60 * 30 // 30 minute TTL
    });
    
    private stats = {
        cacheHits: 0,
        cacheMisses: 0,
        totalChecks: 0
    };
    
    async checkParagraph(request: ParagraphCheckRequest) {
        this.stats.totalChecks++;
        
        // Check cache first
        const cacheKey = `${request.hash}:${request.content.length}`;
        const cached = this.paragraphCache.get(cacheKey);
        
        if (cached) {
            this.stats.cacheHits++;
            console.log(`[Cache] HIT for paragraph ${request.index} (${this.getCacheHitRate()}% hit rate)`);
            
            // Emit cached results immediately
            this.emit('paragraphChecked', {
                paragraphIndex: request.index,
                position: request.position,
                errors: cached.errors,
                fromCache: true
            });
            return;
        }
        
        this.stats.cacheMisses++;
        console.log(`[Cache] MISS for paragraph ${request.index}`);
        
        // Perform actual check
        const result = await this.performCheck(request);
        
        // Cache the result
        this.paragraphCache.set(cacheKey, result);
        
        // Emit results
        this.emit('paragraphChecked', {
            paragraphIndex: request.index,
            position: request.position,
            errors: result.errors,
            fromCache: false
        });
    }
    
    private getCacheHitRate(): string {
        if (this.stats.totalChecks === 0) return '0';
        return ((this.stats.cacheHits / this.stats.totalChecks) * 100).toFixed(1);
    }
}
```

### Task 2.2: Pre-warm Cache with Common Patterns
```typescript
// CheckOrchestrator.ts - Cache warming
export class CheckOrchestrator {
    async warmCache() {
        console.log('[Cache] Warming cache with common words...');
        
        // Common correctly spelled words
        const commonCorrect = [
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
            'I', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
            'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they'
        ];
        
        // Common misspellings with corrections
        const commonErrors: Record<string, string[]> = {
            'teh': ['the'],
            'adn': ['and'],
            'taht': ['that'],
            'wiht': ['with'],
            'form': ['from', 'form'], // context-dependent
            'thier': ['their'],
            'recieve': ['receive'],
            'seperate': ['separate']
        };
        
        // Cache correct words
        commonCorrect.forEach(word => {
            this.wordCache.set(word.toLowerCase(), {
                isCorrect: true,
                suggestions: []
            });
        });
        
        // Cache known errors
        Object.entries(commonErrors).forEach(([error, suggestions]) => {
            this.wordCache.set(error, {
                isCorrect: false,
                suggestions
            });
        });
        
        console.log(`[Cache] Warmed with ${commonCorrect.length + Object.keys(commonErrors).length} entries`);
    }
}
```

### Task 2.3: Cache Invalidation Strategy
```typescript
// CheckOrchestrator.ts - Smart invalidation
export class CheckOrchestrator {
    // Clear cache for specific paragraph when user makes edits
    invalidateParagraph(paragraphIndex: number, hash: string) {
        const cacheKey = `${hash}:*`;
        // Remove all entries for this paragraph hash
        for (const key of this.paragraphCache.keys()) {
            if (key.startsWith(hash)) {
                this.paragraphCache.delete(key);
            }
        }
    }
    
    // Periodic cache cleanup
    startCacheMaintenance() {
        setInterval(() => {
            console.log(`[Cache] Stats: ${this.getCacheHitRate()}% hit rate, ${this.paragraphCache.size} entries`);
            
            // Log memory usage
            const cacheSize = this.paragraphCache.size;
            if (cacheSize > 400) {
                console.warn(`[Cache] Size warning: ${cacheSize} entries`);
            }
        }, 60000); // Every minute
    }
}
```

### Success Metrics
- 📈 Cache hit rate > 40% after 5 minutes of use
- ⚡ Undo/redo operations are instant
- 🔄 Repeated content checked only once

---

## Sprint 3: Instant Word Checking (3 days) ⚡

### Goal
Provide immediate feedback as users type, without waiting for debounce.

### Task 3.1: Word Boundary Detection
```typescript
// EditorService.ts - Detect word completion
export class EditorService {
    private lastCursorPos = 0;
    
    constructor() {
        this.editor = new Editor({
            onUpdate: ({ editor, transaction }) => {
                // Always check for word boundaries (no debounce)
                this.checkForWordCompletion(transaction);
                
                // Debounced paragraph checking continues
                if (transaction.docChanged) {
                    this.handleDocumentChange(transaction);
                }
            }
        });
    }
    
    private checkForWordCompletion(transaction: Transaction) {
        const { selection } = transaction;
        if (!selection.empty) return;
        
        const { $from } = selection;
        const currentPos = $from.pos;
        
        // Only check if cursor moved forward (typing, not navigating)
        if (currentPos <= this.lastCursorPos) {
            this.lastCursorPos = currentPos;
            return;
        }
        
        this.lastCursorPos = currentPos;
        
        // Get character just typed
        const charBefore = currentPos > 0 
            ? transaction.doc.textBetween(currentPos - 1, currentPos)
            : '';
        
        // Word boundaries: space, punctuation, newline
        const isWordBoundary = /[\s.,!?;:'")\]\}\n]/.test(charBefore);
        
        if (isWordBoundary) {
            const wordInfo = this.extractWordBefore(transaction.doc, currentPos - 1);
            if (wordInfo && wordInfo.text.length >= 2) {
                this.performInstantCheck(wordInfo);
            }
        }
    }
    
    private extractWordBefore(doc: Node, boundaryPos: number): WordInfo | null {
        let start = boundaryPos;
        
        // Find start of word
        while (start > 0) {
            const char = doc.textBetween(start - 1, start);
            if (/[\s.,!?;:'"(\[\{\n]/.test(char)) break;
            start--;
        }
        
        const text = doc.textBetween(start, boundaryPos).trim();
        
        if (text.length < 2) return null;
        
        return {
            text,
            start,
            end: boundaryPos,
            paragraphIndex: this.getParagraphIndexAtPos(doc, start)
        };
    }
}
```

### Task 3.2: Instant Checker with Common Patterns
```typescript
// InstantChecker.ts - Fast client-side checking
export class InstantChecker {
    private patterns = {
        // Common typos
        commonTypos: new Map([
            ['teh', 'the'],
            ['adn', 'and'],
            ['nad', 'and'],
            ['tht', 'that'],
            ['thta', 'that'],
            ['taht', 'that'],
            ['whta', 'what'],
            ['waht', 'what'],
            ['hte', 'the'],
            ['eth', 'the']
        ]),
        
        // Repeated letters (3+ of same letter)
        tripleLetters: /(.)\1{2,}/,
        
        // Common doubled letters that shouldn't be
        wrongDoubles: /(?:aa|ii|uu)[^a-z]/i,
        
        // Missing vowels in common words
        missingVowels: new Map([
            ['nd', 'and'],
            ['th', 'the'],
            ['wth', 'with'],
            ['hv', 'have'],
            ['wll', 'will'],
            ['cn', 'can']
        ])
    };
    
    checkInstant(word: string): InstantCheckResult | null {
        const lower = word.toLowerCase();
        
        // Check common typos first (fastest)
        if (this.patterns.commonTypos.has(lower)) {
            return {
                hasError: true,
                type: 'spelling',
                confidence: 'high',
                suggestion: this.patterns.commonTypos.get(lower)!,
                rule: 'common-typo'
            };
        }
        
        // Check for triple+ letters
        if (this.patterns.tripleLetters.test(word)) {
            return {
                hasError: true,
                type: 'spelling',
                confidence: 'high',
                suggestion: word.replace(/(.)\1{2,}/g, '$1$1'),
                rule: 'repeated-letters'
            };
        }
        
        // Check for suspicious double letters
        if (this.patterns.wrongDoubles.test(word + ' ')) {
            return {
                hasError: true,
                type: 'spelling',
                confidence: 'medium',
                suggestion: word.replace(/([^aeiou])\1/g, '$1'),
                rule: 'wrong-double'
            };
        }
        
        // Very short words that might be missing vowels
        if (word.length <= 3 && this.patterns.missingVowels.has(lower)) {
            return {
                hasError: true,
                type: 'spelling',
                confidence: 'low',
                suggestion: this.patterns.missingVowels.get(lower)!,
                rule: 'missing-vowel'
            };
        }
        
        return null;
    }
}
```

### Task 3.3: Two-Phase Error Display
```typescript
// EditorService.ts - Instant + confirmed errors
export class EditorService {
    private instantChecker = new InstantChecker();
    private instantErrors = new Map<string, TentativeError>();
    
    private async performInstantCheck(wordInfo: WordInfo) {
        // Phase 1: Instant client-side check
        const instant = this.instantChecker.checkInstant(wordInfo.text);
        
        if (instant) {
            const error: TentativeError = {
                start: wordInfo.start,
                end: wordInfo.end,
                type: instant.type,
                message: `Possible ${instant.type} error`,
                suggestions: [instant.suggestion],
                confidence: instant.confidence,
                rule: instant.rule,
                tentative: true
            };
            
            // Show immediately with tentative styling
            this.decorationManager.addTentativeError(error);
            this.instantErrors.set(`${wordInfo.start}-${wordInfo.end}`, error);
        }
        
        // Phase 2: Queue for worker confirmation
        this.checkOrchestrator.checkWord(wordInfo).then(result => {
            const key = `${wordInfo.start}-${wordInfo.end}`;
            
            if (result.hasError) {
                // Upgrade to confirmed error
                this.decorationManager.confirmError({
                    ...result.error,
                    start: wordInfo.start,
                    end: wordInfo.end
                });
            } else if (this.instantErrors.has(key)) {
                // False positive - remove tentative error
                this.decorationManager.removeTentativeError(key);
            }
            
            this.instantErrors.delete(key);
        });
    }
}
```

### Task 3.4: Update DecorationManager for Tentative Errors
```typescript
// DecorationManager.ts - Support two-phase errors
export class DecorationManager {
    private tentativeErrors = new Map<string, TextError>();
    private confirmedErrors = new Map<string, TextError>();
    
    public addTentativeError(error: TentativeError) {
        const key = `${error.start}-${error.end}`;
        this.tentativeErrors.set(key, error);
        this.updateAllDecorations();
    }
    
    public confirmError(error: TextError) {
        const key = `${error.start}-${error.end}`;
        this.tentativeErrors.delete(key);
        this.confirmedErrors.set(key, error);
        this.updateAllDecorations();
    }
    
    public removeTentativeError(key: string) {
        this.tentativeErrors.delete(key);
        this.updateAllDecorations();
    }
    
    private updateAllDecorations() {
        const allErrors = [
            ...Array.from(this.tentativeErrors.values()),
            ...Array.from(this.confirmedErrors.values()),
            ...this.getAllParagraphErrors()
        ];
        
        // Sort by position
        allErrors.sort((a, b) => a.start - b.start);
        
        // Create decorations with different classes
        const decorations = allErrors.map(error => {
            const className = error.tentative 
                ? 'spell-error-tentative' 
                : error.type === 'spelling' 
                    ? 'spell-error' 
                    : 'grammar-error';
            
            return Decoration.inline(error.start, error.end, {
                class: className,
                contentEditable: 'false',
                'data-error': JSON.stringify(error),
                'data-confidence': error.confidence || 'high'
            });
        });
        
        // Apply decorations
        const decorationSet = DecorationSet.create(this.editor.state.doc, decorations);
        const tr = this.editor.state.tr.setMeta(decorationManagerKey, decorationSet);
        this.editor.view.dispatch(tr);
    }
}
```

### Success Metrics
- ⚡ "teh" shows error within 50ms of typing space
- 🎯 90%+ accuracy on common typos
- 👁️ Tentative errors are visually distinct

---

## Sprint 4: Deduplication & Error Registry (2 days) 🔍

### Goal
Prevent duplicate error checking and overlapping error displays.

### Task 4.1: Create Error Registry
```typescript
// ErrorRegistry.ts - Centralized error management
export class ErrorRegistry {
    private errors = new Map<string, RegisteredError>();
    private errorsByRange = new Map<string, Set<string>>();
    private errorsByContent = new Map<string, Set<string>>();
    
    interface RegisteredError extends TextError {
        id: string;
        contentHash: string;
        priority: number;
    }
    
    addError(error: TextError): string | null {
        // Generate unique ID
        const id = `${error.type}-${error.start}-${error.end}-${Date.now()}`;
        const contentHash = this.hashErrorContent(error);
        
        // Check for duplicates by position
        const rangeKey = `${error.start}-${error.end}`;
        if (this.errorsByRange.has(rangeKey)) {
            const existingIds = this.errorsByRange.get(rangeKey)!;
            
            // Check if we should replace or skip
            for (const existingId of existingIds) {
                const existing = this.errors.get(existingId)!;
                
                if (this.isDuplicate(existing, error)) {
                    console.log('[Registry] Skipping duplicate error');
                    return null;
                }
                
                if (this.shouldReplace(existing, error)) {
                    this.removeError(existingId);
                } else {
                    console.log('[Registry] Keeping existing higher-priority error');
                    return null;
                }
            }
        }
        
        // Add the error
        const registered: RegisteredError = {
            ...error,
            id,
            contentHash,
            priority: this.calculatePriority(error)
        };
        
        this.errors.set(id, registered);
        
        // Update indices
        if (!this.errorsByRange.has(rangeKey)) {
            this.errorsByRange.set(rangeKey, new Set());
        }
        this.errorsByRange.get(rangeKey)!.add(id);
        
        if (!this.errorsByContent.has(contentHash)) {
            this.errorsByContent.set(contentHash, new Set());
        }
        this.errorsByContent.get(contentHash)!.add(id);
        
        return id;
    }
    
    private isDuplicate(existing: RegisteredError, newError: TextError): boolean {
        return (
            existing.start === newError.start &&
            existing.end === newError.end &&
            existing.type === newError.type &&
            existing.message === newError.message
        );
    }
    
    private shouldReplace(existing: RegisteredError, newError: TextError): boolean {
        const newPriority = this.calculatePriority(newError);
        return newPriority > existing.priority;
    }
    
    private calculatePriority(error: TextError): number {
        // Higher number = higher priority
        const priorities = {
            'spelling-high': 5,
            'grammar-high': 4,
            'spelling-medium': 3,
            'grammar-medium': 2,
            'spelling-low': 1,
            'style': 0
        };
        
        const key = `${error.type}-${error.confidence || 'medium'}`;
        return priorities[key] || 0;
    }
    
    getUniqueErrors(): TextError[] {
        return Array.from(this.errors.values())
            .sort((a, b) => a.start - b.start);
    }
    
    removeErrorsInRange(start: number, end: number) {
        const toRemove: string[] = [];
        
        this.errors.forEach((error, id) => {
            if (
                (error.start >= start && error.start < end) ||
                (error.end > start && error.end <= end)
            ) {
                toRemove.push(id);
            }
        });
        
        toRemove.forEach(id => this.removeError(id));
    }
}
```

### Task 4.2: Integrate Registry with CheckOrchestrator
```typescript
// CheckOrchestrator.ts - Use registry for deduplication
export class CheckOrchestrator {
    private errorRegistry = new ErrorRegistry();
    private checkedWords = new Map<string, Set<string>>(); // word -> paragraph indices
    
    async checkParagraph(request: ParagraphCheckRequest) {
        // Get words we've already checked in other paragraphs
        const alreadyChecked = new Set<string>();
        
        for (const [word, paragraphs] of this.checkedWords.entries()) {
            if (paragraphs.size > 0) {
                alreadyChecked.add(word.toLowerCase());
            }
        }
        
        // Perform check with optimization hints
        const result = await this.performCheck({
            ...request,
            skipWords: Array.from(alreadyChecked)
        });
        
        // Register errors, skipping duplicates
        const registeredErrors = [];
        for (const error of result.errors) {
            const id = this.errorRegistry.addError({
                ...error,
                start: error.start + request.position + 1,
                end: error.end + request.position + 1
            });
            
            if (id) {
                registeredErrors.push(error);
            }
        }
        
        // Update word tracking
        const words = this.extractWords(request.content);
        words.forEach(word => {
            const lower = word.toLowerCase();
            if (!this.checkedWords.has(lower)) {
                this.checkedWords.set(lower, new Set());
            }
            this.checkedWords.get(lower)!.add(request.index.toString());
        });
        
        // Emit only unique errors
        this.emit('paragraphChecked', {
            paragraphIndex: request.index,
            position: request.position,
            errors: registeredErrors
        });
    }
}
```

### Task 4.3: Batch Deduplication for Paste Operations
```typescript
// BatchChecker.ts - Efficient bulk checking
export class BatchChecker {
    async checkBulkContent(
        content: string, 
        offset: number,
        type: 'paste' | 'import'
    ): Promise<TextError[]> {
        // Extract all unique words
        const wordMap = new Map<string, WordPosition[]>();
        const wordRegex = /\b(\w+)\b/g;
        let match;
        
        while ((match = wordRegex.exec(content)) !== null) {
            const word = match[1].toLowerCase();
            const position = {
                start: offset + match.index,
                end: offset + match.index + match[1].length,
                original: match[1]
            };
            
            if (!wordMap.has(word)) {
                wordMap.set(word, []);
            }
            wordMap.get(word)!.push(position);
        }
        
        console.log(`[Batch] Checking ${wordMap.size} unique words from ${type}`);
        
        // Check each unique word once
        const errors: TextError[] = [];
        const checkPromises = Array.from(wordMap.entries()).map(async ([word, positions]) => {
            const result = await this.checkWord(word);
            
            if (result.hasError) {
                // Apply error to all instances
                positions.forEach(pos => {
                    errors.push({
                        ...result.error,
                        start: pos.start,
                        end: pos.end,
                        message: result.error.message.replace(word, pos.original)
                    });
                });
            }
        });
        
        await Promise.all(checkPromises);
        
        return errors;
    }
}
```

### Success Metrics
- 🚫 Zero duplicate errors shown
- 📊 Word "the" checked only once even if appears 50 times
- ⚡ Paste of 1000 words processes unique words only

---

## Sprint 5: Paste & Bulk Operations (2 days) 📋

### Goal
Handle paste, drop, and other bulk operations efficiently.

### Task 5.1: Detect Paste and Drop Events
```typescript
// EditorService.ts - Enhanced event detection
export class EditorService {
    constructor() {
        this.editor = new Editor({
            editorProps: {
                handlePaste: (view, event, slice) => {
                    const textContent = slice.content.textContent;
                    
                    if (textContent.length > 50) {
                        console.log(`[Paste] Detected ${textContent.length} chars`);
                        this.handleBulkInsert(textContent, view.state.selection.from, 'paste');
                    }
                    
                    return false; // Let ProseMirror handle the actual paste
                },
                
                handleDrop: (view, event, slice, moved) => {
                    if (slice) {
                        const textContent = slice.content.textContent;
                        this.handleBulkInsert(textContent, view.state.selection.from, 'drop');
                    }
                    return false;
                }
            }
        });
    }
    
    private handleBulkInsert(content: string, position: number, type: string) {
        // For large inserts, check immediately without debounce
        if (content.length > 500) {
            this.performProgressiveCheck(content, position);
        } else {
            this.performImmediateCheck(content, position);
        }
    }
}
```

### Task 5.2: Progressive Checking for Large Content
```typescript
// EditorService.ts - Progressive checking
private async performProgressiveCheck(content: string, offset: number) {
    const CHUNK_SIZE = 500; // Characters per chunk
    const chunks: ContentChunk[] = [];
    
    // Split content into chunks at paragraph boundaries
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';
    let currentOffset = 0;
    
    paragraphs.forEach(para => {
        if (currentChunk.length + para.length > CHUNK_SIZE && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk,
                offset: currentOffset
            });
            currentChunk = para;
            currentOffset += currentChunk.length;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + para;
        }
    });
    
    if (currentChunk) {
        chunks.push({
            content: currentChunk,
            offset: currentOffset
        });
    }
    
    console.log(`[Progressive] Checking ${chunks.length} chunks`);
    
    // Check first chunk immediately
    const firstChunkErrors = await this.batchChecker.checkBulkContent(
        chunks[0].content,
        offset + chunks[0].offset,
        'paste'
    );
    
    // Show first errors immediately
    this.decorationManager.addBulkErrors(firstChunkErrors);
    
    // Check remaining chunks progressively
    chunks.slice(1).forEach((chunk, index) => {
        setTimeout(async () => {
            const errors = await this.batchChecker.checkBulkContent(
                chunk.content,
                offset + chunk.offset,
                'paste'
            );
            this.decorationManager.addBulkErrors(errors);
        }, (index + 1) * 100); // Stagger by 100ms
    });
}
```

### Task 5.3: Smart Paste Detection
```typescript
// ChangeDetector.ts - Identify change types
export class ChangeDetector {
    detectChangeType(transaction: Transaction): ChangeInfo {
        // Check metadata
        const paste = transaction.getMeta('paste');
        const uiEvent = transaction.getMeta('uiEvent');
        
        if (paste) return { type: 'paste', data: paste };
        if (uiEvent === 'drop') return { type: 'drop' };
        
        // Analyze steps to detect bulk changes
        let totalInserted = 0;
        let totalDeleted = 0;
        let isContiguous = true;
        let lastPos = -1;
        
        transaction.steps.forEach(step => {
            step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
                const insertedSize = newEnd - newStart;
                const deletedSize = oldEnd - oldStart;
                
                totalInserted += insertedSize;
                totalDeleted += deletedSize;
                
                if (lastPos !== -1 && Math.abs(newStart - lastPos) > 1) {
                    isContiguous = false;
                }
                lastPos = newEnd;
            });
        });
        
        // Heuristics for paste detection
        if (totalInserted > 20 && isContiguous) {
            return { type: 'paste', size: totalInserted };
        }
        
        if (totalDeleted > 20 && totalInserted > 20) {
            return { type: 'replace', size: totalInserted };
        }
        
        return { type: 'typing' };
    }
}
```

### Success Metrics
- 📋 Paste of 1000 words shows first errors in <100ms
- 🔄 No UI freezing on large pastes
- 📈 Progressive loading for documents > 10KB

---

## Sprint 6: Performance Monitoring & Optimization (2 days) 📊

### Goal
Add instrumentation and optimize based on real usage data.

### Task 6.1: Performance Monitoring
```typescript
// PerformanceMonitor.ts
export class PerformanceMonitor {
    private metrics = {
        checkTimes: new Map<string, number[]>(),
        cacheHitRate: 0,
        totalErrors: 0,
        totalChecks: 0,
        userActions: new Map<string, number>()
    };
    
    private timers = new Map<string, number>();
    
    startTimer(operation: string, metadata?: any) {
        const id = `${operation}-${Date.now()}-${Math.random()}`;
        this.timers.set(id, performance.now());
        return id;
    }
    
    endTimer(id: string) {
        const start = this.timers.get(id);
        if (!start) return;
        
        const duration = performance.now() - start;
        const operation = id.split('-')[0];
        
        if (!this.metrics.checkTimes.has(operation)) {
            this.metrics.checkTimes.set(operation, []);
        }
        
        const times = this.metrics.checkTimes.get(operation)!;
        times.push(duration);
        
        // Keep only last 100 measurements
        if (times.length > 100) {
            times.shift();
        }
        
        this.timers.delete(id);
        
        // Log if slow
        if (duration > 100) {
            console.warn(`[Perf] Slow ${operation}: ${duration.toFixed(2)}ms`);
        }
    }
    
    recordUserAction(action: string) {
        this.metrics.userActions.set(
            action, 
            (this.metrics.userActions.get(action) || 0) + 1
        );
    }
    
    getStats() {
        const stats: any = {
            averageTimes: {},
            userActions: Object.fromEntries(this.metrics.userActions),
            cacheHitRate: this.metrics.cacheHitRate,
            errorsPerCheck: this.metrics.totalErrors / this.metrics.totalChecks
        };
        
        // Calculate averages
        for (const [operation, times] of this.metrics.checkTimes) {
            if (times.length > 0) {
                const avg = times.reduce((a, b) => a + b, 0) / times.length;
                stats.averageTimes[operation] = avg.toFixed(2) + 'ms';
            }
        }
        
        return stats;
    }
    
    logReport() {
        console.table(this.getStats());
    }
}
```

### Task 6.2: Request Prioritization
```typescript
// PriorityQueue.ts - Smart request scheduling
export class PriorityCheckQueue {
    private queues = {
        immediate: new PQueue({ concurrency: 1 }), // Instant word checks
        high: new PQueue({ concurrency: 1 }),      // Visible paragraphs  
        medium: new PQueue({ concurrency: 1 }),    // Recent edits
        low: new PQueue({ concurrency: 1 })        // Background checks
    };
    
    async add(
        task: () => Promise<any>, 
        priority: 'immediate' | 'high' | 'medium' | 'low',
        metadata?: any
    ) {
        const queue = this.queues[priority];
        
        return queue.add(async () => {
            const timer = this.monitor.startTimer(`check-${priority}`, metadata);
            try {
                const result = await task();
                return result;
            } finally {
                this.monitor.endTimer(timer);
            }
        });
    }
    
    getQueueSizes() {
        return {
            immediate: this.queues.immediate.size,
            high: this.queues.high.size,
            medium: this.queues.medium.size,
            low: this.queues.low.size,
            pending: this.queues.immediate.pending + 
                     this.queues.high.pending + 
                     this.queues.medium.pending + 
                     this.queues.low.pending
        };
    }
}
```

### Task 6.3: Optimization Based on Usage
```typescript
// AdaptiveOptimizer.ts - Adjust behavior based on usage
export class AdaptiveOptimizer {
    private userProfile = {
        averageTypingSpeed: 0,
        documentSize: 'small',
        errorRate: 0,
        commonErrors: new Map<string, number>()
    };
    
    updateProfile(metrics: PerformanceMetrics) {
        // Adjust debounce based on typing speed
        if (metrics.wordsPerMinute > 80) {
            this.settings.debounceMs = 200; // Fast typer
        } else if (metrics.wordsPerMinute < 40) {
            this.settings.debounceMs = 400; // Slow typer
        }
        
        // Adjust cache size based on document
        if (metrics.avgDocumentSize > 10000) {
            this.settings.cacheSize = 1000; // Large docs
        }
        
        // Pre-cache user's common errors
        metrics.commonErrors.forEach((count, error) => {
            if (count > 3) {
                this.preloadCache.add(error);
            }
        });
    }
    
    getOptimalSettings() {
        return {
            debounceMs: this.settings.debounceMs,
            cacheSize: this.settings.cacheSize,
            instantCheckThreshold: this.userProfile.errorRate > 0.1 ? 2 : 3,
            progressiveChunkSize: this.userProfile.documentSize === 'large' ? 1000 : 500
        };
    }
}
```

### Success Metrics
- 📊 Average check time < 50ms
- 💾 Cache hit rate > 40%
- ⚡ 95% of word checks complete in < 100ms
- 📈 Performance improves over time with usage

---

## Implementation Order & Dependencies

1. **Sprint 1** (Paragraph Checking) - Foundation for everything else
2. **Sprint 2** (Caching) - Builds on Sprint 1's paragraph structure  
3. **Sprint 3** (Instant Checking) - Can be done in parallel with Sprint 2
4. **Sprint 4** (Deduplication) - Requires Sprint 1 & 2
5. **Sprint 5** (Paste Handling) - Requires Sprint 4's deduplication
6. **Sprint 6** (Monitoring) - Can start anytime, but best after Sprint 1-3

## Testing Strategy

### Unit Tests
```typescript
describe('Paragraph Detection', () => {
    it('should detect changed paragraphs correctly');
    it('should handle paragraph insertion/deletion');
    it('should generate consistent hashes');
});

describe('Cache System', () => {
    it('should cache and retrieve results');
    it('should invalidate on content change');
    it('should respect TTL');
});

describe('Instant Checker', () => {
    it('should catch common typos');
    it('should handle edge cases');
    it('should have high accuracy');
});
```

### Integration Tests
```typescript
describe('Full System', () => {
    it('should check only changed content');
    it('should handle rapid typing');
    it('should process paste efficiently');
    it('should prevent duplicate errors');
});
```

### Performance Tests
```typescript
describe('Performance', () => {
    it('should check 100-word paragraph in <50ms');
    it('should handle 10k word paste without freezing');
    it('should maintain 40%+ cache hit rate');
});
```

## Success Metrics Summary

After implementing all sprints:
- ⚡ **10x faster** on documents > 1000 words
- 💨 **Instant feedback** on common typos
- 📊 **40%+ cache hit rate** reducing redundant work
- 🚫 **Zero duplicate** errors shown
- 📋 **No UI freezing** even on 10k+ word pastes
- 📈 **Adaptive performance** that improves with usage