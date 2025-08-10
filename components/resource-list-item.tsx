"use client"

import type { ResourceWithTags } from "@/lib/db"
import { ExternalLink, Download, Calendar, User, Linkedin, Clock } from "lucide-react"

interface ResourceListItemProps {
  resource: ResourceWithTags
}

export function ResourceListItem({ resource }: ResourceListItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const wasUpdated = resource.updated_at && resource.updated_at !== resource.created_at

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side - Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{resource.title}</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {resource.submitted_by}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(resource.date)}
              </span>
            </div>
          </div>

          {wasUpdated && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
              <Clock className="w-3 h-3" />
              Updated {formatDateTime(resource.updated_at)}
            </div>
          )}

          {resource["author/s"] && <div className="text-xs text-gray-500 mb-2">Author/s: {resource["author/s"]}</div>}

          {resource.description && <p className="text-sm text-gray-600 line-clamp-2 mb-2">{resource.description}</p>}

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {resource.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.tag_id}
                  className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${tag.effective_color}20`,
                    color: tag.effective_color,
                    border: `1px solid ${tag.effective_color}40`,
                  }}
                  title={tag.full_path}
                >
                  {tag.tag_name}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">+{resource.tags.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex gap-2 flex-shrink-0">
          {resource.url_link && (
            <a
              href={resource.url_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Visit
            </a>
          )}
          {resource.download_link && (
            <a
              href={resource.download_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              <Download className="w-3 h-3" />
              Download
            </a>
          )}
          {resource.linkedin_profile && (
            <a
              href={resource.linkedin_profile}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Linkedin className="w-3 h-3" />
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
