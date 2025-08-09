"use client"

import { useState, useEffect } from "react"
import type { ResourceWithTags, Tag } from "@/lib/db"
import { ResourceCard } from "@/components/resource-card"
import { SlidingFilterPanel } from "@/components/sliding-filter-panel"
import { ActiveFiltersBar } from "@/components/active-filters-bar"
import { resourceStyles } from "@/lib/styles"
import { Search, SortAsc, SortDesc, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tagHierarchy, setTagHierarchy] = useState<any>({})
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    fetchResources()
  }, [selectedTags, sortBy, sortOrder])

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        ...(selectedTags.length > 0 && { tags: selectedTags.join(",") }),
      })

      const response = await fetch(`/api/resources?${params}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()

      if (data.error) {
        console.error("API returned error:", data.error, data.details)
        throw new Error(data.error)
      }

      setResources(data)
    } catch (error) {
      console.error("Error fetching resources:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch resources")
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      // Use public=true parameter to get only tags with associated resources
      const response = await fetch("/api/tags?public=true")
      const data = await response.json()

      if (data.flat && Array.isArray(data.flat)) {
        setTags(data.flat)
        setTagHierarchy(data.hierarchy || {})
      } else {
        setTags([])
        setTagHierarchy({})
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
      setTags([])
      setTagHierarchy({})
    }
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) => (prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]))
  }

  const filteredResources = resources.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const clearAllFilters = () => {
    setSelectedTags([])
    setSearchTerm("")
  }

  // Count available tags for display
  const availableTagsCount = Object.values(tagHierarchy).reduce((total, category: any) => {
    return (
      total +
      Object.values(category.subcategories).reduce((subTotal, subcategory: any) => {
        return subTotal + subcategory.tags.length
      }, 0)
    )
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">Loading resources...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Resources</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null)
                fetchResources()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Resources</h1>

          {/* Search and Sort Controls */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="submitted_by">Submitted By</option>
                </select>
                <button
                  onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>

                {/* Mobile Filter Button */}
                <Button variant="outline" onClick={() => setIsFilterPanelOpen(true)} className="sm:hidden">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Bar */}
          <div className="mb-6">
            <ActiveFiltersBar
              hierarchy={tagHierarchy}
              selectedTags={selectedTags}
              onTagToggle={toggleTag}
              onClearAll={clearAllFilters}
              onOpenFilters={() => setIsFilterPanelOpen(true)}
            />
          </div>

          {/* Results Count and Filter Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              <div>
                Showing {filteredResources.length} of {resources.length} resources
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {availableTagsCount} filter tags available (only showing tags with resources)
              </div>
            </div>

            {/* Desktop Filter Button */}
            <Button
              variant="outline"
              onClick={() => setIsFilterPanelOpen(true)}
              className="hidden sm:flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter by Tags ({availableTagsCount} available)
            </Button>
          </div>

          {/* Resources Grid */}
          <div className={resourceStyles.grid.container}>
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-sm border p-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Found</h3>
                <p className="text-gray-500 mb-4">
                  {selectedTags.length > 0 || searchTerm
                    ? "Try adjusting your filters or search terms."
                    : "No resources have been added yet."}
                </p>
                {(selectedTags.length > 0 || searchTerm) && (
                  <Button onClick={clearAllFilters} variant="outline">
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sliding Filter Panel */}
      <SlidingFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        hierarchy={tagHierarchy}
        selectedTags={selectedTags}
        onTagToggle={toggleTag}
        onClearAll={clearAllFilters}
      />
    </div>
  )
}
