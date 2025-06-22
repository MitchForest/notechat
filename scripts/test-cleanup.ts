import 'dotenv/config'

// Test script to manually trigger the cleanup endpoint
async function testCleanup() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const cronSecret = process.env.CRON_SECRET || 'test-secret'
  
  console.log('Testing cleanup endpoint...')
  console.log('Base URL:', baseUrl)
  
  try {
    // First check status
    console.log('\n1. Checking cleanup status...')
    const statusResponse = await fetch(`${baseUrl}/api/cleanup?secret=${cronSecret}`)
    
    if (!statusResponse.ok) {
      console.error('Status check failed:', await statusResponse.text())
      return
    }
    
    const status = await statusResponse.json()
    console.log('Cleanup status:', status)
    
    if (!status.nextRunRecommended) {
      console.log('No cleanup needed at this time.')
      return
    }
    
    // Run cleanup
    console.log('\n2. Running cleanup...')
    const cleanupResponse = await fetch(`${baseUrl}/api/cleanup?secret=${cronSecret}`, {
      method: 'POST'
    })
    
    if (!cleanupResponse.ok) {
      console.error('Cleanup failed:', await cleanupResponse.text())
      return
    }
    
    const result = await cleanupResponse.json()
    console.log('Cleanup result:', result)
    console.log(`✓ Soft deleted: ${result.softDeleted} chats`)
    console.log(`✓ Hard deleted: ${result.hardDeleted} chats`)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testCleanup() 