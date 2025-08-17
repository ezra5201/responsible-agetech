"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"

interface CardSubmissionFlowProps {
  onSubmit: (data: any) => void
  onClose: () => void
  tagHierarchy: any
  isSubmitting: boolean
}

export function CardSubmissionFlow({ onSubmit, onClose, tagHierarchy, isSubmitting }: CardSubmissionFlowProps) {
  const [currentCard, setCurrentCard] = useState(1)
  const [formData, setFormData] = useState({
    submitted_by: "",
    date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
    authors: "",
    url: "",
    download_link: "",
    submitter_linkedin: "",
    submitter_email: "",
  })
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [guidelinesConfirmed, setGuidelinesConfirmed] = useState({
    noCommercial: false,
    noOffensive: false,
    noMedical: false,
    noSpam: false,
    noCopyright: false,
  })
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)

  const totalCards = 6
  const cardTitles = [
    "Welcome & Guidelines",
    "Guidelines Confirmation",
    "Resource Details",
    "Resource Links",
    "Submitter Details",
    "Review & Submit",
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagChange = (tagId: number, checked: boolean) => {
    setSelectedTags((prev) => (checked ? [...prev, tagId] : prev.filter((id) => id !== tagId)))
  }

  const handleGuidelineChange = (key: keyof typeof guidelinesConfirmed) => {
    setGuidelinesConfirmed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isCardValid = (cardNumber: number): boolean => {
    switch (cardNumber) {
      case 1:
        return true // Welcome card always valid
      case 2:
        return Object.values(guidelinesConfirmed).every(Boolean)
      case 3:
        return !!(formData.title && formData.description)
      case 4:
        return true // Links are optional
      case 5:
        return !!(formData.submitted_by && formData.submitter_email)
      case 6:
        return true // Review card
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentCard < totalCards && isCardValid(currentCard)) {
      setCurrentCard((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentCard > 1) {
      setCurrentCard((prev) => prev - 1)
    }
  }

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      tagIds: selectedTags,
    })
  }

  const CardHeader = () => (
    <div className="text-center mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{cardTitles[currentCard - 1]}</h2>
      <p className="text-xs sm:text-sm text-gray-500">
        Step {currentCard} of {totalCards}
      </p>
    </div>
  )

  const NavigationButtons = () => (
    <div className="flex justify-between items-center pt-4 sm:pt-6 border-t border-gray-200 gap-4">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={currentCard === 1}
        className="flex items-center gap-2 bg-transparent min-h-[44px] px-4 sm:px-6"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">Prev</span>
      </Button>

      {currentCard === totalCards ? (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !isCardValid(currentCard)}
          className="flex items-center gap-2 min-h-[44px] px-4 sm:px-6"
        >
          {isSubmitting ? "Submitting..." : "Submit Resource"}
        </Button>
      ) : (
        <Button
          onClick={handleNext}
          disabled={!isCardValid(currentCard)}
          className="flex items-center gap-2 min-h-[44px] px-4 sm:px-6"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  )

  return (
    <div className="w-full max-w-full sm:max-w-2xl mx-auto bg-gray-50 rounded-lg p-3 sm:p-6 max-h-screen overflow-hidden">
      <CardHeader />

      <div className="relative overflow-hidden" style={{ minHeight: "350px", maxHeight: "calc(100vh - 200px)" }}>
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${(currentCard - 1) * 100}%)` }}
        >
          {/* Card 1: Welcome & Guidelines Overview */}
          <div className="w-full flex-shrink-0 px-2 sm:px-4">
            <div className="text-center space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Resource Submission Guidelines</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Help build our global resource library for Responsible AgeTech
              </p>
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700">
                  Welcome! You'll be guided through a simple 6-step process to submit your resource. Each step focuses
                  on a specific aspect to make the process clear and manageable.
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-left">
                <h4 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">
                  We Welcome Resources That Are:
                </h4>
                <div className="space-y-1 sm:space-y-2">
                  {[
                    "In any language",
                    "Any media type (articles, videos, podcasts, tools)",
                    "Research, case studies, or practical guides",
                    "Educational or informational content",
                    "Open source tools and frameworks",
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Guidelines Confirmation */}
          <div className="w-full flex-shrink-0 px-2 sm:px-4">
            <div className="space-y-2">
              <div className="text-center mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Please Confirm Your Resource Does NOT Include:
                </h3>
              </div>

              <div className="space-y-1">
                {[
                  {
                    key: "noCommercial" as keyof typeof guidelinesConfirmed,
                    title: "Commercial offers or product sales",
                    description: "No promotional content, pricing pages, or direct sales materials",
                  },
                  {
                    key: "noOffensive" as keyof typeof guidelinesConfirmed,
                    title: "Offensive or discriminatory content",
                    description: "Content that targets or demeans any group based on age, race, gender, or ability",
                  },
                  {
                    key: "noMedical" as keyof typeof guidelinesConfirmed,
                    title: "Unverified medical advice",
                    description: "Personal medical recommendations without proper credentials or peer review",
                  },
                  {
                    key: "noSpam" as keyof typeof guidelinesConfirmed,
                    title: "Spam or low-quality content",
                    description: "Duplicate submissions, irrelevant links, or content unrelated to AgeTech/AI",
                  },
                  {
                    key: "noCopyright" as keyof typeof guidelinesConfirmed,
                    title: "Copyright violations",
                    description: "Content shared without proper permissions or attribution",
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-start gap-2 sm:gap-3 p-2 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      id={item.key}
                      checked={guidelinesConfirmed[item.key]}
                      onChange={() => handleGuidelineChange(item.key)}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0 cursor-pointer"
                      style={{ minWidth: "20px", minHeight: "20px" }}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={item.key}
                        className="font-medium text-gray-900 cursor-pointer text-sm sm:text-base block"
                      >
                        {item.title}
                      </label>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 text-center">
                All boxes must be checked to proceed to the next step
              </p>
            </div>
          </div>

          {/* Card 3: Resource Details */}
          <div className="w-full flex-shrink-0 px-2 sm:px-4">
            <div className="space-y-2">
              <div>
                <Label htmlFor="title" className="mb-1 block text-sm">
                  Resource Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter the title of your resource"
                  required
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="description" className="mb-1 block text-sm">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Provide a detailed description of your resource"
                  required
                  className="text-sm resize-none"
                />
              </div>

              <div>
                <Label htmlFor="authors" className="mb-1 block text-sm">
                  Author(s)
                </Label>
                <Input
                  id="authors"
                  name="authors"
                  value={formData.authors}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith, Jane Doe"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Resource Links */}
          <div className="w-full flex-shrink-0 px-2 sm:px-4">
            <div className="space-y-2">
              <div>
                <Label htmlFor="url" className="mb-1 block text-sm">
                  URL Link
                </Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="text-sm"
                />
                <p className="text-xs text-gray-600 mt-0.5">Link to the main resource (website, article, etc.)</p>
              </div>

              <div>
                <Label htmlFor="download_link" className="mb-1 block text-sm">
                  Download Link
                </Label>
                <Input
                  id="download_link"
                  name="download_link"
                  type="url"
                  value={formData.download_link}
                  onChange={handleInputChange}
                  placeholder="https://example.com/download"
                  className="text-sm"
                />
                <p className="text-xs text-gray-600 mt-0.5">Direct download link if applicable (PDF, document, etc.)</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-gray-700">
                  <strong>Note:</strong> Both links are optional, but providing at least one helps users access your
                  resource.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Submitter Details */}
          <div className="w-full flex-shrink-0 px-2 sm:px-4">
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="submitted_by" className="mb-1 block text-sm">
                    Your Name *
                  </Label>
                  <Input
                    id="submitted_by"
                    name="submitted_by"
                    value={formData.submitted_by}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="mb-1 block text-sm">
                    Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="submitter_email" className="mb-1 block text-sm">
                  Submitter E-Mail *
                </Label>
                <Input
                  id="submitter_email"
                  name="submitter_email"
                  type="email"
                  value={formData.submitter_email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  className="text-sm"
                />
                <p className="text-xs text-gray-600 mt-0.5">Your email will not be publicly visible</p>
              </div>

              <div>
                <Label htmlFor="submitter_linkedin" className="mb-1 block text-sm">
                  LinkedIn Profile
                </Label>
                <Input
                  id="submitter_linkedin"
                  name="submitter_linkedin"
                  type="url"
                  value={formData.submitter_linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Card 6: Review & Submit */}
          <div className="w-full flex-shrink-0 px-2 sm:px-4">
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3 border border-gray-200 max-h-64 overflow-y-auto">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Review Your Submission</h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div>
                    <strong>Title:</strong> {formData.title || "Not provided"}
                  </div>
                  <div>
                    <strong>Author(s):</strong> {formData.authors || "Not provided"}
                  </div>
                  <div>
                    <strong>Description:</strong>{" "}
                    {formData.description ? `${formData.description.substring(0, 100)}...` : "Not provided"}
                  </div>
                  <div>
                    <strong>URL:</strong> {formData.url || "Not provided"}
                  </div>
                  <div>
                    <strong>Download Link:</strong> {formData.download_link || "Not provided"}
                  </div>
                  <div>
                    <strong>Submitted by:</strong> {formData.submitted_by || "Not provided"}
                  </div>
                  <div>
                    <strong>Email:</strong> {formData.submitter_email || "Not provided"}
                  </div>
                  <div>
                    <strong>LinkedIn:</strong> {formData.submitter_linkedin || "Not provided"}
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-gray-700">
                  <strong>Ready to submit!</strong> Your resource will be reviewed before being published to the public
                  library.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NavigationButtons />
    </div>
  )
}
