#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories to exclude
const excludeDirs = ['node_modules', '.next', 'dist', 'build', '.git'];

// Track all types/interfaces and their usage
const definedTypes = new Map(); // type name -> file where defined
const usedTypes = new Set();

// Helper to check if path should be excluded
function shouldExclude(filePath) {
  return excludeDirs.some(dir => filePath.includes(`/${dir}/`));
}

// Get all TypeScript files
function getTsFiles(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      if (shouldExclude(fullPath)) continue;
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getTsFiles(fullPath));
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

// Extract type definitions from a file
function extractTypeDefinitions(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const types = [];
    
    // Match type aliases, interfaces, and exported types
    const typeRegex = /(?:export\s+)?(?:type|interface)\s+(\w+)/g;
    
    let match;
    while ((match = typeRegex.exec(content)) !== null) {
      const typeName = match[1];
      if (!definedTypes.has(typeName)) {
        definedTypes.set(typeName, []);
      }
      definedTypes.get(typeName).push(filePath);
      types.push(typeName);
    }
    
    return types;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Find type usage in a file
function findTypeUsage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for type usage patterns
    definedTypes.forEach((files, typeName) => {
      // Various patterns where types are used
      const patterns = [
        new RegExp(`:\\s*${typeName}(?:\\s*[<\\[\\{]|\\s*(?:&|\\|)|\\s*;|\\s*=|\\s*,|\\s*\\)|\\s*$)`, 'g'),
        new RegExp(`<${typeName}(?:\\s*[,>])`, 'g'),
        new RegExp(`extends\\s+${typeName}`, 'g'),
        new RegExp(`implements\\s+${typeName}`, 'g'),
        new RegExp(`\\b${typeName}\\s*\\[`, 'g'),
        new RegExp(`as\\s+${typeName}`, 'g'),
        new RegExp(`satisfies\\s+${typeName}`, 'g'),
        new RegExp(`typeof\\s+${typeName}`, 'g'),
        new RegExp(`keyof\\s+${typeName}`, 'g'),
        new RegExp(`Parameters<${typeName}>`, 'g'),
        new RegExp(`ReturnType<${typeName}>`, 'g'),
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          usedTypes.add(typeName);
          break;
        }
      }
    });
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error.message);
  }
}

// Main analysis
const projectRoot = '/Users/mitchellwhite/Code/notechat';

console.log('🔍 Analyzing types and interfaces...\n');

// Get all TypeScript files
const tsFiles = getTsFiles(projectRoot);

// Extract all type definitions
console.log('📝 Extracting type definitions...');
tsFiles.forEach(file => {
  extractTypeDefinitions(file);
});

console.log(`Found ${definedTypes.size} unique type/interface names\n`);

// Find type usage
console.log('🔎 Finding type usage...');
tsFiles.forEach(file => {
  findTypeUsage(file);
});

// Find unused types
const unusedTypes = [];
definedTypes.forEach((files, typeName) => {
  if (!usedTypes.has(typeName)) {
    // Skip some common patterns that might be entry points
    if (!typeName.includes('Props') && !typeName.includes('Config') && 
        !typeName.includes('Options') && !typeName.includes('Context')) {
      unusedTypes.push({ name: typeName, files });
    }
  }
});

// Report findings
console.log('\n📊 UNUSED TYPE DEFINITIONS:');
console.log('=' .repeat(60));

if (unusedTypes.length === 0) {
  console.log('✅ All type definitions are being used!');
} else {
  unusedTypes.sort((a, b) => a.name.localeCompare(b.name)).forEach(({ name, files }) => {
    console.log(`\n❌ Type: ${name}`);
    files.forEach(file => {
      console.log(`   Defined in: ${path.relative(projectRoot, file)}`);
    });
  });
  console.log(`\nTotal: ${unusedTypes.length} unused type definitions`);
}

// Find duplicate type definitions
console.log('\n\n🔄 DUPLICATE TYPE DEFINITIONS:');
console.log('=' .repeat(60));

const duplicates = [];
definedTypes.forEach((files, typeName) => {
  if (files.length > 1) {
    duplicates.push({ name: typeName, files });
  }
});

if (duplicates.length === 0) {
  console.log('✅ No duplicate type definitions found!');
} else {
  duplicates.forEach(({ name, files }) => {
    console.log(`\n⚠️  Type: ${name} (defined in ${files.length} files)`);
    files.forEach(file => {
      console.log(`   - ${path.relative(projectRoot, file)}`);
    });
  });
  console.log(`\nTotal: ${duplicates.length} duplicate type names`);
}

// Summary
console.log('\n\n📈 SUMMARY:');
console.log('=' .repeat(60));
console.log(`Total TypeScript files analyzed: ${tsFiles.length}`);
console.log(`Total type/interface definitions: ${definedTypes.size}`);
console.log(`Used types: ${usedTypes.size}`);
console.log(`Unused types: ${unusedTypes.length}`);
console.log(`Duplicate type names: ${duplicates.length}`);