// Easily customizable style configuration
export const resourceStyles = {
  // Card styles
  card: {
    background: 'bg-white',
    border: 'border border-gray-200',
    borderRadius: 'rounded-lg',
    shadow: 'shadow-sm hover:shadow-md',
    padding: 'p-6',
    transition: 'transition-all duration-200',
    hover: 'hover:border-blue-300'
  },
  
  // Typography
  title: {
    size: 'text-lg',
    weight: 'font-semibold',
    color: 'text-gray-900',
    marginBottom: 'mb-2'
  },
  
  description: {
    size: 'text-sm',
    color: 'text-gray-600',
    marginBottom: 'mb-4',
    lineHeight: 'leading-relaxed'
  },
  
  metadata: {
    size: 'text-xs',
    color: 'text-gray-500',
    marginBottom: 'mb-3'
  },
  
  // Buttons
  primaryButton: {
    background: 'bg-blue-600 hover:bg-blue-700',
    text: 'text-white',
    padding: 'px-4 py-2',
    borderRadius: 'rounded-md',
    size: 'text-sm',
    weight: 'font-medium',
    transition: 'transition-colors'
  },
  
  secondaryButton: {
    background: 'bg-gray-100 hover:bg-gray-200',
    text: 'text-gray-700',
    padding: 'px-4 py-2',
    borderRadius: 'rounded-md',
    size: 'text-sm',
    weight: 'font-medium',
    transition: 'transition-colors'
  },
  
  // Tags
  tag: {
    padding: 'px-2 py-1',
    borderRadius: 'rounded-full',
    size: 'text-xs',
    weight: 'font-medium',
    margin: 'mr-2 mb-2'
  },
  
  // Layout
  grid: {
    container: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    spacing: 'space-y-6'
  },
  
  // Colors (easily customizable)
  colors: {
    primary: 'blue',
    secondary: 'gray',
    success: 'green',
    warning: 'yellow',
    danger: 'red'
  }
}

// Helper function to combine style classes
export const combineStyles = (...styles: string[]) => styles.join(' ')
