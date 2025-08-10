"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ResourceCard } from "@/components/resource-card"
import { ResourceListItem } from "@/components/resource-list-item"
import { ResourceCompactItem } from "@/components/resource-compact-item"
import { SlidingFilterPanel } from "@/components/sliding-filter-panel"
import { ActiveFiltersBar } from "@/components/active-filters-bar"
import { NewTagSelector } from "@/components/new-tag-selector"
import type { Resource, TagHierarchy } from "@/lib/db"

type ViewMode = "grid" | "list" | "compact"

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [tagHierarchy, setTagHierarchy] = useState<TagHierarchy>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Form state for resource submission
  const [formData, setFormData] = useState({
    submitted_by: "",
    date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
    author: "",
    url_link: "",
    download_link: "",
    linkedin_profile: "",
  })
  const [formSelectedTags, setFormSelectedTags] = useState<number[]>([])
  const [submitTagHierarchy, setSubmitTagHierarchy] = useState<TagHierarchy>({})

  useEffect(() => {
    fetchResources()
    fetchTags()
    fetchSubmitTags()
  }, [])

  useEffect(() => {
    filterResources()
  }, [resources, searchTerm, selectedTags])

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/resources")
      const data = await response.json()
      setResources(data)
    } catch (error) {
      console.error("Error fetching resources:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags?public=true")
      const data = await response.json()
      setTagHierarchy(data || {})
    } catch (error) {
      console.error("Error fetching tags:", error)
      setTagHierarchy({})
    }
  }

  const fetchSubmitTags = async () => {
    try {
      const response = await fetch("/api/tags?public=true")
      const data = await response.json()
      // Filter to only show Thematic Topics
      const filteredData: TagHierarchy = {}
      if (data && data["Thematic Topics"]) {
        filteredData["Thematic Topics"] = data["Thematic Topics"]
      }
      setSubmitTagHierarchy(filteredData)
    } catch (error) {
      console.error("Error fetching submit tags:", error)
      setSubmitTagHierarchy({})
    }
  }

  const filterResources = () => {
    let filtered = resources

    if (searchTerm) {
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.author?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((resource) => resource.tags?.some((tag) => selectedTags.includes(tag.id)))
    }

    setFilteredResources(filtered)
  }

  const handleTagChange = (tagId: number, checked: boolean) => {
    setSelectedTags((prev) => (checked ? [...prev, tagId] : prev.filter((id) => id !== tagId)))
  }

  const handleFormTagChange = (tagId: number, checked: boolean) => {
    setFormSelectedTags((prev) => (checked ? [...prev, tagId] : prev.filter((id) => id !== tagId)))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedTags([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tagIds: formSelectedTags,
        }),
      })

      if (response.ok) {
        setSubmitSuccess(true)
        // Reset form
        setFormData({
          submitted_by: "",
          date: new Date().toISOString().split("T")[0],
          title: "",
          description: "",
          author: "",
          url_link: "",
          download_link: "",
          linkedin_profile: "",
        })
        setFormSelectedTags([])

        // Close dialog after a delay
        setTimeout(() => {
          setIsSubmitDialogOpen(false)
          setSubmitSuccess(false)
        }, 2000)
      } else {
        console.error("Error submitting resource")
      }
    } catch (error) {
      console.error("Error submitting resource:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
            <p className="text-gray-600 mt-2">Discover valuable resources for responsible aging technology</p>
          </div>

          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            {/* Filter Button */}
            <Button variant="outline" onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter Resources
            </Button>

            {/* Submit Resource Button */}
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Submit a Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit a Resource</DialogTitle>
                </DialogHeader>

                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you for your submission!</h3>
                    <p className="text-gray-600">Your resource is now under review.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="submitted_by">Your Name *</Label>
                        <Input
                          id="submitted_by"
                          name="submitted_by"
                          value={formData.submitted_by}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">Resource Title *</Label>
                      <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="author">Author(s) *</Label>
                      <Input id="author" name="author" value={formData.author} onChange={handleInputChange} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="url_link">URL Link *</Label>
                        <Input
                          id="url_link"
                          name="url_link"
                          type="url"
                          value={formData.url_link}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="download_link">Download Link</Label>
                        <Input
                          id="download_link"
                          name="download_link"
                          type="url"
                          value={formData.download_link}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="linkedin_profile">LinkedIn Profile *</Label>
                      <Input
                        id="linkedin_profile"
                        name="linkedin_profile"
                        type="url"
                        value={formData.linkedin_profile}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label>Tags</Label>
                      <p className="text-sm text-gray-600 mb-3">
                        Select relevant tags to help others find your resource
                      </p>
                      <NewTagSelector
                        hierarchy={submitTagHierarchy}
                        selectedTags={formSelectedTags}
                        onTagChange={handleFormTagChange}
                        showAddTag={false}
                      />
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Resource"}
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Active Filters */}
        <ActiveFiltersBar
          searchTerm={searchTerm}
          selectedTags={selectedTags}
          tagHierarchy={tagHierarchy}
          onClearFilters={clearFilters}
          onRemoveTag={(tagId) => setSelectedTags((prev) => prev.filter((id) => id !== tagId))}
          onClearSearch={() => setSearchTerm("")}
        />

        {/* View Mode Toggle */}
        <div className="flex justify-end mb-6">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm ${
                viewMode === "grid" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm border-l border-gray-200 ${
                viewMode === "list" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`px-3 py-2 text-sm border-l border-gray-200 ${
                viewMode === "compact" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Compact
            </button>
          </div>
        </div>

        {/* Resources Grid/List */}
        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No resources found matching your criteria.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredResources.map((resource) => {
              if (viewMode === "grid") {
                return <ResourceCard key={resource.id} resource={resource} />
              } else if (viewMode === "list") {
                return <ResourceListItem key={resource.id} resource={resource} />
              } else {
                return <ResourceCompactItem key={resource.id} resource={resource} />
              }
            })}
          </div>
        )}

        {/* Filter Panel */}
        <SlidingFilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          tagHierarchy={tagHierarchy}
          selectedTags={selectedTags}
          onTagChange={handleTagChange}
        />
      </div>
    </div>
  )
}
