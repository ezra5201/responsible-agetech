"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NewTagSelector } from "@/components/new-tag-selector"
import type { TagHierarchy } from "@/lib/db"
import { Check, AlertTriangle, Globe } from "lucide-react"

export default function SubmitResourcePage() {
  const [showOpeningScreen, setShowOpeningScreen] = useState(true)
  const [formData, setFormData] = useState({
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
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [tagHierarchy, setTagHierarchy] = useState<TagHierarchy>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags?public=true")
      const data = await response.json()
      setTagHierarchy(data)
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagChange = (tagId: number, checked: boolean) => {
    setSelectedTags((prev) => (checked ? [...prev, tagId] : prev.filter((id) => id !== tagId)))
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
          tagIds: selectedTags,
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        console.error("Error submitting resource")
      }
    } catch (error) {
      console.error("Error submitting resource:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showOpeningScreen) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-12 text-center text-white">
              <h1 className="text-3xl font-bold mb-2">Thank You for Contributing!</h1>
              <p className="text-blue-100 text-lg">Help build our global resource library</p>
            </div>

            <div className="p-8">
              {/* Welcome section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">We Welcome Resources That Are:</h2>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  {[
                    "In any language",
                    "Any media type (articles, videos, podcasts, tools)",
                    "Research, case studies, or practical guides",
                    "Educational or informational content",
                    "Open source tools and frameworks",
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Please Confirm Your Resource Does NOT Include:
                  </h2>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      title: "Commercial offers or product sales",
                      description: "No promotional content, pricing pages, or direct sales materials",
                    },
                    {
                      title: "Offensive or discriminatory content",
                      description: "Content that targets or demeans any group based on age, race, gender, or ability",
                    },
                    {
                      title: "Unverified medical advice",
                      description: "Personal medical recommendations without proper credentials or peer review",
                    },
                    {
                      title: "Spam or low-quality content",
                      description: "Duplicate submissions, irrelevant links, or content unrelated to AgeTech/AI",
                    },
                    {
                      title: "Copyright violations",
                      description: "Content shared without proper permissions or attribution",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proceed button */}
              <div className="text-center">
                <Button
                  onClick={() => setShowOpeningScreen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 text-lg"
                >
                  Proceed to Resource Submission
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you for your submission!</h1>
            <p className="text-gray-600 mb-6">
              Your resource is now under review. We'll review it and publish it to the public library once approved.
            </p>
            <Button onClick={() => (window.location.href = "/")}>Return to Home</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Submit a Resource</h1>
            <p className="text-gray-600 mt-1">
              Share a valuable resource with the community. All submissions are reviewed before publication.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              <Label htmlFor="author">Author(s)</Label>
              <Input id="author" name="author" value={formData.author} onChange={handleInputChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="url_link">URL Link</Label>
                <Input
                  id="url_link"
                  name="url_link"
                  type="url"
                  value={formData.url_link}
                  onChange={handleInputChange}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="submitter_email">Submitter E-Mail *</Label>
                <Input
                  id="submitter_email"
                  name="submitter_email"
                  type="email"
                  value={formData.submitter_email}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Your email will not be publicly visible</p>
              </div>

              <div>
                <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
                <Input
                  id="linkedin_profile"
                  name="linkedin_profile"
                  type="url"
                  value={formData.linkedin_profile}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <p className="text-sm text-gray-600 mb-3">Select relevant tags to help others find your resource</p>
              <NewTagSelector
                hierarchy={tagHierarchy}
                selectedTags={selectedTags}
                onTagChange={handleTagChange}
                showAddTag={false}
              />
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Resource"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
