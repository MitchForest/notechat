'use client'

import { motion, MotionProps } from 'framer-motion'
import { useEffect, useState } from 'react'

interface MotionWrapperProps extends Omit<MotionProps, 'children'> {
  children: React.ReactNode
  reduceMotion?: boolean
  className?: string
  style?: React.CSSProperties
}

export function MotionWrapper({ 
  children, 
  initial, 
  animate, 
  exit, 
  transition,
  whileHover,
  whileInView,
  whileTap,
  viewport,
  variants,
  reduceMotion = true,
  className,
  style,
  ...props 
}: MotionWrapperProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  if (prefersReducedMotion && reduceMotion) {
    return <div className={className} style={style as React.CSSProperties}>{children}</div>
  }

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      whileHover={whileHover}
      whileInView={whileInView}
      whileTap={whileTap}
      viewport={viewport}
      variants={variants}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  )
} 