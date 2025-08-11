"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { ResourceWithTags, Tag } from "@/lib/db"
import { ResourceCard } from "@/components/resource-card"
import { ResourceListItem } from "@/components/resource-list-item"
import { ResourceCompactItem } from "@/components/resource-compact-item"
import { SlidingFilterPanel } from "@/components/sliding-filter-panel"
import { ActiveFiltersBar } from "@/components/active-filters-bar"
import { resourceStyles } from "@/lib/styles"
import { Search, SortAsc, SortDesc, Filter, Grid3X3, List, Smartphone, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NewTagSelector } from "@/components/new-tag-selector"
import type { TagHierarchy } from "@/lib/db"
import { ResourceSubmissionGuidelines } from "@/components/resource-submission-guidelines"

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
  const [viewMode, setViewMode] = useState<"cards" | "list" | "compact">("list")
  const [showSearch, setShowSearch] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [submitFormData, setSubmitFormData] = useState({
    submitted_by: "",
    date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
    author: "",
    url_link: "",
    download_link: "",
    linkedin_profile: "",
    submitter_email: "",
  })
  const [submitSelectedTags, setSubmitSelectedTags] = useState<number[]>([])
  const [submitTagHierarchy, setSubmitTagHierarchy] = useState<TagHierarchy>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [linkedinError, setLinkedinError] = useState("")
  const [descriptionError, setDescriptionError] = useState("")
  const [submissionStep, setSubmissionStep] = useState<"guidelines" | "form">("guidelines")

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    fetchResources()
  }, [selectedTags, sortBy, sortOrder])

  useEffect(() => {
    // Set responsive default on mount
    const isMobile = window.innerWidth < 768 // Tailwind's md breakpoint
    setViewMode(isMobile ? "compact" : "list")
  }, [])

  useEffect(() => {
    if (isSubmitDialogOpen) {
      fetchSubmitTags()
    }
  }, [isSubmitDialogOpen])

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        ...(selectedTags.length > 0 && { tags: selectedTags.join(",") }),
      })

      const response = await fetch(`/api/resources?${params}&status=published`)

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

      if (data && data.flat && Array.isArray(data.flat)) {
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

  const fetchSubmitTags = async () => {
    try {
      const response = await fetch("/api/tags?public=true")
      const data = await response.json()

      if (data && data.hierarchy) {
        // Filter to only show Thematic Topics
        const filteredHierarchy: TagHierarchy = {}
        if (data.hierarchy["Thematic Topics"]) {
          filteredHierarchy["Thematic Topics"] = data.hierarchy["Thematic Topics"]
        }
        setSubmitTagHierarchy(filteredHierarchy)
      } else {
        setSubmitTagHierarchy({})
      }
    } catch (error) {
      console.error("Error fetching submit tags:", error)
      setSubmitTagHierarchy({})
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

  const handleSearchToggle = () => {
    setShowSearch(!showSearch)
    setShowSort(false)
  }

  const handleSortToggle = () => {
    setShowSort(!showSort)
    setShowSearch(false)
  }

  const handleFilterToggle = () => {
    setIsFilterPanelOpen(true)
    setShowSearch(false)
    setShowSort(false)
  }

  const validateLinkedInUrl = (url: string) => {
    if (!url) return false // Now required, so empty is invalid
    return url.includes("https://www.linkedin.com/in/")
  }

  const validateDescription = (description: string) => {
    const length = description.length
    if (length < 100) {
      return "Description must be at least 100 characters"
    }
    if (length > 600) {
      return "Description must not exceed 600 characters"
    }
    return ""
  }

  const handleSubmitInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSubmitFormData((prev) => ({ ...prev, [name]: value }))

    // Validate LinkedIn URL on change
    if (name === "linkedin_profile") {
      if (!value) {
        setLinkedinError("LinkedIn Profile URL is required")
      } else if (!validateLinkedInUrl(value)) {
        setLinkedinError("LinkedIn URL must include 'https://www.linkedin.com/in/'")
      } else {
        setLinkedinError("")
      }
    }

    // Validate description on change
    if (name === "description") {
      const error = validateDescription(value)
      setDescriptionError(error)
    }
  }

  const handleSubmitTagChange = (tagId: number, checked: boolean) => {
    setSubmitSelectedTags((prev) => (checked ? [...prev, tagId] : prev.filter((id) => id !== tagId)))
  }

  const handleSubmitResource = async (e: React.FormEvent) => {
    e.preventDefault()

    // Final validation check
    if (submitFormData.linkedin_profile && !validateLinkedInUrl(submitFormData.linkedin_profile)) {
      setLinkedinError("LinkedIn URL must include 'https://www.linkedin.com/in/'")
      return
    }

    const descError = validateDescription(submitFormData.description)
    if (descError) {
      setDescriptionError(descError)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submitFormData,
          tagIds: submitSelectedTags,
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        // Reset form
        setSubmitFormData({
          submitted_by: "",
          date: new Date().toISOString().split("T")[0],
          title: "",
          description: "",
          author: "",
          url_link: "",
          download_link: "",
          linkedin_profile: "",
          submitter_email: "",
        })
        setSubmitSelectedTags([])
        setLinkedinError("")
        setDescriptionError("")
      } else {
        console.error("Error submitting resource")
      }
    } catch (error) {
      console.error("Error submitting resource:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDialogClose = () => {
    setIsSubmitDialogOpen(false)
    setIsSubmitted(false)
    setLinkedinError("")
    setDescriptionError("")
    setSubmissionStep("guidelines")
  }

  const handleProceedToForm = () => {
    setSubmissionStep("form")
  }

  // Count available tags for display
  const availableTagsCount = Object.values(tagHierarchy || {}).reduce((total, category: any) => {
    if (!category || !category.subcategories) return total
    return (
      total +
      Object.values(category.subcategories).reduce((subTotal, subcategory: any) => {
        if (!subcategory || !subcategory.tags) return subTotal
        return subTotal + subcategory.tags.length
      }, 0)
    )
  }, 0)

  const descriptionLength = submitFormData.description.length
  const isDescriptionValid = descriptionLength >= 100 && descriptionLength <= 600

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
          {/* Header with Title and Icons */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
            <div className="flex gap-4 order-last sm:order-none">
              <button
                onClick={handleSearchToggle}
                className={`p-2 rounded-md transition-colors ${
                  showSearch ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={handleSortToggle}
                className={`p-2 rounded-md transition-colors ${
                  showSort ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {sortOrder === "asc" ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
              </button>
              <button
                onClick={handleFilterToggle}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors relative"
              >
                <Filter className="w-5 h-5" />
                {selectedTags.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedTags.length}
                  </span>
                )}
              </button>
              <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Submit a Resource
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>
                      {submissionStep === "guidelines" ? "Resource Submission Guidelines" : "Submit a Resource"}
                    </DialogTitle>
                  </DialogHeader>

                  {submissionStep === "guidelines" ? (
                    <ResourceSubmissionGuidelines onProceed={handleProceedToForm} />
                  ) : isSubmitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you for your submission!</h3>
                      <p className="text-gray-600 mb-4">
                        Your resource is now under review. We'll review it and publish it to the public library once
                        approved.
                      </p>
                      <Button onClick={handleDialogClose}>Close</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitResource} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="submitted_by">Your Name *</Label>
                          <Input
                            id="submitted_by"
                            name="submitted_by"
                            value={submitFormData.submitted_by}
                            onChange={handleSubmitInputChange}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            value={submitFormData.date}
                            onChange={handleSubmitInputChange}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="title">Resource Title *</Label>
                        <Input
                          id="title"
                          name="title"
                          value={submitFormData.title}
                          onChange={handleSubmitInputChange}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={submitFormData.description}
                          onChange={handleSubmitInputChange}
                          rows={4}
                          required
                          className={descriptionError ? "border-red-500" : ""}
                          maxLength={600}
                        />
                        <div className="flex justify-between items-center mt-1">
                          <div>{descriptionError && <p className="text-red-500 text-sm">{descriptionError}</p>}</div>
                          <p
                            className={`text-sm ${
                              descriptionLength < 100
                                ? "text-red-500"
                                : descriptionLength > 600
                                  ? "text-red-500"
                                  : "text-gray-500"
                            }`}
                          >
                            {descriptionLength}/600 characters (minimum 100)
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="author">Author(s) *</Label>
                        <Input
                          id="author"
                          name="author"
                          value={submitFormData.author}
                          onChange={handleSubmitInputChange}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="url_link">URL Link *</Label>
                          <Input
                            id="url_link"
                            name="url_link"
                            type="url"
                            value={submitFormData.url_link}
                            onChange={handleSubmitInputChange}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="download_link">Download Link</Label>
                          <Input
                            id="download_link"
                            name="download_link"
                            type="url"
                            value={submitFormData.download_link}
                            onChange={handleSubmitInputChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="submitter_email">Submitter E-Mail *</Label>
                          <Input
                            id="submitter_email"
                            name="submitter_email"
                            type="email"
                            value={submitFormData.submitter_email}
                            onChange={handleSubmitInputChange}
                            placeholder="your.email@example.com"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Your email will not be publicly visible</p>
                        </div>

                        <div>
                          <Label htmlFor="linkedin_profile">LinkedIn Profile *</Label>
                          <Input
                            id="linkedin_profile"
                            name="linkedin_profile"
                            type="url"
                            value={submitFormData.linkedin_profile}
                            onChange={handleSubmitInputChange}
                            placeholder="https://www.linkedin.com/in/yourname"
                            required
                            className={linkedinError ? "border-red-500" : ""}
                          />
                          {linkedinError && <p className="text-red-500 text-sm mt-1">{linkedinError}</p>}
                        </div>
                      </div>

                      <div>
                        <Label>Tags</Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Select relevant tags to help others find your resource
                        </p>
                        {Object.keys(submitTagHierarchy).length > 0 ? (
                          <NewTagSelector
                            hierarchy={submitTagHierarchy}
                            selectedTags={submitSelectedTags}
                            onTagChange={handleSubmitTagChange}
                            showAddTag={false}
                          />
                        ) : (
                          <div className="text-sm text-gray-500">Loading tags...</div>
                        )}
                      </div>

                      <div className="flex justify-end pt-6 border-t border-gray-200">
                        <Button
                          type="submit"
                          disabled={
                            isSubmitting ||
                            !!linkedinError ||
                            !!descriptionError ||
                            !isDescriptionValid ||
                            !submitFormData.linkedin_profile.trim()
                          }
                        >
                          {isSubmitting ? "Submitting..." : "Submit Resource"}
                        </Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search Section */}
          {showSearch && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Sort Section */}
          {showSort && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="title">Title</option>
                    <option value="submitted_by">Submitted By</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
                  <div className="flex border border-gray-300 rounded-md overflow-hidden">
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`flex-1 px-2 py-2 flex items-center justify-center gap-1 text-xs font-medium transition-colors ${
                        viewMode === "cards" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Grid3X3 className="w-3 h-3" />
                      Full
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`flex-1 px-2 py-2 flex items-center justify-center gap-1 text-xs font-medium transition-colors border-l border-gray-300 ${
                        viewMode === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <List className="w-3 h-3" />
                      Brief
                    </button>
                    <button
                      onClick={() => setViewMode("compact")}
                      className={`flex-1 px-2 py-2 flex items-center justify-center gap-1 text-xs font-medium transition-colors border-l border-gray-300 ${
                        viewMode === "compact" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      Minimal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Bar */}
          {selectedTags.length > 0 && (
            <div className="mb-6">
              <ActiveFiltersBar
                hierarchy={tagHierarchy}
                selectedTags={selectedTags}
                onTagToggle={toggleTag}
                onClearAll={clearAllFilters}
                onOpenFilters={() => setIsFilterPanelOpen(true)}
              />
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600 mb-6">
            <div>
              Showing {filteredResources.length} of {resources.length} resources
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {availableTagsCount} filter tags available (only showing tags with resources)
            </div>
          </div>

          {/* Resources Display */}
          {viewMode === "cards" ? (
            <div className={resourceStyles.grid.container}>
              {filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-4">
              {filteredResources.map((resource) => (
                <ResourceListItem key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResources.map((resource) => (
                <ResourceCompactItem key={resource.id} resource={resource} />
              ))}
            </div>
          )}

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
        hierarchy={tagHierarchy || {}}
        selectedTags={selectedTags}
        onTagToggle={toggleTag}
        onClearAll={clearAllFilters}
      />
    </div>
  )
}
