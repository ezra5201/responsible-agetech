'use client'

import { useState } from 'react'
import { Tag } from '@/lib/db'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface CategorizedTags {
  [categoryName: string]: {
    id: number
    name: string
    color: string
    category_level: number
    children: Tag[]
  }
}

interface HierarchicalTagSelectorProps {
  categorizedTags: CategorizedTags
  selectedTags?: number[]
  onTagChange?: (tagId: number, checked: boolean) => void
  defaultValues?: number[]
}

export function HierarchicalTagSelector({ 
  categorizedTags, 
  selectedTags = [], 
  onTagChange,
  defaultValues = []
}: HierarchicalTagSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(categorizedTags))
  )

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const isTagSelected = (tagId: number) => {
    return selectedTags.includes(tagId) || defaultValues.includes(tagId)
  }

  const getCategoryStats = (category: any) => {
    const totalTags = category.children.length
    const selectedCount = category.children.filter((tag: Tag) => isTagSelected(tag.id)).length
    return { total: totalTags, selected: selectedCount }
  }

  return (
    <div className="space-y-2">
      {Object.entries(categorizedTags).map(([categoryName, category]) => {
        const isExpanded = expandedCategories.has(categoryName)
        const stats = getCategoryStats(category)
        
        return (
          <div key={categoryName} className="border border-gray-200 rounded-lg">
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
              <div className="text-sm text-gray-500">
                {stats.selected > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                    {stats.selected} selected
                  </span>
                )}
                <span>{stats.total} tags</span>
              </div>
            </button>

            {/* Category Content */}
            {isExpanded && (
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {category.children.map((tag) => (
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
                        {tag.category_level > 2 && (
                          <span className="text-xs text-gray-400">
                            (L{tag.category_level})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
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
  )
}
