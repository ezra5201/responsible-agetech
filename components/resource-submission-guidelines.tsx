"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Check, AlertTriangle, Globe } from "lucide-react"

interface ResourceSubmissionGuidelinesProps {
  onProceed: () => void
}

export function ResourceSubmissionGuidelines({ onProceed }: ResourceSubmissionGuidelinesProps) {
  const [confirmations, setConfirmations] = React.useState({
    noCommercial: false,
    noOffensive: false,
    noMedical: false,
    noSpam: false,
    noCopyright: false,
  })

  const handleConfirmationChange = (key: keyof typeof confirmations) => {
    setConfirmations((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const allConfirmed = Object.values(confirmations).every(Boolean)

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 rounded-lg">
      <div className="p-6">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">Thank You for Contributing!</h2>
        <p className="text-center text-gray-600">
          Help us build our global resource library for Responsible AgeTech 2025
        </p>
      </div>

      <div className="bg-white p-6 space-y-6">
        {/* Welcome Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">We Welcome Resources That Are:</h3>
          </div>

          <div className="bg-green-50 rounded-lg p-4 space-y-2">
            {[
              "In any language",
              "Any media type (articles, videos, podcasts, tools)",
              "Research, case studies, or practical guides",
              "Educational or informational content",
              "Open source tools and frameworks",
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Please Confirm Your Resource Does NOT Include:</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id="noCommercial"
                checked={confirmations.noCommercial}
                onChange={() => handleConfirmationChange("noCommercial")}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="noCommercial" className="font-medium text-gray-900 cursor-pointer">
                  Commercial offers or product sales
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  No promotional content, pricing pages, or direct sales materials
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id="noOffensive"
                checked={confirmations.noOffensive}
                onChange={() => handleConfirmationChange("noOffensive")}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="noOffensive" className="font-medium text-gray-900 cursor-pointer">
                  Offensive or discriminatory content
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Content that targets or demeans any group based on age, race, gender, or ability
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id="noMedical"
                checked={confirmations.noMedical}
                onChange={() => handleConfirmationChange("noMedical")}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="noMedical" className="font-medium text-gray-900 cursor-pointer">
                  Unverified medical advice
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Personal medical recommendations without proper credentials or peer review
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id="noSpam"
                checked={confirmations.noSpam}
                onChange={() => handleConfirmationChange("noSpam")}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="noSpam" className="font-medium text-gray-900 cursor-pointer">
                  Spam or low-quality content
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Duplicate submissions, irrelevant links, or content unrelated to AgeTech/AI
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id="noCopyright"
                checked={confirmations.noCopyright}
                onChange={() => handleConfirmationChange("noCopyright")}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="noCopyright" className="font-medium text-gray-900 cursor-pointer">
                  Copyright violations
                </label>
                <p className="text-sm text-gray-600 mt-1">Content shared without proper permissions or attribution</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-4">All boxes must be checked to proceed with submission</p>
          <div className="flex justify-center">
            <Button onClick={onProceed} disabled={!allConfirmed} className="px-8 py-2">
              Proceed to Resource Submission
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
