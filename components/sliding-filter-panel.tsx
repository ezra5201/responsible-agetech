'use client'

import { useState, useEffect } from 'react'
import { TagHierarchy } from '@/lib/db'
import { X, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SlidingFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  hierarchy: TagHierarchy
  selectedTags: string[]
  onTagToggle: (tagName: string) => void
  onClearAll: () => void
}

export function SlidingFilterPanel({ 
  isOpen, 
  onClose, 
  hierarchy, 
  selectedTags, 
  onTagToggle, 
  onClearAll 
}: SlidingFilterPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())

  // Auto-expand categories that have selected tags
  useEffect(() => {
    if (selectedTags.length > 0) {
      const categoriesToExpand = new Set<string>()
      const subcategoriesToExpand = new Set<string>()
      
      Object.entries(hierarchy).forEach(([categoryName, category]) => {
        Object.entries(category.subcategories).forEach(([subcategoryName, subcategory]) => {
          const hasSelectedTags = subcategory.tags.some(tag => selectedTags.includes(tag.name))
          if (hasSelectedTags) {
            categoriesToExpand.add(categoryName)
            subcategoriesToExpand.add(`${categoryName}-${subcategoryName}`)
          }
        })
      })
      
      setExpandedCategories(categoriesToExpand)
      setExpandedSubcategories(subcategoriesToExpand)
    }
  }, [selectedTags, hierarchy])

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
      // Also collapse all subcategories in this category
      Object.keys(hierarchy[categoryName]?.subcategories || {}).forEach(subName => {
        const subKey = `${categoryName}-${subName}`
        setExpandedSubcategories(prev => {
          const newSub = new Set(prev)
          newSub.delete(subKey)
          return newSub
        })
      })
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

  const getSubcategorySelectedCount = (subcategory: any) => {
    return subcategory.tags.filter((tag: any) => selectedTags.includes(tag.name)).length
  }

  const getCategorySelectedCount = (category: any) => {
    let count = 0
    Object.values(category.subcategories).forEach((subcategory: any) => {
      count += subcategory.tags.filter((tag: any) => selectedTags.includes(tag.name)).length
    })
    return count
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sliding Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:max-w-sm
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Resources</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Active Filters Summary */}
        {selectedTags.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedTags.length} filter{selectedTags.length !== 1 ? 's' : ''} active
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="text-blue-700 border-blue-300 hover:bg-blue-100 h-7 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedTags.slice(0, 3).map((tagName) => {
                const tag = Object.values(hierarchy)
                  .flatMap(cat => Object.values(cat.subcategories))
                  .flatMap(sub => sub.tags)
                  .find(t => t.name === tagName)
                
                return (
                  <button
                    key={tagName}
                    onClick={() => onTagToggle(tagName)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: tag?.color || '#6B7280' }}
                  >
                    {tagName}
                    <X className="w-3 h-3" />
                  </button>
                )
              })}
              {selectedTags.length > 3 && (
                <span className="text-xs text-blue-600 px-2 py-1">
                  +{selectedTags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-4">
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
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isCategoryExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-gray-900 text-sm">{categoryName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {categorySelectedCount > 0 && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {categorySelectedCount}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {Object.keys(category.subcategories).length}
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
                              className="w-full flex items-center justify-between p-2 pl-6 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {isSubcategoryExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-gray-500" />
                                )}
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: subcategory.color || category.color }}
                                />
                                <span className="font-medium text-gray-700 text-sm">{subcategoryName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {subcategorySelectedCount > 0 && (
                                  <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                    {subcategorySelectedCount}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">{subcategory.tags.length}</span>
                              </div>
                            </button>

                            {/* Tags */}
                            {isSubcategoryExpanded && (
                              <div className="p-2 pl-8 bg-white border-t border-gray-100">
                                {subcategory.tags.length > 0 ? (
                                  <div className="space-y-1">
                                    {subcategory.tags.map((tag) => {
                                      const isSelected = selectedTags.includes(tag.name)
                                      
                                      return (
                                        <button
                                          key={tag.id}
                                          onClick={() => onTagToggle(tag.name)}
                                          className={`w-full text-left px-2 py-1 rounded text-sm transition-all ${
                                            isSelected
                                              ? 'text-white font-medium'
                                              : 'hover:bg-gray-100 text-gray-700'
                                          }`}
                                          style={{
                                            backgroundColor: isSelected 
                                              ? tag.color || subcategory.color || category.color
                                              : 'transparent'
                                          }}
                                        >
                                          {tag.name}
                                        </button>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">No tags yet.</p>
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={onClose}
            className="w-full"
            variant="outline"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  )
}
