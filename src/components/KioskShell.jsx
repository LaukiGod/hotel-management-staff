import { motion } from 'framer-motion'

export default function KioskShell({ children, className = '' }) {
  return (
    <motion.div
      className={`min-h-screen w-full bg-gray-50 text-gray-900 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

