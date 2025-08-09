'use client'

import { useState } from 'react'
import { Tag } from '@/lib/db'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TagHierarchy {
  [categoryName: string]: {
    id: number
    name: string
    color: string
    category_level: number
    subcategories: {
      [subcategoryName: string]: {
        id: number
        name: string
        color: string
        category_level: number
        tags: Tag[]
      }
    }
  }
}

interface ThreeLevelFilterProps {
  hierarchy: TagHierarchy
  selectedTags: string[]
  onTagToggle: (tagName: string) => void
  onClearAll: () => void
}

export function ThreeLevelFilter({ 
  hierarchy, 
  selectedTags, 
  onTagToggle, 
  onClearAll 
}: ThreeLevelFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleSubcategory = (subcategoryKey: string) => {
    const newExpanded = new Set(expandedSubcategories)
    if (newExpanded.has(subcategoryKey)) {
      newExpanded.delete(subcategoryKey)
    } else {
      newExpanded.add(subcategoryKey)
    }
    setExpandedSubcategories(newExpanded)
  }

  const getCategorySelectedCount = (category: any) => {
    let count = 0
    Object.values(category.subcategories).forEach((subcategory: any) => {
      count += subcategory.tags.filter((tag: Tag) => selectedTags.includes(tag.name)).length
    })
    return count
  }

  const getSubcategorySelectedCount = (subcategory: any) => {
    return subcategory.tags.filter((tag: Tag) => selectedTags.includes(tag.name)).length
  }

  const hasAnyFilters = selectedTags.length > 0

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
      )}

      {/* Category Filters */}
      <div className="space-y-3">
        {Object.entries(hierarchy).map(([categoryName, category]) => {
          const isCategoryExpanded = expandedCategories.has(categoryName)
          const categorySelectedCount = getCategorySelectedCount(category)
          
          return (
            <div key={categoryName} className="border border-gray-200 rounded-lg bg-white">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(categoryName)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isCategoryExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-semibold text-gray-900">{categoryName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {categorySelectedCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {categorySelectedCount}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {Object.keys(category.subcategories).length} subcategories
                  </span>
                </div>
              </button>

              {/* Subcategories */}
              {isCategoryExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {Object.entries(category.subcategories).map(([subcategoryName, subcategory]) => {
                    const subcategoryKey = `${categoryName}-${subcategoryName}`
                    const isSubcategoryExpanded = expandedSubcategories.has(subcategoryKey)
                    const subcategorySelectedCount = getSubcategorySelectedCount(subcategory)
                    
                    return (
                      <div key={subcategoryKey} className="border-b border-gray-100 last:border-b-0">
                        {/* Subcategory Header */}
                        <button
                          type="button"
                          onClick={() => toggleSubcategory(subcategoryKey)}
                          className="w-full flex items-center justify-between p-3 pl-8 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isSubcategoryExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: subcategory.color }}
                            />
                            <span className="font-medium text-gray-800">{subcategoryName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {subcategorySelectedCount > 0 && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                {subcategorySelectedCount}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{subcategory.tags.length}</span>
                          </div>
                        </button>

                        {/* Tags */}
                        {isSubcategoryExpanded && (
                          <div className="p-3 pl-12 bg-white border-t border-gray-100">
                            {subcategory.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {subcategory.tags.map((tag) => {
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
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">No tags in this subcategory yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
