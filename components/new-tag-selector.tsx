"use client"

import { useState, useEffect } from "react"
import type { TagHierarchy } from "@/lib/db"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface NewTagSelectorProps {
  hierarchy: TagHierarchy
  selectedTags?: number[]
  onTagChange?: (tagId: number, checked: boolean) => void
  defaultValues?: number[]
  showAddTag?: boolean
}

export function NewTagSelector({
  hierarchy,
  selectedTags = [],
  onTagChange,
  defaultValues = [],
  showAddTag = false,
}: NewTagSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<any[]>([])
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTagData, setNewTagData] = useState({
    name: "",
    color: "#3B82F6",
    category_id: "",
    sub_category_id: "",
  })

  const [isHierarchyLoaded, setIsHierarchyLoaded] = useState(false)

  useEffect(() => {
    const isValidHierarchy =
      hierarchy && typeof hierarchy === "object" && !Array.isArray(hierarchy) && Object.keys(hierarchy).length >= 0
    setIsHierarchyLoaded(isValidHierarchy)
    fetchCategories()
  }, [hierarchy])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

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

  const handleAddTag = async () => {
    if (!newTagData.name.trim() || !newTagData.category_id) return

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagData.name.trim(),
          color: newTagData.color,
          category_id: Number.parseInt(newTagData.category_id),
          sub_category_id: newTagData.sub_category_id ? Number.parseInt(newTagData.sub_category_id) : null,
        }),
      })

      if (response.ok) {
        setNewTagData({ name: "", color: "#3B82F6", category_id: "", sub_category_id: "" })
        setIsAddingTag(false)
        // Refresh the hierarchy
        window.location.reload()
      }
    } catch (error) {
      console.error("Error adding tag:", error)
    }
  }

  return (
    <div className="space-y-3">
      {!isHierarchyLoaded && (
        <div className="space-y-3">
          <div className="text-center py-8 text-gray-500">Loading tags...</div>
        </div>
      )}

      {showAddTag && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Quick Add Tag</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingTag(!isAddingTag)}>
              <Plus className="w-4 h-4 mr-1" />
              {isAddingTag ? "Cancel" : "Add Tag"}
            </Button>
          </div>

          {isAddingTag && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Tag name"
                  value={newTagData.name}
                  onChange={(e) => setNewTagData((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="color"
                  value={newTagData.color}
                  onChange={(e) => setNewTagData((prev) => ({ ...prev, color: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newTagData.category_id}
                  onChange={(e) =>
                    setNewTagData((prev) => ({ ...prev, category_id: e.target.value, sub_category_id: "" }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newTagData.sub_category_id}
                  onChange={(e) => setNewTagData((prev) => ({ ...prev, sub_category_id: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!newTagData.category_id}
                >
                  <option value="">Select Subcategory (Optional)</option>
                  {/* You'd need to fetch subcategories based on selected category */}
                </select>
              </div>
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!newTagData.name.trim() || !newTagData.category_id}
                size="sm"
              >
                Add Tag
              </Button>
            </div>
          )}
        </div>
      )}

      {isHierarchyLoaded &&
        hierarchy &&
        typeof hierarchy === "object" &&
        Object.keys(hierarchy).length > 0 &&
        Object.entries(hierarchy).map(([categoryName, category]) => {
          const isCategoryExpanded = expandedCategories.has(categoryName)

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
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="font-semibold text-gray-900 text-lg">{categoryName}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {category.subcategories && Object.keys(category.subcategories).length} subcategories
                </span>
              </button>

              {/* Subcategories */}
              {isCategoryExpanded && category.subcategories && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {Object.entries(category.subcategories).map(([subcategoryName, subcategory]) => {
                    const subcategoryKey = `${categoryName}-${subcategoryName}`
                    const isSubcategoryExpanded = expandedSubcategories.has(subcategoryKey)

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
                              style={{ backgroundColor: subcategory.color || category.color }}
                            />
                            <span className="font-medium text-gray-800">{subcategoryName}</span>
                          </div>
                          <span className="text-xs text-gray-500">{subcategory.tags.length} tags</span>
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
                                        style={{ backgroundColor: tag.color || subcategory.color || category.color }}
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
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}
