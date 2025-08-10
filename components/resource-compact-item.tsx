"use client"

import type { ResourceWithTags } from "@/lib/db"
import { ExternalLink } from "lucide-react"

interface ResourceCompactItemProps {
  resource: ResourceWithTags
}

export function ResourceCompactItem({ resource }: ResourceCompactItemProps) {
  const truncateDescription = (text: string | null, maxLength: number) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-3">
        {/* Left side - Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{resource.title}</h3>

          {resource["author/s"] && <div className="text-sm text-gray-600 mb-1">Author: {resource["author/s"]}</div>}

          <div className="text-sm text-gray-500 mb-2">By {resource.submitted_by}</div>

          {resource.description && (
            <p className="text-sm text-gray-600 mb-2">{truncateDescription(resource.description, 40)}</p>
          )}
        </div>

        {/* Right side - Visit button */}
        {resource.url_link && (
          <div className="flex-shrink-0">
            <a
              href={resource.url_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Visit
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
