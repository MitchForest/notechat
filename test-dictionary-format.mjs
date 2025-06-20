// test-dictionary-format.mjs
// Test the dictionary format for retext-spell

import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextSpell from 'retext-spell'
import retextStringify from 'retext-stringify'
import fs from 'fs'
import nspell from 'nspell'

console.log('Testing Dictionary Formats\n' + '='.repeat(50))

// Test 1: Load dictionary with nspell directly
console.log('\nTest 1: Loading with nspell directly')
try {
  const affBuffer = fs.readFileSync('./public/dictionaries/en_US.aff')
  const dicBuffer = fs.readFileSync('./public/dictionaries/en_US.dic')
  
  const spell = nspell({ 
    aff: affBuffer, 
    dic: dicBuffer 
  })
  
  console.log('✓ nspell loaded successfully')
  console.log('  - Checking "hello":', spell.correct('hello'))
  console.log('  - Checking "helllo":', spell.correct('helllo'))
  console.log('  - Suggestions for "helllo":', spell.suggest('helllo'))
} catch (error) {
  console.error('✗ nspell failed:', error.message)
}

// Test 2: Use dictionary object with retext-spell
console.log('\nTest 2: Using dictionary object with retext-spell')
try {
  const affBuffer = fs.readFileSync('./public/dictionaries/en_US.aff')
  const dicBuffer = fs.readFileSync('./public/dictionaries/en_US.dic')
  
  const dictionary = {
    aff: new Uint8Array(affBuffer),
    dic: new Uint8Array(dicBuffer)
  }
  
  const processor = unified()
    .use(retextEnglish)
    .use(retextSpell, { dictionary })
    .use(retextStringify)
  
  const result = await processor.process('hello helllo')
  console.log('✓ Processed successfully')
  console.log('  - Messages:', result.messages.length)
  result.messages.forEach(msg => {
    console.log(`  - ${msg.reason} at ${msg.place?.start?.offset}-${msg.place?.end?.offset}`)
  })
} catch (error) {
  console.error('✗ Failed:', error.message)
  console.error('Stack:', error.stack)
}

// Test 3: Check what retext-spell is actually doing
console.log('\nTest 3: Debug retext-spell behavior')
try {
  const affBuffer = fs.readFileSync('./public/dictionaries/en_US.aff')
  const dicBuffer = fs.readFileSync('./public/dictionaries/en_US.dic')
  
  // Log buffer info
  console.log('Buffer info:')
  console.log('  - aff is Buffer:', Buffer.isBuffer(affBuffer))
  console.log('  - dic is Buffer:', Buffer.isBuffer(dicBuffer))
  console.log('  - aff length:', affBuffer.length)
  console.log('  - dic length:', dicBuffer.length)
  
  // Try with raw buffers
  const processor = unified()
    .use(retextEnglish)
    .use(retextSpell, { 
      dictionary: { 
        aff: affBuffer, 
        dic: dicBuffer 
      } 
    })
    .use(retextStringify)
  
  const result = await processor.process('hello helllo')
  console.log('✓ Processed successfully with raw buffers')
  console.log('  - Messages:', result.messages.length)
  result.messages.forEach(msg => {
    console.log(`  - ${msg.reason} at ${msg.place?.start?.offset}-${msg.place?.end?.offset}`)
  })
} catch (error) {
  console.error('✗ Failed:', error.message)
} 