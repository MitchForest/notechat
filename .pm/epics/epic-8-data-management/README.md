# Epic 8: Data Management 📊

## Overview
**Goal**: Implement robust data handling with persistence, real-time sync, offline support, and comprehensive import/export capabilities  
**Duration**: 2 sprints (1 week)  
**Prerequisites**: Epic 7 (Platform Features) completed - need authentication for user-specific data  
**Outcome**: Users can trust their data is always safe, synchronized, and portable

## Success Criteria
- **Sync Performance**: <500ms for note changes to sync
- **Offline Reliability**: 100% data preservation when offline
- **Conflict Resolution**: 95% automatic resolution success
- **Version History**: Access previous versions within 2s
- **Export Speed**: Export 1000 notes in <10s
- **Import Accuracy**: 99% fidelity for supported formats
- **Data Integrity**: Zero data loss incidents

## Context & Motivation

Previous epics built powerful features for creating and managing knowledge. Epic 8 ensures users never lose their work and can access it anywhere:

- **Real-time Sync**: Changes appear instantly across all devices
- **Offline First**: Full functionality without internet connection
- **Version Control**: Never lose work with automatic versioning
- **Data Portability**: Own your data with comprehensive import/export
- **Enterprise Ready**: Scalable architecture for thousands of notes

This epic transforms AI Notes from a web app into a reliable knowledge vault users can trust with their most important information.

## Features

### F15: Note Versioning
**Epic**: 2 | **Sprint**: 3 | **Complexity**: Medium

#### User Story
As a user, I want automatic version history for my notes so that I can recover from mistakes and see how my knowledge evolved.

#### Acceptance Criteria
- [ ] Automatic version creation on significant changes
- [ ] Version timeline with visual diff viewer
- [ ] One-click restore to any version
- [ ] Version comparison side-by-side
- [ ] Configurable retention policy (30/90/365 days)
- [ ] Storage efficient with incremental diffs
- [ ] Search within version history
- [ ] Bulk version operations
- [ ] Version branching for experiments
- [ ] Collaboration indicators on versions

#### Business Rules
1. New version every 5 minutes of active editing
2. Maximum 100 versions per note (configurable)
3. Older versions compressed after 30 days
4. Version metadata includes word count, edit time
5. Deleted note versions retained for 30 days

### F16: Export Options
**Epic**: 2 | **Sprint**: 3 | **Complexity**: Small

#### User Story
As a user, I want to export my notes in various formats so that I can use them outside AI Notes or create backups.

#### Acceptance Criteria
- [ ] Export formats: Markdown, PDF, HTML, JSON, DOCX
- [ ] Single note or bulk export
- [ ] Preserve formatting and metadata
- [ ] Include AI chat history optionally
- [ ] Export with folder structure
- [ ] Scheduled automatic exports
- [ ] Encrypted backup option
- [ ] Progress indicator for large exports
- [ ] Resume interrupted exports
- [ ] Email export links for large files

#### Business Rules
1. Maximum 10GB per export
2. Export links expire after 7 days
3. Rate limit: 10 exports per hour
4. Background processing for >100 notes
5. GDPR compliant with all user data included

### Advanced Data Features
**Epic**: 3 | **Sprint**: 1 | **Complexity**: Large

#### Real-time Sync
- [ ] WebSocket connection for live updates
- [ ] Operational Transformation for conflicts
- [ ] Presence indicators for shared notes
- [ ] Sync status indicators
- [ ] Selective sync for large accounts
- [ ] Bandwidth optimization

#### Offline Support
- [ ] Service Worker for offline access
- [ ] IndexedDB for local storage
- [ ] Background sync when reconnected
- [ ] Offline indicator UI
- [ ] Queue offline changes
- [ ] Smart conflict resolution

#### Import Capabilities
- [ ] Import from Notion, Obsidian, Roam
- [ ] Markdown file import with frontmatter
- [ ] Google Docs import via API
- [ ] CSV import for bulk notes
- [ ] Preserve internal links
- [ ] Import progress tracking

## Sprints

### Sprint 8.1: Persistence & Sync (3 days)

#### Day 1: Database Schema & Sync Infrastructure

**Supabase Integration**
- **Database Schema**: Optimized for real-time
  ```sql
  -- Users table (from auth)
  create table users (
    id uuid primary key,
    email text unique not null,
    created_at timestamptz default now()
  );

  -- Notes table with soft delete
  create table notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    title text not null,
    content text,
    content_plain text, -- for search
    space_id uuid references spaces(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz,
    version integer default 1,
    word_count integer,
    
    -- Indexes for performance
    index idx_notes_user_id on notes(user_id),
    index idx_notes_updated_at on notes(updated_at),
    index idx_notes_deleted_at on notes(deleted_at)
  );

  -- Note versions table
  create table note_versions (
    id uuid primary key default gen_random_uuid(),
    note_id uuid references notes(id) on delete cascade,
    version integer not null,
    title text not null,
    content text,
    diff jsonb, -- storing diffs for efficiency
    created_at timestamptz default now(),
    created_by uuid references users(id),
    word_count integer,
    edit_duration interval,
    
    unique(note_id, version)
  );

  -- Collections table
  create table collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    space_id uuid references spaces(id),
    name text not null,
    type text check (type in ('manual', 'smart', 'favorites', 'recent')),
    rules jsonb,
    position integer,
    created_at timestamptz default now()
  );

  -- Note collections junction
  create table note_collections (
    note_id uuid references notes(id) on delete cascade,
    collection_id uuid references collections(id) on delete cascade,
    added_at timestamptz default now(),
    
    primary key (note_id, collection_id)
  );

  -- Real-time sync queue
  create table sync_queue (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id),
    operation text check (operation in ('create', 'update', 'delete')),
    resource_type text,
    resource_id uuid,
    data jsonb,
    created_at timestamptz default now(),
    processed_at timestamptz,
    error text
  );
  ```

- **Real-time Subscriptions**: Supabase Realtime
  - Note changes subscription per user
  - Presence tracking for collaboration
  - Optimistic updates with rollback
  - Connection state management

- **Sync Engine**: Conflict-free synchronization
  - Operation queue for offline changes
  - Conflict resolution strategies
  - Merge algorithms for concurrent edits
  - Sync status tracking

#### Day 2: Offline Support & Local Storage

**Service Worker Implementation**
- **Offline-First Architecture**: Always available
  ```typescript
  // service-worker.ts
  const CACHE_NAME = 'ai-notes-v1'
  const API_CACHE = 'ai-notes-api-v1'
  
  // Resources to cache
  const STATIC_RESOURCES = [
    '/',
    '/app',
    '/offline',
    '/manifest.json',
    // CSS, JS bundles added dynamically
  ]

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_RESOURCES)
      })
    )
  })

  self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // API requests
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Cache successful API responses
            if (response.ok) {
              const responseToCache = response.clone()
              caches.open(API_CACHE).then((cache) => {
                cache.put(request, responseToCache)
              })
            }
            return response
          })
          .catch(() => {
            // Offline - return cached response
            return caches.match(request)
          })
      )
      return
    }

    // Static resources
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request)
      })
    )
  })
  ```

- **IndexedDB Storage**: Local data persistence
  - Notes and versions storage
  - Sync queue for offline changes
  - Attachment caching
  - Full-text search index

- **Background Sync**: Reliable offline-to-online
  - Queue offline operations
  - Retry failed syncs
  - Conflict detection
  - Progress tracking

#### Day 3: Conflict Resolution & Data Integrity

**Operational Transformation**
- **Three-Way Merge**: Smart conflict resolution
  - Detect concurrent edits
  - Character-level diffing
  - Automatic merge when possible
  - Manual resolution UI when needed

- **Version Control System**: Git-like for notes
  - Branching for experiments
  - Merge capabilities
  - Diff visualization
  - Rollback support

- **Data Integrity Measures**: Never lose data
  - Checksums for content verification
  - Audit trail for all operations
  - Automatic backups before merges
  - Recovery procedures

### Sprint 8.2: Import/Export & Version History (4 days)

#### Day 1: Version History System

**Version Management**
- **Automatic Versioning**: Intelligent snapshots
  ```typescript
  class VersionManager {
    private pendingVersion: NodeJS.Timeout | null = null
    private lastContent: string = ''
    private editStartTime: Date | null = null
    
    async createVersion(note: Note, trigger: VersionTrigger) {
      // Calculate what changed
      const diff = this.calculateDiff(this.lastContent, note.content)
      
      // Determine if version is needed
      if (!this.shouldCreateVersion(diff, trigger)) {
        return
      }
      
      const version: NoteVersion = {
        id: generateId(),
        noteId: note.id,
        version: await this.getNextVersion(note.id),
        title: note.title,
        content: note.content,
        diff: this.optimizeDiff(diff),
        createdAt: new Date(),
        createdBy: getCurrentUser().id,
        wordCount: this.countWords(note.content),
        editDuration: this.calculateEditDuration(),
        trigger,
        metadata: {
          addedWords: diff.added.length,
          removedWords: diff.removed.length,
          significance: this.calculateSignificance(diff),
        }
      }
      
      await this.saveVersion(version)
      await this.pruneOldVersions(note.id)
      
      this.lastContent = note.content
      this.editStartTime = new Date()
    }
    
    private shouldCreateVersion(diff: Diff, trigger: VersionTrigger): boolean {
      // Always version for explicit triggers
      if (['manual', 'beforeDelete', 'import'].includes(trigger)) {
        return true
      }
      
      // Check significance threshold
      const significance = this.calculateSignificance(diff)
      return significance > 0.1 // 10% change
    }
    
    async getVersionHistory(noteId: string): Promise<VersionTimeline> {
      const versions = await db.noteVersions.where({ noteId }).toArray()
      
      return {
        versions: versions.map(v => ({
          ...v,
          sizeChange: this.calculateSizeChange(v),
          summary: this.generateVersionSummary(v),
        })),
        timeline: this.groupVersionsByPeriod(versions),
        statistics: this.calculateVersionStats(versions),
      }
    }
  }
  ```

- **Version UI Components**: Beautiful history
  - Timeline visualization
  - Diff viewer with syntax highlighting
  - Side-by-side comparison
  - Restore confirmation dialog

- **Storage Optimization**: Efficient versioning
  - Delta compression for old versions
  - Periodic snapshot consolidation
  - Configurable retention policies
  - Archive to cold storage

#### Day 2: Export System

**Export Engine**
- **Multi-Format Exporter**: Comprehensive options
  ```typescript
  class ExportService {
    async exportNotes(
      notes: Note[],
      format: ExportFormat,
      options: ExportOptions
    ): Promise<ExportResult> {
      // Validate export size
      const estimatedSize = this.estimateExportSize(notes, format)
      if (estimatedSize > MAX_EXPORT_SIZE) {
        throw new ExportSizeError(estimatedSize)
      }
      
      // Create export job
      const job = await this.createExportJob({
        noteIds: notes.map(n => n.id),
        format,
        options,
        userId: getCurrentUser().id,
      })
      
      // Process based on size
      if (notes.length > 100 || estimatedSize > 10_000_000) {
        // Background processing
        await this.queueBackgroundExport(job)
        return { jobId: job.id, status: 'processing' }
      }
      
      // Immediate processing
      const result = await this.processExport(job)
      return { ...result, status: 'completed' }
    }
    
    private async processExport(job: ExportJob): Promise<ExportData> {
      const notes = await this.loadNotesWithRelations(job.noteIds)
      
      switch (job.format) {
        case 'markdown':
          return this.exportToMarkdown(notes, job.options)
        case 'pdf':
          return this.exportToPDF(notes, job.options)
        case 'html':
          return this.exportToHTML(notes, job.options)
        case 'json':
          return this.exportToJSON(notes, job.options)
        case 'docx':
          return this.exportToDocx(notes, job.options)
        default:
          throw new Error(`Unsupported format: ${job.format}`)
      }
    }
    
    private async exportToMarkdown(
      notes: Note[],
      options: ExportOptions
    ): Promise<ExportData> {
      const files: ExportFile[] = []
      
      for (const note of notes) {
        let content = note.content
        
        // Add frontmatter if requested
        if (options.includeFrontmatter) {
          const frontmatter = this.generateFrontmatter(note)
          content = `---\n${frontmatter}\n---\n\n${content}`
        }
        
        // Include chat history if requested
        if (options.includeChatHistory && note.chatHistory) {
          content += '\n\n## AI Chat History\n\n'
          content += this.formatChatHistory(note.chatHistory)
        }
        
        files.push({
          path: this.getExportPath(note, options),
          content,
          metadata: {
            created: note.createdAt,
            modified: note.updatedAt,
          }
        })
      }
      
      // Create zip if multiple files
      if (files.length > 1) {
        return this.createZipArchive(files)
      }
      
      return { files, format: 'markdown' }
    }
  }
  ```

- **Export Options UI**: User control
  - Format selection with previews
  - Options per format
  - Folder structure customization
  - Progress tracking

- **Scheduled Exports**: Automatic backups
  - Daily/weekly/monthly options
  - Destination selection (email, cloud)
  - Encryption options
  - Retention policies

#### Day 3: Import System

**Import Engine**
- **Universal Importer**: Multiple sources
  ```typescript
  class ImportService {
    private importers: Map<string, Importer> = new Map([
      ['notion', new NotionImporter()],
      ['obsidian', new ObsidianImporter()],
      ['roam', new RoamImporter()],
      ['markdown', new MarkdownImporter()],
      ['gdocs', new GoogleDocsImporter()],
    ])
    
    async detectFormat(file: File): Promise<ImportFormat> {
      // Check file extension
      const extension = file.name.split('.').pop()?.toLowerCase()
      
      // Check content patterns
      const sample = await this.readSample(file)
      
      for (const [format, importer] of this.importers) {
        if (importer.canImport(extension, sample)) {
          return format as ImportFormat
        }
      }
      
      throw new Error('Unsupported file format')
    }
    
    async importFile(
      file: File,
      options: ImportOptions
    ): Promise<ImportResult> {
      const format = await this.detectFormat(file)
      const importer = this.importers.get(format)!
      
      // Parse file
      const parseResult = await importer.parse(file)
      
      // Show preview
      const preview = await this.generatePreview(parseResult)
      const userChoices = await this.showImportDialog(preview)
      
      if (!userChoices.confirmed) {
        return { cancelled: true }
      }
      
      // Process import
      const importJob = await this.createImportJob({
        format,
        data: parseResult,
        options: { ...options, ...userChoices },
      })
      
      return this.processImport(importJob)
    }
    
    private async processImport(job: ImportJob): Promise<ImportResult> {
      const notes: Note[] = []
      const errors: ImportError[] = []
      
      for (const item of job.data.items) {
        try {
          const note = await this.convertToNote(item, job.options)
          
          // Preserve internal links
          if (job.options.preserveLinks) {
            note.content = await this.updateInternalLinks(
              note.content,
              job.data.linkMap
            )
          }
          
          // Handle attachments
          if (item.attachments && job.options.importAttachments) {
            await this.importAttachments(note.id, item.attachments)
          }
          
          notes.push(note)
        } catch (error) {
          errors.push({
            item: item.title,
            error: error.message,
          })
        }
      }
      
      // Create notes in batches
      await this.batchCreateNotes(notes)
      
      return {
        imported: notes.length,
        failed: errors.length,
        errors,
        notes,
      }
    }
  }
  ```

- **Import Preview**: Know what you're getting
  - File structure visualization
  - Content preview
  - Conflict detection
  - Mapping configuration

- **Format-Specific Importers**: Faithful imports
  - Notion: Databases, relations, embeds
  - Obsidian: Plugins, frontmatter, links
  - Roam: Block references, queries
  - Google Docs: Formatting, comments

#### Day 4: Data Migration & Recovery

**Migration System**
- **Schema Migrations**: Evolve safely
  ```typescript
  class MigrationRunner {
    async runPendingMigrations() {
      const currentVersion = await this.getCurrentVersion()
      const migrations = await this.getPendingMigrations(currentVersion)
      
      for (const migration of migrations) {
        await this.runMigration(migration)
      }
    }
    
    private async runMigration(migration: Migration) {
      const backup = await this.createBackup()
      
      try {
        await db.transaction('rw', db.allTables, async () => {
          await migration.up(db)
          await this.recordMigration(migration)
        })
      } catch (error) {
        await this.restoreBackup(backup)
        throw new MigrationError(migration, error)
      }
    }
  }
  ```

- **Data Recovery Tools**: Never lose data
  - Automatic backups before risky operations
  - Point-in-time recovery
  - Corrupted data repair
  - Bulk operations undo

- **GDPR Compliance**: Data ownership
  - Complete data export
  - Right to deletion
  - Data portability
  - Audit trails

## Technical Architecture

### Sync Architecture

```typescript
// Real-time sync system
interface SyncSystem {
  engine: SyncEngine
  queue: SyncQueue
  resolver: ConflictResolver
  monitor: SyncMonitor
}

interface SyncEngine {
  // Connection management
  connect(): Promise<void>
  disconnect(): void
  reconnect(): Promise<void>
  
  // Sync operations
  push(changes: Change[]): Promise<SyncResult>
  pull(since: Date): Promise<Change[]>
  sync(): Promise<SyncStatus>
  
  // Subscriptions
  subscribe(resource: string, callback: (change: Change) => void): () => void
  presence(callback: (presence: Presence[]) => void): () => void
}

class RealtimeSyncEngine implements SyncEngine {
  private supabase: SupabaseClient
  private websocket: RealtimeChannel | null = null
  private syncQueue: SyncQueue
  private offlineQueue: Change[] = []
  
  async connect() {
    // Initialize Supabase realtime
    this.websocket = this.supabase
      .channel('notes-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${this.userId}`,
      }, this.handleRemoteChange.bind(this))
      .on('presence', { event: 'sync' }, this.handlePresence.bind(this))
      .subscribe()
    
    // Process offline queue
    if (this.offlineQueue.length > 0) {
      await this.processOfflineQueue()
    }
  }
  
  private async handleRemoteChange(payload: any) {
    const change: Change = {
      id: payload.new.id || payload.old.id,
      type: this.getChangeType(payload),
      table: payload.table,
      data: payload.new,
      timestamp: new Date(payload.commit_timestamp),
      userId: payload.new?.user_id,
    }
    
    // Check if this is our own change
    if (this.syncQueue.isOwnChange(change)) {
      this.syncQueue.markSynced(change.id)
      return
    }
    
    // Apply remote change
    await this.applyRemoteChange(change)
  }
  
  async push(changes: Change[]): Promise<SyncResult> {
    const results: SyncResult = {
      successful: [],
      failed: [],
      conflicts: [],
    }
    
    for (const change of changes) {
      try {
        // Check for conflicts
        const conflict = await this.detectConflict(change)
        if (conflict) {
          const resolved = await this.resolveConflict(conflict)
          if (!resolved) {
            results.conflicts.push(conflict)
            continue
          }
        }
        
        // Apply change
        await this.applyChange(change)
        results.successful.push(change)
        
      } catch (error) {
        results.failed.push({ change, error })
        
        // Queue for retry if offline
        if (this.isOfflineError(error)) {
          this.offlineQueue.push(change)
        }
      }
    }
    
    return results
  }
}
```

### Conflict Resolution System

```typescript
// Conflict resolution architecture
interface ConflictResolver {
  detect(local: Change, remote: Change): Conflict | null
  resolve(conflict: Conflict): Promise<Resolution>
  merge(local: string, remote: string, base: string): MergeResult
}

class OperationalTransformResolver implements ConflictResolver {
  detect(local: Change, remote: Change): Conflict | null {
    // No conflict if different resources
    if (local.resourceId !== remote.resourceId) return null
    
    // No conflict if same user
    if (local.userId === remote.userId) return null
    
    // Check timestamps
    const timeDiff = Math.abs(
      local.timestamp.getTime() - remote.timestamp.getTime()
    )
    
    // If changes are far apart, no conflict
    if (timeDiff > 60000) return null // 1 minute
    
    return {
      id: generateId(),
      type: 'concurrent_edit',
      local,
      remote,
      baseVersion: local.baseVersion,
    }
  }
  
  async resolve(conflict: Conflict): Promise<Resolution> {
    switch (conflict.type) {
      case 'concurrent_edit':
        return this.resolveContentConflict(conflict)
      case 'delete_edit':
        return this.resolveDeleteConflict(conflict)
      case 'structural':
        return this.resolveStructuralConflict(conflict)
      default:
        return { action: 'manual', conflict }
    }
  }
  
  private async resolveContentConflict(conflict: Conflict): Promise<Resolution> {
    const local = conflict.local.data.content
    const remote = conflict.remote.data.content
    const base = await this.getBaseContent(conflict.baseVersion)
    
    // Try three-way merge
    const mergeResult = this.merge(local, remote, base)
    
    if (mergeResult.success) {
      return {
        action: 'auto_merge',
        result: mergeResult.content,
        operations: mergeResult.operations,
      }
    }
    
    // Try operational transform
    const transformed = this.transformOperations(
      conflict.local.operations,
      conflict.remote.operations
    )
    
    if (transformed.success) {
      return {
        action: 'transform',
        result: transformed.content,
        operations: transformed.operations,
      }
    }
    
    // Manual resolution needed
    return {
      action: 'manual',
      conflict,
      suggestions: this.generateSuggestions(conflict),
    }
  }
  
  merge(local: string, remote: string, base: string): MergeResult {
    // Use diff3 algorithm
    const diffs = this.diff3(base, local, remote)
    
    let merged = ''
    let hasConflicts = false
    
    for (const section of diffs) {
      if (section.conflict) {
        hasConflicts = true
        // Include both versions with markers
        merged += `<<<<<<< LOCAL\n${section.local}\n=======\n${section.remote}\n>>>>>>> REMOTE\n`
      } else {
        merged += section.content
      }
    }
    
    return {
      success: !hasConflicts,
      content: merged,
      conflicts: hasConflicts ? this.extractConflicts(merged) : [],
    }
  }
}
```

### Version Storage System

```typescript
// Version management
interface VersionStorage {
  store: VersionStore
  compressor: VersionCompressor
  archiver: VersionArchiver
  cleaner: VersionCleaner
}

class VersionStore {
  private db: IDBDatabase
  private compression: CompressionStream
  
  async saveVersion(version: NoteVersion): Promise<void> {
    // Compress if large
    if (version.content.length > 10000) {
      version.diff = await this.compressor.compress(version.diff)
      version.compressed = true
    }
    
    // Store in IndexedDB
    await this.db.transaction(['versions'], 'readwrite')
      .objectStore('versions')
      .add(version)
    
    // Sync to cloud if online
    if (navigator.onLine) {
      await this.syncVersionToCloud(version)
    } else {
      await this.queueForSync(version)
    }
  }
  
  async getVersions(
    noteId: string,
    options?: VersionQueryOptions
  ): Promise<NoteVersion[]> {
    const versions = await this.db.transaction(['versions'], 'readonly')
      .objectStore('versions')
      .index('noteId')
      .getAll(noteId)
    
    // Apply filters
    let filtered = versions
    
    if (options?.since) {
      filtered = filtered.filter(v => v.createdAt > options.since)
    }
    
    if (options?.limit) {
      filtered = filtered.slice(-options.limit)
    }
    
    // Decompress if needed
    return Promise.all(
      filtered.map(async v => {
        if (v.compressed) {
          v.diff = await this.compressor.decompress(v.diff)
        }
        return v
      })
    )
  }
  
  async pruneVersions(noteId: string): Promise<void> {
    const versions = await this.getVersions(noteId)
    const policy = await this.getRetentionPolicy()
    
    // Keep recent versions
    const keep = versions.slice(-policy.minVersions)
    const candidates = versions.slice(0, -policy.minVersions)
    
    // Apply time-based rules
    const toDelete = candidates.filter(v => {
      const age = Date.now() - v.createdAt.getTime()
      
      if (age < policy.keepAllDuration) return false
      if (age < policy.keepDailyDuration) {
        // Keep one per day
        return !this.isFirstOfDay(v, versions)
      }
      if (age < policy.keepWeeklyDuration) {
        // Keep one per week
        return !this.isFirstOfWeek(v, versions)
      }
      
      // Keep one per month for older
      return !this.isFirstOfMonth(v, versions)
    })
    
    // Delete pruned versions
    for (const version of toDelete) {
      await this.deleteVersion(version.id)
    }
  }
}
```

### Import/Export System

```typescript
// Import/Export architecture
interface DataPortability {
  exporter: UniversalExporter
  importer: UniversalImporter
  converter: FormatConverter
  validator: DataValidator
}

class UniversalExporter {
  private exporters = new Map<ExportFormat, Exporter>()
  
  async export(request: ExportRequest): Promise<ExportResult> {
    // Validate request
    const validation = await this.validator.validate(request)
    if (!validation.valid) {
      throw new ExportValidationError(validation.errors)
    }
    
    // Get exporter
    const exporter = this.exporters.get(request.format)
    if (!exporter) {
      throw new UnsupportedFormatError(request.format)
    }
    
    // Prepare data
    const data = await this.prepareData(request)
    
    // Export
    const result = await exporter.export(data, request.options)
    
    // Post-process
    return this.postProcess(result, request)
  }
  
  private async prepareData(request: ExportRequest): Promise<ExportData> {
    const notes = await this.loadNotes(request.noteIds)
    
    // Include related data if requested
    const data: ExportData = { notes }
    
    if (request.options.includeVersions) {
      data.versions = await this.loadVersions(request.noteIds)
    }
    
    if (request.options.includeChats) {
      data.chats = await this.loadChats(request.noteIds)
    }
    
    if (request.options.includeMetadata) {
      data.metadata = await this.gatherMetadata(notes)
    }
    
    return data
  }
  
  private async postProcess(
    result: RawExportResult,
    request: ExportRequest
  ): Promise<ExportResult> {
    // Encrypt if requested
    if (request.options.encrypt) {
      result.data = await this.encrypt(result.data, request.options.password)
    }
    
    // Create download link
    const url = await this.createDownloadUrl(result)
    
    // Send email if requested
    if (request.options.emailTo) {
      await this.emailExport(url, request.options.emailTo)
    }
    
    return {
      url,
      size: result.size,
      format: request.format,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
  }
}

class NotionImporter implements Importer {
  async parse(file: File): Promise<ParseResult> {
    const content = await file.text()
    const data = JSON.parse(content)
    
    // Validate Notion export format
    if (!this.isNotionExport(data)) {
      throw new Error('Invalid Notion export format')
    }
    
    const items: ImportItem[] = []
    const linkMap = new Map<string, string>()
    
    // Process pages
    for (const page of data.pages) {
      const item = await this.parsePage(page)
      items.push(item)
      
      // Track for link mapping
      linkMap.set(page.id, item.id)
    }
    
    // Process databases
    for (const db of data.databases || []) {
      const dbItems = await this.parseDatabase(db)
      items.push(...dbItems)
    }
    
    return {
      format: 'notion',
      items,
      linkMap,
      metadata: {
        exportDate: data.exportDate,
        version: data.version,
      },
    }
  }
  
  private async parsePage(page: any): Promise<ImportItem> {
    const content = await this.convertBlocks(page.content)
    
    return {
      id: generateId(),
      title: page.title,
      content,
      createdAt: new Date(page.created_time),
      updatedAt: new Date(page.last_edited_time),
      properties: page.properties,
      attachments: await this.extractAttachments(page),
      metadata: {
        notionId: page.id,
        notionUrl: page.url,
      },
    }
  }
  
  private async convertBlocks(blocks: any[]): Promise<string> {
    let markdown = ''
    
    for (const block of blocks) {
      switch (block.type) {
        case 'paragraph':
          markdown += this.convertRichText(block.paragraph.rich_text) + '\n\n'
          break
        case 'heading_1':
          markdown += `# ${this.convertRichText(block.heading_1.rich_text)}\n\n`
          break
        case 'bulleted_list_item':
          markdown += `- ${this.convertRichText(block.bulleted_list_item.rich_text)}\n`
          break
        case 'code':
          markdown += `\`\`\`${block.code.language}\n${block.code.rich_text[0]?.plain_text}\n\`\`\`\n\n`
          break
        // ... handle all block types
      }
      
      // Recursively process children
      if (block.children) {
        markdown += await this.convertBlocks(block.children)
      }
    }
    
    return markdown
  }
}
```

## UI/UX Design Patterns

### Version History Timeline
```
┌─────────────────────────────────────┐
│ 📜 Version History - Project Plan   │
├─────────────────────────────────────┤
│ [Now] [1 day] [1 week] [1 month]   │
├─────────────────────────────────────┤
│ Today                               │
│ ● 3:45 PM - Current version         │
│   2,456 words · 5 min edit          │
│                                     │
│ ● 2:30 PM - Auto-save              │
│   2,301 words · 12 min edit        │
│   + Added section on timeline       │
│                                     │
│ ● 10:15 AM - Manual save           │
│   2,156 words · 45 min edit        │
│   ✏️ Major restructuring            │
│                                     │
│ Yesterday                           │
│ ● 4:20 PM - Auto-save              │
│   1,892 words · 8 min edit         │
│   + Added budget estimates          │
│                                     │
│ ● 11:30 AM - Import from Notion    │
│   1,245 words · Initial import      │
│   📥 Imported with 3 attachments    │
│                                     │
│ [Load more...]                      │
├─────────────────────────────────────┤
│ [Compare] [Restore] [Export]        │
└─────────────────────────────────────┘
```

### Sync Status Indicator
```
┌─────────────────────────────────────┐
│ 🔄 Syncing...                    2s │
│ ████████░░ 4 of 5 changes          │
└─────────────────────────────────────┘
         ↓ Expands to ↓
┌─────────────────────────────────────┐
│ 📊 Sync Details                     │
├─────────────────────────────────────┤
│ ✓ Note "Project Plan" updated      │
│ ✓ Created "Meeting Notes"          │
│ ✓ Deleted "Old Draft"              │
│ ⟳ Uploading "Research Doc"... 60%  │
│ ⏳ 1 change queued (offline)       │
├─────────────────────────────────────┤
│ Last sync: 2 seconds ago           │
│ [Retry] [View Queue]               │
└─────────────────────────────────────┘
```

### Export Dialog
```
┌─────────────────────────────────────┐
│ 📤 Export Notes                     │
├─────────────────────────────────────┤
│ What to export:                     │
│ ◉ Current note                     │
│ ○ Selected notes (0)               │
│ ○ Current space                    │
│ ○ All notes                        │
│                                     │
│ Format:                             │
│ [Markdown ▼]                        │
│                                     │
│ ☑ Include metadata (dates, tags)   │
│ ☑ Include version history          │
│ ☐ Include AI chat history          │
│ ☑ Preserve folder structure        │
│                                     │
│ Advanced Options:                   │
│ ☐ Encrypt export (set password)    │
│ ☐ Email download link to:          │
│   [email@example.com          ]     │
│                                     │
│ Estimated size: 2.4 MB              │
│                                     │
│ [Cancel] [Export]                   │
└─────────────────────────────────────┘
```

### Import Preview
```
┌─────────────────────────────────────┐
│ 📥 Import Preview                   │
├─────────────────────────────────────┤
│ Source: Notion Export               │
│ File: my-workspace-export.zip       │
│                                     │
│ Found:                              │
│ • 156 pages                         │
│ • 12 databases                      │
│ • 89 attachments (45 MB)            │
│                                     │
│ Structure:                          │
│ 📁 Projects                         │
│   📄 Q1 Planning                    │
│   📄 Q2 Review                      │
│   📁 Research                       │
│     📄 Market Analysis              │
│     📄 Competitor Review            │
│ 📁 Personal                         │
│   📄 Reading List                   │
│   📊 Habit Tracker (database)       │
│                                     │
│ Import to: [Work Space ▼]           │
│                                     │
│ Options:                            │
│ ☑ Preserve internal links          │
│ ☑ Import attachments               │
│ ☐ Merge with existing notes        │
│                                     │
│ ⚠️ 3 potential conflicts detected   │
│ [View Conflicts]                    │
│                                     │
│ [Cancel] [Customize] [Import All]   │
└─────────────────────────────────────┘
```

### Conflict Resolution UI
```
┌─────────────────────────────────────┐
│ ⚠️ Merge Conflict                   │
├─────────────────────────────────────┤
│ "Project Roadmap" edited in two     │
│ places simultaneously               │
│                                     │
│ Your version (2:30 PM):             │
│ ┌─────────────────────────────┐     │
│ │ ## Timeline                  │     │
│ │ - Q1: Foundation work       │     │
│ │ - Q2: Feature development   │     │
│ │ - Q3: Beta launch           │     │
│ └─────────────────────────────┘     │
│                                     │
│ Sarah's version (2:31 PM):          │
│ ┌─────────────────────────────┐     │
│ │ ## Timeline                  │     │
│ │ - Q1: Research phase        │     │
│ │ - Q2: Development sprint    │     │
│ │ - Q3: Testing and launch    │     │
│ └─────────────────────────────┘     │
│                                     │
│ ○ Keep my version                   │
│ ○ Keep Sarah's version              │
│ ◉ Merge both (recommended)          │
│ ○ View detailed comparison          │
│                                     │
│ [Cancel] [Resolve]                  │
└─────────────────────────────────────┘
```

## Implementation Details

### File Structure
```
features/data/
├── sync/
│   ├── sync-engine.ts
│   ├── sync-queue.ts
│   ├── conflict-resolver.ts
│   ├── operational-transform.ts
│   └── components/
│       ├── sync-status.tsx
│       └── conflict-dialog.tsx
├── offline/
│   ├── service-worker.ts
│   ├── offline-storage.ts
│   ├── background-sync.ts
│   └── components/
│       └── offline-indicator.tsx
├── versions/
│   ├── version-manager.ts
│   ├── version-store.ts
│   ├── diff-engine.ts
│   └── components/
│       ├── version-timeline.tsx
│       ├── version-diff.tsx
│       └── restore-dialog.tsx
├── export/
│   ├── export-service.ts
│   ├── exporters/
│   │   ├── markdown-exporter.ts
│   │   ├── pdf-exporter.ts
│   │   ├── html-exporter.ts
│   │   └── docx-exporter.ts
│   └── components/
│       ├── export-dialog.tsx
│       └── export-progress.tsx
├── import/
│   ├── import-service.ts
│   ├── importers/
│   │   ├── notion-importer.ts
│   │   ├── obsidian-importer.ts
│   │   └── markdown-importer.ts
│   └── components/
│       ├── import-dialog.tsx
│       └── import-preview.tsx
└── database/
    ├── schema.sql
    ├── migrations/
    └── backup-service.ts
```

### Sync Implementation

```typescript
// features/data/sync/sync-engine.ts
export class SyncEngine {
  private supabase: SupabaseClient
  private queue: SyncQueue
  private resolver: ConflictResolver
  private channel: RealtimeChannel | null = null
  
  async initialize(userId: string) {
    // Set up real-time subscription
    this.channel = this.supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          filter: `user_id=eq.${userId}`,
        },
        this.handleDatabaseChange.bind(this)
      )
      .subscribe()
    
    // Initial sync
    await this.performInitialSync()
    
    // Process any queued changes
    await this.queue.processQueue()
  }
  
  private async handleDatabaseChange(payload: any) {
    const { table, eventType, new: newRecord, old: oldRecord } = payload
    
    // Skip if this is our own change
    if (this.queue.isOwnChange(payload.id)) {
      return
    }
    
    // Handle based on event type
    switch (eventType) {
      case 'INSERT':
        await this.handleRemoteInsert(table, newRecord)
        break
      case 'UPDATE':
        await this.handleRemoteUpdate(table, newRecord, oldRecord)
        break
      case 'DELETE':
        await this.handleRemoteDelete(table, oldRecord)
        break
    }
  }
  
  async pushChanges(changes: LocalChange[]) {
    const results = []
    
    for (const change of changes) {
      try {
        // Mark as own change to prevent echo
        this.queue.markAsOwn(change.id)
        
        // Apply to server
        const result = await this.applyChangeToServer(change)
        results.push({ success: true, change, result })
        
      } catch (error) {
        if (error.code === 'CONFLICT') {
          // Handle conflict
          const resolution = await this.resolver.resolve(change, error.serverState)
          if (resolution.resolved) {
            results.push({ success: true, change, resolution })
          } else {
            results.push({ success: false, change, conflict: resolution })
          }
        } else {
          results.push({ success: false, change, error })
        }
      }
    }
    
    return results
  }
}
```

### Version History Implementation

```typescript
// features/data/versions/components/version-timeline.tsx
"use client"

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Clock, GitBranch, Download, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useVersions } from '../hooks/use-versions'

interface VersionTimelineProps {
  noteId: string
  onRestore?: (versionId: string) => void
  onCompare?: (versionA: string, versionB: string) => void
}

export function VersionTimeline({
  noteId,
  onRestore,
  onCompare,
}: VersionTimelineProps) {
  const { versions, loading, loadMore, hasMore } = useVersions(noteId)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week')
  
  const filteredVersions = versions.filter(v => {
    if (timeRange === 'all') return true
    
    const cutoff = new Date()
    switch (timeRange) {
      case 'day':
        cutoff.setDate(cutoff.getDate() - 1)
        break
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7)
        break
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1)
        break
    }
    
    return v.createdAt > cutoff
  })
  
  const handleVersionClick = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId))
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId])
    }
  }
  
  useEffect(() => {
    if (selectedVersions.length === 2 && onCompare) {
      onCompare(selectedVersions[0], selectedVersions[1])
    }
  }, [selectedVersions, onCompare])
  
  if (loading && versions.length === 0) {
    return <div>Loading version history...</div>
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Version History</h3>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'all'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range as any)}
            >
              {range === 'all' ? 'All time' : `Past ${range}`}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        {filteredVersions.map((version, index) => {
          const isSelected = selectedVersions.includes(version.id)
          const isLatest = index === 0
          
          return (
            <Card
              key={version.id}
              className={`p-4 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleVersionClick(version.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(version.createdAt, 'MMM d, h:mm a')}
                    </span>
                    {isLatest && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                  
                  <div className="mt-1 text-sm text-muted-foreground">
                    {version.wordCount} words · {version.editDuration}
                  </div>
                  
                  {version.summary && (
                    <p className="mt-2 text-sm">{version.summary}</p>
                  )}
                  
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {version.metadata.addedWords > 0 && 
                        `+${version.metadata.addedWords} words`}
                    </span>
                    <span>
                      {version.metadata.removedWords > 0 && 
                        `-${version.metadata.removedWords} words`}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {!isLatest && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRestore?.(version.id)
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Download version
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      
      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load more versions'}
        </Button>
      )}
      
      {selectedVersions.length === 2 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
          <Card className="p-4 shadow-lg">
            <p className="text-sm">
              Comparing 2 versions · 
              <Button
                variant="link"
                className="px-1"
                onClick={() => setSelectedVersions([])}
              >
                Clear selection
              </Button>
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
```

## Error Handling & Recovery

### Sync Error Handling

```typescript
class SyncErrorHandler {
  async handleSyncError(error: SyncError): Promise<void> {
    switch (error.type) {
      case 'NETWORK_ERROR':
        // Queue for offline sync
        await this.queueForOfflineSync(error.changes)
        this.showOfflineNotification()
        break
        
      case 'CONFLICT':
        // Show conflict resolution UI
        const resolution = await this.showConflictDialog(error.conflict)
        if (resolution) {
          await this.applyResolution(resolution)
        }
        break
        
      case 'QUOTA_EXCEEDED':
        // Show upgrade prompt
        this.showQuotaExceededDialog({
          used: error.quotaUsed,
          limit: error.quotaLimit,
        })
        break
        
      case 'VERSION_MISMATCH':
        // Force refresh
        await this.forceSync()
        break
        
      default:
        // Log and show generic error
        console.error('Sync error:', error)
        toast.error('Sync failed. Changes saved locally.')
    }
  }
  
  async recoverFromCorruption(noteId: string): Promise<boolean> {
    try {
      // Try local recovery first
      const localBackup = await this.getLocalBackup(noteId)
      if (localBackup && await this.validateNote(localBackup)) {
        await this.restoreFromBackup(localBackup)
        return true
      }
      
      // Try server recovery
      const serverVersions = await this.getServerVersions(noteId)
      const validVersion = serverVersions.find(v => this.validateNote(v))
      
      if (validVersion) {
        await this.restoreFromVersion(validVersion)
        return true
      }
      
      // Last resort - create new note with recovered content
      const recovered = await this.attemptContentRecovery(noteId)
      if (recovered) {
        await this.createRecoveredNote(recovered)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Recovery failed:', error)
      return false
    }
  }
}
```

### Import/Export Error Recovery

```typescript
class ImportExportErrorHandler {
  async handleImportError(
    error: ImportError,
    context: ImportContext
  ): Promise<ImportRecovery> {
    switch (error.type) {
      case 'INVALID_FORMAT':
        // Try alternative parsers
        const parser = await this.findAlternativeParser(context.file)
        if (parser) {
          return { action: 'retry', parser }
        }
        break
        
      case 'PARTIAL_FAILURE':
        // Show partial import dialog
        const decision = await this.showPartialImportDialog({
          successful: error.successful,
          failed: error.failed,
        })
        
        if (decision === 'continue') {
          return { action: 'partial', items: error.successful }
        }
        break
        
      case 'SIZE_LIMIT':
        // Offer chunked import
        const chunks = await this.splitIntoChunks(context.file)
        return { action: 'chunked', chunks }
        
      case 'ENCODING_ERROR':
        // Try different encodings
        const encoding = await this.detectEncoding(context.file)
        return { action: 'retry', options: { encoding } }
    }
    
    return { action: 'abort' }
  }
  
  async handleExportFailure(
    error: ExportError,
    request: ExportRequest
  ): Promise<void> {
    // Save export request for retry
    await this.saveFailedExport(request, error)
    
    // Notify user with options
    const action = await this.showExportFailureDialog({
      error: error.message,
      options: [
        'Retry with smaller batch',
        'Try different format',
        'Save locally',
        'Cancel',
      ],
    })
    
    switch (action) {
      case 'Retry with smaller batch':
        await this.retryInBatches(request)
        break
      case 'Try different format':
        await this.showFormatSelector(request)
        break
      case 'Save locally':
        await this.saveToIndexedDB(request)
        break
    }
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('SyncEngine', () => {
  let syncEngine: SyncEngine
  let mockSupabase: MockSupabaseClient
  
  beforeEach(() => {
    mockSupabase = createMockSupabase()
    syncEngine = new SyncEngine(mockSupabase)
  })
  
  test('handles concurrent edits correctly', async () => {
    const localChange = {
      id: 'note-1',
      content: 'Local edit',
      timestamp: new Date('2024-01-01T10:00:00'),
    }
    
    const remoteChange = {
      id: 'note-1',
      content: 'Remote edit',
      timestamp: new Date('2024-01-01T10:00:05'),
    }
    
    mockSupabase.simulateRemoteChange(remoteChange)
    const result = await syncEngine.push([localChange])
    
    expect(result[0].conflict).toBeDefined()
    expect(result[0].conflict.type).toBe('concurrent_edit')
  })
  
  test('queues changes when offline', async () => {
    mockSupabase.simulateOffline()
    
    const changes = [
      { id: 'note-1', content: 'Offline edit 1' },
      { id: 'note-2', content: 'Offline edit 2' },
    ]
    
    await syncEngine.push(changes)
    
    const queue = await syncEngine.getOfflineQueue()
    expect(queue).toHaveLength(2)
    
    mockSupabase.simulateOnline()
    await syncEngine.processOfflineQueue()
    
    const finalQueue = await syncEngine.getOfflineQueue()
    expect(finalQueue).toHaveLength(0)
  })
})

describe('VersionManager', () => {
  test('creates versions at appropriate intervals', async () => {
    const manager = new VersionManager()
    const note = { id: 'note-1', content: 'Initial' }
    
    // First edit - should create version
    await manager.trackEdit(note)
    await wait(5000)
    note.content = 'Edit 1'
    await manager.trackEdit(note)
    
    // Quick edit - should not create version
    note.content = 'Edit 2'
    await manager.trackEdit(note)
    
    const versions = await manager.getVersions(note.id)
    expect(versions).toHaveLength(2)
  })
  
  test('prunes old versions according to policy', async () => {
    const manager = new VersionManager()
    const policy = {
      minVersions: 5,
      keepAllDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      keepDailyDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
    
    // Create many versions
    const versions = await createMockVersions(20, { span: 60 })
    await manager.saveVersions(versions)
    
    await manager.pruneVersions('note-1', policy)
    
    const remaining = await manager.getVersions('note-1')
    expect(remaining.length).toBeLessThan(20)
    expect(remaining.length).toBeGreaterThanOrEqual(5)
  })
})
```

### Integration Tests

- Real-time sync works across multiple clients
- Offline changes sync when reconnected
- Version history displays correctly
- Import preserves all content and structure
- Export generates valid files in all formats

### E2E Test Scenarios

1. **Offline Editing Flow**
   - Go offline → Edit notes → Queue shows pending
   - Go online → Changes sync automatically → Conflicts resolved

2. **Version Recovery Flow**
   - Make edits → View history → Compare versions → Restore
   - Confirm restoration → Note updated → New version created

3. **Import/Export Flow**
   - Select export format → Configure options → Download
   - Import file → Preview → Map conflicts → Complete import

### Performance Benchmarks
- Sync latency: <500ms per change ✓
- Version load time: <2s for 100 versions ✓
- Export 1000 notes: <10s ✓
- Import 10MB file: <30s ✓
- Conflict resolution: <1s automatic, <30s manual ✓

## Accessibility & Internationalization

### Accessibility Features
- Sync status announced to screen readers
- Keyboard navigation for version timeline
- High contrast diff viewer
- Focus management in conflict dialogs
- Alternative text for all status icons

### Internationalization Prep
- Date formats respect user locale
- Export filenames localized
- Conflict resolution UI translated
- Error messages in user language
- Import instructions multilingual

## Analytics & Monitoring

### Key Metrics to Track

```typescript
interface DataManagementAnalytics {
  // Sync metrics
  syncSuccessRate: number
  averageSyncLatency: number
  conflictRate: number
  conflictResolutionMethod: Record<string, number>
  offlineEditSessions: number
  
  // Version metrics
  versionsPerNote: number
  versionRestoreFrequency: number
  averageVersionSize: number
  pruningEffectiveness: number
  
  // Import/Export metrics
  importSources: Record<string, number>
  exportFormats: Record<string, number>
  importSuccessRate: number
  exportSize: Percentiles
  
  // Data integrity
  corruptionIncidents: number
  recoverySuccessRate: number
  dataLossIncidents: number
}
```

### Monitoring Dashboards
- Real-time sync status across users
- Version storage usage trends
- Import/export queue status
- Data integrity alerts

## Security & Privacy Considerations

### Data Security
- End-to-end encryption option for sync
- Version history encrypted at rest
- Export encryption with user password
- Secure WebSocket connections
- No third-party access to note content

### Privacy Protection
- Local-first architecture
- Optional cloud sync
- Data residency options
- Complete data deletion
- Audit logs for data access

## Migration & Upgrade Path

### Future Enhancements
- Real-time collaboration on notes
- Blockchain-based version verification
- AI-powered conflict resolution
- Cross-platform native sync
- Distributed backup network

### Compatibility
- Backward compatible sync protocol
- Legacy format importers
- Progressive enhancement for features
- Graceful degradation offline

## Success Metrics

### User Engagement
- 95% successful sync rate
- 80% use version history monthly
- 60% export notes regularly
- 40% import from other tools

### Technical Health
- <500ms sync latency (p95)
- 99.9% data durability
- Zero data loss incidents
- <10s for 1000 note export

### Business Impact
- 50% reduction in data loss anxiety
- 30% increase in power user adoption
- 70% successful migrations from competitors
- 90% user confidence in data safety

## Dependencies

### External Services
- Supabase for real-time sync
- AWS S3 for backup storage
- SendGrid for export emails
- Workers for background jobs

### Internal Dependencies
- Epic 7: Authentication for user data
- Epic 1: Editor for version tracking
- Epic 2: Organization for export structure
- Epic 6: Knowledge graph for relationships

### NPM Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "idb": "^8.x",
    "diff": "^5.x",
    "jszip": "^3.x",
    "pdfmake": "^0.2.x",
    "docx": "^8.x",
    "papaparse": "^5.x"
  }
}
```

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|---------|------------|------------|
| Sync conflicts corrupt data | High | Low | Three-way merge, automatic backups, recovery tools |
| Large exports timeout | Medium | Medium | Background processing, chunked exports, progress saving |
| Offline queue grows too large | Medium | Low | Queue limits, compression, selective sync |
| Version storage explodes | High | Medium | Intelligent pruning, compression, cold storage |
| Import loses fidelity | Medium | High | Preview system, validation, manual mapping |

## Conclusion

Epic 8 transforms AI Notes from a web application into a trustworthy knowledge vault. By implementing robust sync, comprehensive version history, and flexible import/export, users can confidently store their most important information knowing it's safe, synchronized, and portable.

The combination of real-time sync, offline support, and intelligent conflict resolution ensures users never lose work, while the version history and export capabilities provide peace of mind and data ownership. This epic delivers the reliability and trust necessary for AI Notes to become users' primary knowledge management system.

## Next Steps

With Data Management complete, users can:
- Trust their notes sync instantly across all devices
- Work offline with confidence that changes will sync
- Recover any previous version of their notes
- Export their entire knowledge base in multiple formats
- Import from other tools without losing information

The final epic (Monetization & Growth) will build on this foundation to add:
- Subscription tiers with storage limits
- Team collaboration features
- Advanced AI capabilities
- Enterprise-grade security