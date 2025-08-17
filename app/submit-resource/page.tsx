"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CardSubmissionFlow } from "@/components/card-submission-flow"
import type { TagHierarchy } from "@/lib/db"

export default function SubmitResourcePage() {
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

  const handleCardSubmission = async (formData: any) => {
    console.log("[v0] Starting card submission with data:", formData)
    setIsSubmitting(true)

    try {
      console.log("[v0] Making API request to /api/resources")
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      console.log("[v0] API response status:", response.status)

      if (response.ok) {
        console.log("[v0] Submission successful")
        setIsSubmitted(true)
      } else {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)
        alert(`Submission failed: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("[v0] Network/fetch error:", error)
      alert(`Submission failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {isSubmitted ? (
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
            <Button onClick={() => (window.location.href = "/resources")}>Back to Resources</Button>
          </div>
        ) : (
          <CardSubmissionFlow
            onSubmit={handleCardSubmission}
            onClose={() => (window.location.href = "/resources")}
            tagHierarchy={tagHierarchy}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}
