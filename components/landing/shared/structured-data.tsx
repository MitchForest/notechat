export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'NoteChat.AI',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web',
    description: 'AI-powered note-taking app with intelligent writing assistance and knowledge management',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: 'Free Plan',
        description: 'Basic features with 10 AI requests per day'
      },
      {
        '@type': 'Offer',
        price: '10',
        priceCurrency: 'USD',
        name: 'Pro Plan',
        description: 'Unlimited AI features and advanced capabilities',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '10',
          priceCurrency: 'USD',
          unitText: 'MONTH',
        },
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2000',
      bestRating: '5',
      worstRating: '1'
    },
    featureList: [
      'Notion-style block editor',
      'AI-powered chat',
      'Adaptive ghost completions',
      'Custom AI commands',
      'Advanced grammar checking',
      'Drag-and-drop organization',
      'Export to Markdown',
      'API access'
    ],
    screenshot: 'https://notechat.ai/screenshot.png',
    softwareVersion: '1.0',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
} 