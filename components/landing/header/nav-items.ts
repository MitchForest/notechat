export interface NavItem {
  label: string
  href: string
  isSection?: boolean // For smooth scroll vs page navigation
}

export const navItems: NavItem[] = [
  {
    label: 'Features',
    href: '#features',
    isSection: true,
  },
  {
    label: 'How it Works',
    href: '#how-it-works',
    isSection: true,
  },
  {
    label: 'Pricing',
    href: '#pricing',
    isSection: true,
  },
  {
    label: 'FAQ',
    href: '#faq',
    isSection: true,
  },
] 