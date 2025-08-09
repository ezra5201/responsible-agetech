'use client'

import { TagHierarchy } from '@/lib/db'
import { X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActiveFiltersBarProps {
  hierarchy: TagHierarchy
  selectedTags: string[]
  onTagToggle: (tagName: string) => void
  onClearAll: () => void
  onOpenFilters: () => void
}

export function ActiveFiltersBar({ 
  hierarchy, 
  selectedTags, 
  onTagToggle, 
  onClearAll,
  onOpenFilters 
}: ActiveFiltersBarProps) {
  if (selectedTags.length === 0) {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 text-gray-500">
          <Filter className="w-4 h-4" />
          <span className="text-sm">No filters applied</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFilters}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filter Resources
        </Button>
      </div>
    )
  }

  // Get tag details for active filters
  const getTagDetails = (tagName: string) => {
    for (const category of Object.values(hierarchy)) {
      for (const subcategory of Object.values(category.subcategories)) {
        const tag = subcategory.tags.find(t => t.name === tagName)
        if (tag) return tag
      }
    }
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">
            {selectedTags.length} filter{selectedTags.length !== 1 ? 's' : ''} active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            Edit Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            Clear All
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tagName) => {
          const tag = getTagDetails(tagName)
          
          return (
            <button
              key={tagName}
              onClick={() => onTagToggle(tagName)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
              style={{ backgroundColor: tag?.color || '#6B7280' }}
            >
              {tagName}
              <X className="w-3 h-3" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
