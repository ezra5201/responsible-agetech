'use client'

import { useState } from 'react'
import { Tag } from '@/lib/db'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

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

interface ThreeLevelTagSelectorProps {
  hierarchy: TagHierarchy
  selectedTags?: number[]
  onTagChange?: (tagId: number, checked: boolean) => void
  defaultValues?: number[]
}

export function ThreeLevelTagSelector({ 
  hierarchy, 
  selectedTags = [], 
  onTagChange,
  defaultValues = []
}: ThreeLevelTagSelectorProps) {
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

  const isTagSelected = (tagId: number) => {
    return selectedTags.includes(tagId) || defaultValues.includes(tagId)
  }

  const getCategoryStats = (category: any) => {
    let totalTags = 0
    let selectedCount = 0
    
    Object.values(category.subcategories).forEach((subcategory: any) => {
      totalTags += subcategory.tags.length
      selectedCount += subcategory.tags.filter((tag: Tag) => isTagSelected(tag.id)).length
    })
    
    return { total: totalTags, selected: selectedCount }
  }

  const getSubcategoryStats = (subcategory: any) => {
    const totalTags = subcategory.tags.length
    const selectedCount = subcategory.tags.filter((tag: Tag) => isTagSelected(tag.id)).length
    return { total: totalTags, selected: selectedCount }
  }

  return (
    <div className="space-y-3">
      {Object.entries(hierarchy).map(([categoryName, category]) => {
        const isCategoryExpanded = expandedCategories.has(categoryName)
        const categoryStats = getCategoryStats(category)
        
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
                <span className="font-semibold text-gray-900 text-lg">{categoryName}</span>
              </div>
              <div className="flex items-center gap-2">
                {categoryStats.selected > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {categoryStats.selected} selected
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
                  const subcategoryStats = getSubcategoryStats(subcategory)
                  
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
                          {subcategoryStats.selected > 0 && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              {subcategoryStats.selected}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{subcategoryStats.total} tags</span>
                        </div>
                      </button>

                      {/* Tags */}
                      {isSubcategoryExpanded && (
                        <div className="p-3 pl-12 bg-white border-t border-gray-100">
                          {subcategory.tags.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {subcategory.tags.map((tag) => (
                                <div key={tag.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`tag-${tag.id}`}
                                    name="tags"
                                    value={tag.id}
                                    checked={isTagSelected(tag.id)}
                                    onCheckedChange={(checked) => {
                                      onTagChange?.(tag.id, checked as boolean)
                                    }}
                                  />
                                  <Label
                                    htmlFor={`tag-${tag.id}`}
                                    className="text-sm cursor-pointer flex items-center gap-2"
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: tag.color }}
                                    />
                                    {tag.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No tags in this subcategory yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {Object.keys(category.subcategories).length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 italic">No subcategories in this category yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
