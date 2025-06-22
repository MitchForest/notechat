#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories to exclude
const excludeDirs = ['node_modules', '.next', 'dist', 'build', '.git'];

// File extensions to check
const jsExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const cssExtensions = ['.css', '.scss', '.sass'];

// Track all files and their imports
const allFiles = new Set();
const importedFiles = new Set();
const fileImports = new Map(); // file -> imports it contains

// Helper to check if path should be excluded
function shouldExclude(filePath) {
  return excludeDirs.some(dir => filePath.includes(`/${dir}/`));
}

// Recursively get all files
function getAllFiles(dir, extensions) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      if (shouldExclude(fullPath)) continue;
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

// Extract imports from a file
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Match various import patterns
    const importRegex = /(?:import|require)\s*\(?['"`]([^'"`]+)['"`]\)?/g;
    const fromRegex = /from\s+['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = fromRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Also check for dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Resolve import path to actual file
function resolveImportPath(importPath, fromFile) {
  const fromDir = path.dirname(fromFile);
  
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const resolved = path.resolve(fromDir, importPath);
    
    // Try with different extensions
    for (const ext of jsExtensions) {
      if (fs.existsSync(resolved + ext)) {
        return resolved + ext;
      }
      if (fs.existsSync(path.join(resolved, 'index' + ext))) {
        return path.join(resolved, 'index' + ext);
      }
    }
    
    // Check if it's a CSS file
    for (const ext of cssExtensions) {
      if (fs.existsSync(resolved + ext)) {
        return resolved + ext;
      }
    }
    
    // If file exists as-is
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }
  
  // Handle absolute imports (from project root)
  if (importPath.startsWith('@/')) {
    const resolved = path.join(projectRoot, importPath.substring(2));
    
    for (const ext of jsExtensions) {
      if (fs.existsSync(resolved + ext)) {
        return resolved + ext;
      }
      if (fs.existsSync(path.join(resolved, 'index' + ext))) {
        return path.join(resolved, 'index' + ext);
      }
    }
  }
  
  return null;
}

// Main analysis
const projectRoot = '/Users/mitchellwhite/Code/notechat';

console.log('🔍 Analyzing codebase for orphaned files...\n');

// Get all JS/TS files
const jsFiles = getAllFiles(projectRoot, jsExtensions);
jsFiles.forEach(file => allFiles.add(file));

// Get all CSS files
const cssFiles = getAllFiles(projectRoot, cssExtensions);
cssFiles.forEach(file => allFiles.add(file));

// Analyze imports in all JS/TS files
jsFiles.forEach(file => {
  const imports = extractImports(file);
  fileImports.set(file, imports);
  
  imports.forEach(importPath => {
    const resolved = resolveImportPath(importPath, file);
    if (resolved) {
      importedFiles.add(resolved);
    }
  });
});

// Find orphaned files
const orphanedFiles = [];
allFiles.forEach(file => {
  if (!importedFiles.has(file)) {
    // Special cases to exclude
    const fileName = path.basename(file);
    const isEntryPoint = fileName === 'page.tsx' || fileName === 'layout.tsx' || 
                        fileName === 'route.ts' || fileName === 'route.tsx' ||
                        fileName === 'middleware.ts' || fileName === '_app.tsx' ||
                        fileName === '_document.tsx' || fileName === 'globals.css';
    const isConfig = fileName.includes('config') || fileName === 'next.config.ts' ||
                    fileName === 'tsconfig.json' || fileName === 'postcss.config.mjs' ||
                    fileName === 'tailwind.config.js' || fileName === 'drizzle.config.ts';
    const isTest = file.includes('/tests/') || file.includes('.test.') || file.includes('.spec.');
    const isWorker = fileName.includes('.worker.');
    const isScript = file.includes('/scripts/');
    
    if (!isEntryPoint && !isConfig && !isTest && !isWorker && !isScript) {
      orphanedFiles.push(file);
    }
  }
});

// Report findings
console.log('📁 ORPHANED FILES (not imported anywhere):');
console.log('=' .repeat(60));

if (orphanedFiles.length === 0) {
  console.log('✅ No orphaned files found!');
} else {
  orphanedFiles.sort().forEach(file => {
    const relativePath = path.relative(projectRoot, file);
    console.log(`❌ ${relativePath}`);
  });
  console.log(`\nTotal: ${orphanedFiles.length} orphaned files`);
}

// Find unused imports
console.log('\n\n📦 FILES WITH UNUSED IMPORTS:');
console.log('=' .repeat(60));

let filesWithUnusedImports = 0;

jsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const unusedImports = [];
    
    // Check for unused imports (simplified check)
    const importStatements = content.match(/import\s+(?:{[^}]+}|[^;]+)\s+from\s+['"][^'"]+['"]/g) || [];
    
    importStatements.forEach(statement => {
      // Extract imported names
      const match = statement.match(/import\s+(?:{([^}]+)}|(\w+))/);
      if (match) {
        const imports = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]];
        
        imports.forEach(imp => {
          const name = imp.split(' as ')[0].trim();
          // Check if the import is used in the file (excluding the import statement itself)
          const regex = new RegExp(`\\b${name}\\b`, 'g');
          const uses = (content.match(regex) || []).length;
          if (uses <= 1) { // Only appears in import statement
            unusedImports.push(name);
          }
        });
      }
    });
    
    if (unusedImports.length > 0) {
      console.log(`\n${path.relative(projectRoot, file)}:`);
      unusedImports.forEach(imp => console.log(`  - ${imp}`));
      filesWithUnusedImports++;
    }
  } catch (error) {
    console.error(`Error analyzing ${file}:`, error.message);
  }
});

if (filesWithUnusedImports === 0) {
  console.log('✅ No files with unused imports found!');
} else {
  console.log(`\nTotal: ${filesWithUnusedImports} files with unused imports`);
}

// Check for test files without source
console.log('\n\n🧪 TEST FILES WITHOUT CORRESPONDING SOURCE:');
console.log('=' .repeat(60));

const testFiles = Array.from(allFiles).filter(file => 
  file.includes('.test.') || file.includes('.spec.') || file.includes('/tests/')
);

const orphanedTests = [];
testFiles.forEach(testFile => {
  // Try to find corresponding source file
  const testName = path.basename(testFile);
  const sourceName = testName
    .replace('.test.', '.')
    .replace('.spec.', '.')
    .replace(/\.(ts|tsx|js|jsx)$/, '');
  
  let hasSource = false;
  allFiles.forEach(file => {
    if (!file.includes('.test.') && !file.includes('.spec.') && 
        path.basename(file).startsWith(sourceName)) {
      hasSource = true;
    }
  });
  
  if (!hasSource) {
    orphanedTests.push(testFile);
  }
});

if (orphanedTests.length === 0) {
  console.log('✅ All test files have corresponding source files!');
} else {
  orphanedTests.forEach(file => {
    console.log(`❌ ${path.relative(projectRoot, file)}`);
  });
  console.log(`\nTotal: ${orphanedTests.length} orphaned test files`);
}

// Check CSS files
console.log('\n\n🎨 ORPHANED CSS FILES:');
console.log('=' .repeat(60));

const orphanedCss = cssFiles.filter(file => !importedFiles.has(file) && !path.basename(file).includes('globals'));

if (orphanedCss.length === 0) {
  console.log('✅ All CSS files are imported!');
} else {
  orphanedCss.forEach(file => {
    console.log(`❌ ${path.relative(projectRoot, file)}`);
  });
  console.log(`\nTotal: ${orphanedCss.length} orphaned CSS files`);
}

// Summary
console.log('\n\n📊 SUMMARY:');
console.log('=' .repeat(60));
console.log(`Total files analyzed: ${allFiles.size}`);
console.log(`Orphaned JS/TS files: ${orphanedFiles.filter(f => jsExtensions.some(ext => f.endsWith(ext))).length}`);
console.log(`Orphaned CSS files: ${orphanedCss.length}`);
console.log(`Files with unused imports: ${filesWithUnusedImports}`);
console.log(`Orphaned test files: ${orphanedTests.length}`);