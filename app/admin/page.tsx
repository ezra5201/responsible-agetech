"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { ResourceWithTags, Tag } from "@/lib/db"
import { ResourceCard } from "@/components/resource-card"
import { Plus, TagIcon, Eye, ExternalLink, Sparkles, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ThreeLevelTagSelector } from "@/components/three-level-tag-selector"

interface TagSuggestion {
  tagId: number
  tagName: string
  confidence: number
  reasoning: string
  category: string
  subcategory: string
}

interface SuggestionResponse {
  suggestions: TagSuggestion[]
  aiModel?: string
  note?: string
}

export default function AdminPage() {
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceWithTags | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3B82F6")
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [tagHierarchy, setTagHierarchy] = useState<any>({})
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [isSuggestingTags, setIsSuggestingTags] = useState(false)
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)

  useEffect(() => {
    fetchResources()
    fetchTags()
  }, [])

  // Reset selected tags when dialog opens/closes or editing resource changes
  useEffect(() => {
    if (isResourceDialogOpen) {
      setSelectedTags(editingResource?.tags?.map((t) => t.tag_id) || [])
      setTagSuggestions([])
      setShowSuggestions(false)
      setSuggestionError(null)
    }
  }, [isResourceDialogOpen, editingResource])

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/resources")

      if (!response.ok) {
        const errorText = await response.text()
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
        throw new Error(data.error)
      }

      // Ensure data is an array
      if (Array.isArray(data)) {
        setResources(data)
      } else {
        console.error("API returned non-array data:", data)
        setResources([])
        setError("Invalid data format received from server")
      }
    } catch (error) {
      console.error("Error fetching resources:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch resources")
      setResources([]) // Ensure resources is always an array
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      // Admin interface gets ALL tags (don't use public=true parameter)
      const response = await fetch("/api/tags")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

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

  const handleSuggestTags = async () => {
    setIsSuggestingTags(true)
    setTagSuggestions([])
    setSuggestionError(null)

    try {
      // Get current form values
      const form = document.querySelector("form") as HTMLFormElement
      if (!form) {
        setSuggestionError("Could not access form data")
        return
      }

      const formData = new FormData(form)
      const resourceData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        submitted_by: formData.get("submitted_by") as string,
        url_link: formData.get("url_link") as string,
      }

      // Check if we have enough content to analyze
      const hasContent = resourceData.title?.trim() || resourceData.description?.trim()
      if (!hasContent) {
        setSuggestionError("Please add a title or description before requesting tag suggestions.")
        return
      }

      const response = await fetch("/api/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resourceData),
      })

      const data: SuggestionResponse = await response.json()

      if (data.error) {
        setSuggestionError(data.error)
        return
      }

      if (data.suggestions && data.suggestions.length > 0) {
        setTagSuggestions(data.suggestions)
        setShowSuggestions(true)

        // Auto-select high-confidence suggestions
        const highConfidenceTags = data.suggestions
          .filter((s: TagSuggestion) => s.confidence >= 0.8)
          .map((s: TagSuggestion) => s.tagId)

        setSelectedTags((prev) => [...new Set([...prev, ...highConfidenceTags])])
      } else {
        setSuggestionError("No relevant tag suggestions found. Try adding more descriptive content to the form fields.")
      }
    } catch (error) {
      console.error("Error suggesting tags:", error)
      setSuggestionError("Failed to connect to Claude AI service. Please try again.")
    } finally {
      setIsSuggestingTags(false)
    }
  }

  const handleTagChange = (tagId: number, checked: boolean) => {
    setSelectedTags((prev) => (checked ? [...prev, tagId] : prev.filter((id) => id !== tagId)))
  }

  const applySuggestion = (suggestion: TagSuggestion) => {
    setSelectedTags((prev) => [...new Set([...prev, suggestion.tagId])])
  }

  const removeSuggestion = (suggestion: TagSuggestion) => {
    setSelectedTags((prev) => prev.filter((id) => id !== suggestion.tagId))
  }

  const handleResourceSubmit = async (formData: FormData) => {
    try {
      const data = {
        submitted_by: formData.get("submitted_by"),
        date: formData.get("date"),
        author: formData.get("author"),
        title: formData.get("title"),
        description: formData.get("description"),
        url_link: formData.get("url_link"),
        download_link: formData.get("download_link"),
        linkedin_profile: formData.get("linkedin_profile"),
        tagIds: selectedTags,
      }

      const url = editingResource ? `/api/resources/${editingResource.id}` : "/api/resources"
      const method = editingResource ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setIsResourceDialogOpen(false)
      setEditingResource(null)
      setSelectedTags([])
      setTagSuggestions([])
      setShowSuggestions(false)
      setSuggestionError(null)
      fetchResources()
    } catch (error) {
      console.error("Error saving resource:", error)
      alert("Failed to save resource. Please try again.")
    }
  }

  const handleResourceDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this resource?")) return

    try {
      const response = await fetch(`/api/resources/${id}`, { method: "DELETE" })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      fetchResources()
    } catch (error) {
      console.error("Error deleting resource:", error)
      alert("Failed to delete resource. Please try again.")
    }
  }

  const handleTagSubmit = async (formData: FormData) => {
    try {
      const data = {
        name: formData.get("name"),
        color: formData.get("color"),
      }

      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Clear the form after successful submission
      const form = document.querySelector('form[action="handleTagSubmit"]') as HTMLFormElement
      if (form) {
        form.reset()
      }

      fetchTags()
    } catch (error) {
      console.error("Error creating tag:", error)
      alert("Failed to create tag. Please try again.")
    }
  }

  const handleQuickTagAdd = async () => {
    if (!newTagName.trim()) return

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setNewTagName("")
      setNewTagColor("#3B82F6")
      setIsAddingTag(false)
      fetchTags() // Refresh the tags list
    } catch (error) {
      console.error("Error creating tag:", error)
      alert("Failed to create tag. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Count total tags available in admin
  const totalTagsCount = Object.values(tagHierarchy).reduce((total, category: any) => {
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading admin panel...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Admin Panel</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null)
                fetchResources()
                fetchTags()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
            <div className="mt-4 text-sm text-red-500">
              <p>Make sure you have:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Set up the DATABASE_URL environment variable</li>
                <li>Run the database setup scripts</li>
                <li>Deployed to a platform that supports server-side functions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resource Management</h1>
            <p className="text-sm text-gray-600 mt-1">Full taxonomy available ({totalTagsCount} total tags)</p>
          </div>
          <div className="flex gap-3">
            {/* View Public Button */}
            <Link href="/resources">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Eye className="w-4 h-4" />
                View Public
              </Button>
            </Link>

            {/* View Live Button */}
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => window.open("https://responsible-agetech.org/ressources", "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
              View Live
            </Button>

            {/* Manage Tags Button */}
            <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <TagIcon className="w-4 h-4 mr-2" />
                  Manage Tags
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tag Management</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Add New Tag Form */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Add New Tag</h3>
                    <form action={handleTagSubmit} className="space-y-4" key={tags.length}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tag-name">Tag Name</Label>
                          <Input id="tag-name" name="name" required />
                        </div>
                        <div>
                          <Label htmlFor="tag-color">Color</Label>
                          <Input id="tag-color" name="color" type="color" defaultValue="#3B82F6" />
                        </div>
                      </div>
                      <Button type="submit">Create Tag</Button>
                    </form>
                  </div>

                  {/* Hierarchical Tag Display */}
                  <div>
                    <h3 className="font-medium mb-3">All Tags ({totalTagsCount} total)</h3>
                    <div className="max-h-[50vh] overflow-y-auto">
                      <ThreeLevelTagSelector
                        hierarchy={tagHierarchy}
                        selectedTags={[]}
                        onTagChange={() => {}} // Read-only display
                      />
                    </div>

                    {Object.keys(tagHierarchy).length === 0 && (
                      <p className="text-gray-500 text-sm">No tags created yet.</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Resource Button */}
            <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingResource(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
                  {editingResource && (
                    <div className="text-sm text-gray-500 mt-2 flex flex-col sm:flex-row sm:gap-4">
                      <span>Originally submitted: {formatDate(editingResource.date)}</span>
                      {editingResource.updated_at && editingResource.updated_at !== editingResource.created_at && (
                        <span>Last updated: {formatDateTime(editingResource.updated_at)}</span>
                      )}
                    </div>
                  )}
                </DialogHeader>

                <form action={handleResourceSubmit} className="space-y-6">
                  {/* Main Content Grid - Responsive Layout */}
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="xl:col-span-3 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="submitted_by">Submitted By</Label>
                          <Input
                            id="submitted_by"
                            name="submitted_by"
                            defaultValue={editingResource?.submitted_by}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="date">
                            {editingResource ? "Date Submitted (Original)" : "Date Submitted"}
                          </Label>
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={
                              editingResource?.date ? new Date(editingResource.date).toISOString().split("T")[0] : ""
                            }
                            required
                          />
                          {editingResource && (
                            <p className="text-xs text-gray-500 mt-1">This preserves the original submission date</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="author">Author/s</Label>
                        <Input
                          id="author"
                          name="author"
                          defaultValue={editingResource?.["author/s"] || ""}
                          placeholder="Enter author name(s)"
                        />
                      </div>

                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" defaultValue={editingResource?.title} required />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          defaultValue={editingResource?.description || ""}
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="url_link">URL Link</Label>
                          <Input
                            id="url_link"
                            name="url_link"
                            type="url"
                            defaultValue={editingResource?.url_link || ""}
                          />
                        </div>
                        <div>
                          <Label htmlFor="download_link">Download Link</Label>
                          <Input
                            id="download_link"
                            name="download_link"
                            type="url"
                            defaultValue={editingResource?.download_link || ""}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="linkedin_profile">LinkedIn Profile (Optional)</Label>
                        <Input
                          id="linkedin_profile"
                          name="linkedin_profile"
                          type="url"
                          placeholder="https://linkedin.com/in/username (optional)"
                          defaultValue={editingResource?.linkedin_profile || ""}
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave blank if not applicable</p>
                      </div>
                    </div>

                    {/* Right Column - Tags (stacks below on mobile) */}
                    <div className="xl:col-span-2 order-last xl:order-none">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">Tags</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSuggestTags}
                            disabled={isSuggestingTags}
                            className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600"
                          >
                            {isSuggestingTags ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3 mr-1" />
                            )}
                            AI Suggest
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddingTag(!isAddingTag)}
                            className="text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Tag
                          </Button>
                        </div>
                      </div>

                      {/* Error Display */}
                      {suggestionError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Suggestion Error</span>
                          </div>
                          <p className="text-red-700 text-xs mt-1">{suggestionError}</p>
                          {suggestionError.includes("ANTHROPIC_API_KEY") && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                              <p className="text-yellow-800 font-medium">To enable Claude AI suggestions:</p>
                              <ol className="list-decimal list-inside mt-1 text-yellow-700 space-y-1">
                                <li>
                                  Get an API key from{" "}
                                  <a
                                    href="https://console.anthropic.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                  >
                                    Anthropic Console
                                  </a>
                                </li>
                                <li>Add ANTHROPIC_API_KEY to your environment variables</li>
                                <li>Redeploy your application</li>
                              </ol>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Suggestions Panel */}
                      {showSuggestions && tagSuggestions.length > 0 && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <h4 className="font-medium text-purple-900">Claude AI Suggestions</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowSuggestions(false)}
                              className="ml-auto h-6 w-6 p-0 text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </Button>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {tagSuggestions.map((suggestion, index) => {
                              const isSelected = selectedTags.includes(suggestion.tagId)
                              return (
                                <div key={index} className="flex items-center justify-between text-xs">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-purple-800">{suggestion.tagName}</span>
                                      <span className="text-purple-600">
                                        ({Math.round(suggestion.confidence * 100)}%)
                                      </span>
                                    </div>
                                    <div className="text-purple-600 text-xs truncate">{suggestion.reasoning}</div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                      isSelected ? removeSuggestion(suggestion) : applySuggestion(suggestion)
                                    }
                                    className="ml-2 h-6 px-2 text-xs"
                                  >
                                    {isSelected ? "✓" : "+"}
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {isAddingTag && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md border">
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor="quick-tag-name" className="text-xs">
                                Tag Name
                              </Label>
                              <Input
                                id="quick-tag-name"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Enter tag name"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Label htmlFor="quick-tag-color" className="text-xs">
                                  Color
                                </Label>
                                <Input
                                  id="quick-tag-color"
                                  type="color"
                                  value={newTagColor}
                                  onChange={(e) => setNewTagColor(e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div className="flex gap-1 items-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleQuickTagAdd}
                                  disabled={!newTagName.trim()}
                                  className="h-8 px-2"
                                >
                                  Add
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsAddingTag(false)
                                    setNewTagName("")
                                    setNewTagColor("#3B82F6")
                                  }}
                                  className="h-8 px-2"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="max-h-[50vh] xl:max-h-[60vh] overflow-y-auto border rounded-md bg-gray-50 p-4">
                        <ThreeLevelTagSelector
                          hierarchy={tagHierarchy}
                          selectedTags={selectedTags}
                          onTagChange={handleTagChange}
                          defaultValues={[]}
                        />

                        {Object.keys(tagHierarchy).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No tags available. Create your first tag using the "Add Tag" button above.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" size="lg">
                      {editingResource ? "Update Resource" : "Create Resource"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              showActions={true}
              onEdit={(resource) => {
                setEditingResource(resource)
                setIsResourceDialogOpen(true)
              }}
              onDelete={handleResourceDelete}
            />
          ))}
        </div>

        {resources.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first resource!</p>
              <Button onClick={() => setIsResourceDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Resource
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
