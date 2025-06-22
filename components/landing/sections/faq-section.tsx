'use client'

import { motion } from 'framer-motion'
import { SectionWrapper } from '@/components/landing/shared/section-wrapper'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FAQItem {
  question: string
  answer: string
  category?: string
}

const faqItems: FAQItem[] = [
  {
    question: "How does the block editor work?",
    answer: "Our block editor works just like Notion - each paragraph, heading, or element is a block that you can drag and drop to reorganize. Use '/' to access commands for formatting, or simply start typing. It's intuitive and powerful.",
    category: "Editor"
  },
  {
    question: "How do AI completions learn my writing style?",
    answer: "Our AI observes which suggestions you accept or reject, learning your vocabulary, tone, and writing patterns over time. The more you use it, the better it becomes at predicting what you want to write. Your data is never shared with other users.",
    category: "AI Features"
  },
  {
    question: "Can I customize AI commands for my needs?",
    answer: "Yes! When you highlight text, you can create custom AI commands like 'Rewrite for 8th grade reading level' or 'Make this more technical.' Save your favorite transformations as presets for one-click access.",
    category: "AI Features"
  },
  {
    question: "How sophisticated is the grammar checking?",
    answer: "Our grammar checker goes beyond basic spelling and punctuation. It catches contextual errors, suggests style improvements, checks for clarity and conciseness, and can even adapt to different writing styles (academic, business, creative).",
    category: "Grammar & Style"
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. Your notes are encrypted both in transit and at rest. We never train our AI models on your personal data, and you maintain full ownership of all your content. You can export or delete your data at any time.",
    category: "Privacy & Security"
  },
  {
    question: "What happens to my AI personalization if I cancel?",
    answer: "Your AI personalization data is yours. If you downgrade to Free, you'll keep your learned preferences but with limited daily AI requests. If you cancel entirely, you can export your data including AI preferences.",
    category: "Account"
  },
  {
    question: "Can I use keyboard shortcuts with the block editor?",
    answer: "Yes! All the shortcuts you'd expect work perfectly. Cmd/Ctrl+B for bold, / for commands, Tab to indent blocks, and many more. We also support custom keyboard shortcuts for power users.",
    category: "Editor"
  },
  {
    question: "How do spaces and collections work?",
    answer: "Think of spaces as different notebooks for major areas of your life (Work, Personal, Research). Collections are folders within spaces. Everything is drag-and-drop, so you can reorganize anytime.",
    category: "Organization"
  },
  {
    question: "What makes this different from Notion + ChatGPT?",
    answer: "Deep integration. Your AI understands your entire knowledge base, learns your writing style, and works seamlessly within your editor. No copy-pasting between apps - it's all in one intelligent workspace.",
    category: "General"
  }
]

export function FAQSection() {
  return (
    <SectionWrapper id="faq">
      <div className="space-y-12">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Frequently asked questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about NoteChat&apos;s features and capabilities
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <AccordionItem 
                  value={`item-${index}`} 
                  className="border rounded-lg px-6 hover:border-muted-foreground/20 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="text-left">
                      <div className="font-semibold">{item.question}</div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </SectionWrapper>
  )
} 