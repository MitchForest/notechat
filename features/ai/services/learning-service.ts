import { db } from '@/lib/db'
import { aiFeedback } from '@/lib/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

interface LearningInsights {
  acceptanceRate: number
  averageResponseTime: number
  mostSuccessfulOperations: string[]
  mostIgnoredPatterns: string[]
  userPreferences: {
    preferredLength: 'shorter' | 'longer' | 'same'
    preferredStyle: string[]
  }
}

export class LearningService {
  static async getUserInsights(userId: string): Promise<LearningInsights> {
    // Get feedback from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const feedback = await db.query.aiFeedback.findMany({
      where: and(
        eq(aiFeedback.userId, userId),
        gte(aiFeedback.createdAt, thirtyDaysAgo)
      )
    })
    
    // Calculate acceptance rate
    const acceptedCount = feedback.filter(f => f.action === 'accepted').length
    const acceptanceRate = feedback.length > 0 ? acceptedCount / feedback.length : 0
    
    // Calculate average response time
    const responseTimes = feedback
      .map(f => (f.metadata as any)?.duration)
      .filter(Boolean)
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0
    
    // Find most successful operations
    const operationStats = feedback.reduce((acc, f) => {
      if (!acc[f.operation]) acc[f.operation] = { accepted: 0, total: 0 }
      acc[f.operation].total++
      if (f.action === 'accepted') acc[f.operation].accepted++
      return acc
    }, {} as Record<string, { accepted: number; total: number }>)
    
    const mostSuccessfulOperations = Object.entries(operationStats)
      .sort((a, b) => (b[1].accepted / b[1].total) - (a[1].accepted / a[1].total))
      .slice(0, 3)
      .map(([op]) => op)
    
    // Analyze ignored patterns
    const ignoredFeedback = feedback.filter(f => f.action === 'ignored')
    const ignoredPatterns = this.analyzePatterns(ignoredFeedback)
    
    // Determine user preferences
    const userPreferences = this.analyzePreferences(feedback)
    
    return {
      acceptanceRate,
      averageResponseTime,
      mostSuccessfulOperations,
      mostIgnoredPatterns: ignoredPatterns,
      userPreferences
    }
  }
  
  private static analyzePatterns(feedback: any[]): string[] {
    // Simple pattern analysis - in production, use ML
    const patterns: string[] = []
    
    // Check if user ignores long responses
    const longResponses = feedback.filter(f => f.output?.length > 500)
    if (longResponses.length > feedback.length * 0.3) {
      patterns.push('long_responses')
    }
    
    // Check if user ignores certain operations
    const operationCounts = feedback.reduce((acc, f) => {
      acc[f.operation] = (acc[f.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(operationCounts).forEach(([op, count]) => {
      if ((count as number) > feedback.length * 0.2) {
        patterns.push(`operation_${op}`)
      }
    })
    
    return patterns
  }
  
  private static analyzePreferences(feedback: any[]): LearningInsights['userPreferences'] {
    const accepted = feedback.filter(f => f.action === 'accepted')
    
    // Analyze length preference
    let lengthPreference: 'shorter' | 'longer' | 'same' = 'same'
    const lengthChanges = accepted.map(f => {
      const inputLength = f.input?.length || 0
      const outputLength = f.output?.length || 0
      return outputLength - inputLength
    })
    
    const avgLengthChange = lengthChanges.reduce((a, b) => a + b, 0) / lengthChanges.length
    if (avgLengthChange < -50) lengthPreference = 'shorter'
    else if (avgLengthChange > 50) lengthPreference = 'longer'
    
    // Analyze style preferences
    const stylePreferences: string[] = []
    const transformOperations = accepted.filter(f => f.operation === 'transform')
    const operationCounts: Record<string, number> = transformOperations.reduce((acc: Record<string, number>, f) => {
      const prompt = f.prompt || ''
      if (prompt.includes('formal')) acc.formal = (acc.formal || 0) + 1
      if (prompt.includes('casual')) acc.casual = (acc.casual || 0) + 1
      if (prompt.includes('simple')) acc.simple = (acc.simple || 0) + 1
      return acc
    }, {})
    
    Object.entries(operationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .forEach(([style]) => stylePreferences.push(style))
    
    return {
      preferredLength: lengthPreference,
      preferredStyle: stylePreferences
    }
  }
  
  // Get personalized system prompt based on learning
  static async getPersonalizedPrompt(userId: string, basePrompt: string): Promise<string> {
    const insights = await this.getUserInsights(userId)
    
    let personalizedPrompt = basePrompt
    
    // Add length preference
    if (insights.userPreferences.preferredLength === 'shorter') {
      personalizedPrompt += '\n\nUser prefers concise, brief responses.'
    } else if (insights.userPreferences.preferredLength === 'longer') {
      personalizedPrompt += '\n\nUser prefers detailed, comprehensive responses.'
    }
    
    // Add style preferences
    if (insights.userPreferences.preferredStyle.length > 0) {
      personalizedPrompt += `\n\nUser tends to prefer ${insights.userPreferences.preferredStyle.join(' and ')} style.`
    }
    
    // Add acceptance rate hint
    if (insights.acceptanceRate < 0.3) {
      personalizedPrompt += '\n\nBe extra careful with suggestions as user is selective.'
    }
    
    return personalizedPrompt
  }
} 