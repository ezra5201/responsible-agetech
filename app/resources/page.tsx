"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Plus, Search, Filter } from "lucide-react"
import { NewTagSelector } from "@/components/new-tag-selector"
import { ResourceSubmissionGuidelines } from "@/components/resource-submission-guidelines"
import type { Tag } from "@/lib/db"

interface Resource {
  id: number
  title: string
  description: string
  authors: string
  url_link: string
  download_link: string | null
  submitter_name: string
  submission_date: string
  submitter_email: string
  submitter_linkedin: string | null
  tags: Tag[]
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Collapsible sections state
  const [resourceDetailsOpen, setResourceDetailsOpen] = useState(true)
  const [resourceTagsOpen, setResourceTagsOpen] = useState(false)
  const [submitterDetailsOpen, setSubmitterDetailsOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    authors: "",
    url_link: "",
    download_link: "",
    submitter_name: "",
    submitter_email: "",
    submitter_linkedin: "",
    tags: [] as Tag[],
  })

  // Load resources on component mount
  useEffect(() => {
    fetchResources()
  }, [])

  // Filter resources based on search and tags
  useEffect(() => {
    let filtered = resources

    if (searchTerm) {
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.authors.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((resource) => resource.tags.some((tag) => selectedTags.includes(tag.name)))
    }

    setFilteredResources(filtered)
  }, [resources, searchTerm, selectedTags])

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/resources")
      if (response.ok) {
        const data = await response.json()
        setResources(data)
      }
    } catch (error) {
      console.error("Error fetching resources:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagsChange = (tags: Tag[]) => {
    setFormData((prev) => ({ ...prev, tags }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setFormData({
          title: "",
          description: "",
          authors: "",
          url_link: "",
          download_link: "",
          submitter_name: "",
          submitter_email: "",
          submitter_linkedin: "",
          tags: [],
        })
        fetchResources() // Refresh the resources list
      } else {
        console.error("Error submitting resource")
      }
    } catch (error) {
      console.error("Error submitting resource:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogClose = () => {
    setIsSubmitDialogOpen(false)
    setShowGuidelines(true)
    setIsSubmitted(false)
    setResourceDetailsOpen(true)
    setResourceTagsOpen(false)
    setSubmitterDetailsOpen(false)
  }

  const handleProceedToSubmission = () => {
    setShowGuidelines(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Resource Library</h1>
          <p className="text-muted-foreground">
            Discover and contribute to our collection of Responsible AgeTech resources
          </p>
        </div>

        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsSubmitDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Submit a Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50">
            {showGuidelines ? (
              <ResourceSubmissionGuidelines onProceed={handleProceedToSubmission} />
            ) : isSubmitted ? (
              <div className="text-center py-8">
                <h3 className="text-2xl font-bold text-center mb-4">Thank You!</h3>
                <p className="text-muted-foreground mb-6">
                  Your resource has been submitted successfully and will be reviewed before being added to the library.
                </p>
                <Button onClick={handleDialogClose}>Close</Button>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-center mb-2">Submit a Resource</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                  {/* Resource Details Section */}
                  <Collapsible open={resourceDetailsOpen} onOpenChange={setResourceDetailsOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border hover:bg-gray-50">
                      <h3 className="text-lg font-semibold">Resource Details</h3>
                      {resourceDetailsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4 bg-white p-4 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="title" className="mb-2 block">
                            Resource Title *
                          </Label>
                          <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter the resource title"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="description" className="mb-2 block">
                            Description *
                          </Label>
                          <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            placeholder="Provide a detailed description of the resource"
                            rows={4}
                          />
                        </div>

                        <div>
                          <Label htmlFor="authors" className="mb-2 block">
                            Author(s) *
                          </Label>
                          <Input
                            id="authors"
                            name="authors"
                            value={formData.authors}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter author names"
                          />
                        </div>

                        <div>
                          <Label htmlFor="url_link" className="mb-2 block">
                            URL Link *
                          </Label>
                          <Input
                            id="url_link"
                            name="url_link"
                            type="url"
                            value={formData.url_link}
                            onChange={handleInputChange}
                            required
                            placeholder="https://example.com"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="download_link" className="mb-2 block">
                            Download Link
                          </Label>
                          <Input
                            id="download_link"
                            name="download_link"
                            type="url"
                            value={formData.download_link}
                            onChange={handleInputChange}
                            placeholder="https://example.com/download (optional)"
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Resource Tags Section */}
                  <Collapsible open={resourceTagsOpen} onOpenChange={setResourceTagsOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border hover:bg-gray-50">
                      <h3 className="text-lg font-semibold">Resource Tags</h3>
                      {resourceTagsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 bg-white p-4 rounded-lg border">
                      <NewTagSelector selectedTags={formData.tags} onTagsChange={handleTagsChange} />
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Submitter Details Section */}
                  <Collapsible open={submitterDetailsOpen} onOpenChange={setSubmitterDetailsOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border hover:bg-gray-50">
                      <h3 className="text-lg font-semibold">Submitter Details</h3>
                      {submitterDetailsOpen ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4 bg-white p-4 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="submitter_name" className="mb-2 block">
                            Your Name *
                          </Label>
                          <Input
                            id="submitter_name"
                            name="submitter_name"
                            value={formData.submitter_name}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="submission_date" className="mb-2 block">
                            Date
                          </Label>
                          <Input
                            id="submission_date"
                            type="date"
                            value={new Date().toISOString().split("T")[0]}
                            disabled
                          />
                        </div>

                        <div>
                          <Label htmlFor="submitter_email" className="mb-2 block">
                            Submitter E-Mail *
                          </Label>
                          <Input
                            id="submitter_email"
                            name="submitter_email"
                            type="email"
                            value={formData.submitter_email}
                            onChange={handleInputChange}
                            required
                            placeholder="your.email@example.com"
                          />
                          <p className="text-sm text-muted-foreground mt-1">Your email will not be publicly visible</p>
                        </div>

                        <div>
                          <Label htmlFor="submitter_linkedin" className="mb-2 block">
                            Submitter LinkedIn Profile
                          </Label>
                          <Input
                            id="submitter_linkedin"
                            name="submitter_linkedin"
                            type="url"
                            value={formData.submitter_linkedin}
                            onChange={handleInputChange}
                            placeholder="https://linkedin.com/in/yourprofile (optional)"
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </form>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
                  <div className="max-w-4xl mx-auto">
                    <Button type="submit" onClick={handleSubmit} disabled={isLoading} className="w-full">
                      {isLoading ? "Submitting..." : "Submit Resource"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="md:w-auto bg-transparent">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">By {resource.authors}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 line-clamp-3">{resource.description}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {resource.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
                {resource.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{resource.tags.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1">
                  <a href={resource.url_link} target="_blank" rel="noopener noreferrer">
                    View Resource
                  </a>
                </Button>
                {resource.download_link && (
                  <Button asChild variant="outline" size="sm">
                    <a href={resource.download_link} target="_blank" rel="noopener noreferrer">
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No resources found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
