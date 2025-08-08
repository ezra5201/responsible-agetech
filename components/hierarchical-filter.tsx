'use client'

import { useState } from 'react'
import { Tag } from '@/lib/db'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CategorizedTags {
  [categoryName: string]: {
    id: number
    name: string
    color: string
    category_level: number
    children: Tag[]
  }
}

interface HierarchicalFilterProps {
  categorizedTags: CategorizedTags
  selectedTags: string[]
  onTagToggle: (tagName: string) => void
  onClearAll: () => void
}

export function HierarchicalFilter({ 
  categorizedTags, 
  selectedTags, 
  onTagToggle, 
  onClearAll 
}: HierarchicalFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const getCategorySelectedCount = (category: any) => {
    return category.children.filter((tag: Tag) => selectedTags.includes(tag.name)).length
  }

  const hasAnyFilters = selectedTags.length > 0

  return (
    <div className="space-y-4">
      {/* Active Filters Summary */}
      {hasAnyFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-blue-900">Active Filters ({selectedTags.length})</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tagName) => {
              // Find the tag to get its color
              const tag = Object.values(categorizedTags)
                .flatMap(cat => cat.children)
                .find(t => t.name === tagName)
              
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
      )}

      {/* Category Filters */}
      <div className="space-y-2">
        {Object.entries(categorizedTags).map(([categoryName, category]) => {
          const isExpanded = expandedCategories.has(categoryName)
          const selectedCount = getCategorySelectedCount(category)
          
          return (
            <div key={categoryName} className="border border-gray-200 rounded-lg bg-white">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(categoryName)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-gray-900">{categoryName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedCount}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{category.children.length}</span>
                </div>
              </button>

              {/* Category Tags */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {category.children.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name)
                      
                      return (
                        <button
                          key={tag.id}
                          onClick={() => onTagToggle(tag.name)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'text-white shadow-sm'
                              : 'hover:opacity-80 border'
                          }`}
                          style={{
                            backgroundColor: isSelected 
                              ? tag.color 
                              : `${tag.color}10`,
                            color: isSelected 
                              ? 'white' 
                              : tag.color,
                            borderColor: isSelected 
                              ? tag.color 
                              : `${tag.color}40`
                          }}
                        >
                          {tag.name}
                          {tag.category_level > 2 && (
                            <span className="ml-1 opacity-75 text-xs">
                              (L{tag.category_level})
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  
                  {category.children.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No tags in this category yet.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
