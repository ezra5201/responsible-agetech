"use client"

import { useState } from "react"
import type { ResourceWithTags } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ExternalLink, Download, Linkedin, Calendar, User } from "lucide-react"

interface ResourceCardProps {
  resource: ResourceWithTags
  showActions?: boolean
  onEdit?: (resource: ResourceWithTags) => void
  onDelete?: (id: number) => void
}

export function ResourceCard({ resource, showActions = false, onEdit, onDelete }: ResourceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(resource.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header with actions */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{resource.title}</h3>

          {/* Metadata */}
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Submitted: {formatDate(resource.date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>By: {resource.submitted_by}</span>
            </div>

            {resource.author && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Author: {resource.author}</span>
              </div>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={() => onEdit?.(resource)} className="h-8 w-8 p-0">
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Description */}
      {resource.description && <p className="text-gray-700 text-sm mb-4 line-clamp-3">{resource.description}</p>}

      {/* Tags */}
      {resource.tags && resource.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <span
                key={tag.tag_id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-2">
        {resource.url_link && (
          <Button variant="outline" size="sm" asChild className="text-blue-600 hover:text-blue-700 bg-transparent">
            <a href={resource.url_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1" />
              View
            </a>
          </Button>
        )}

        {resource.download_link && (
          <Button variant="outline" size="sm" asChild className="text-green-600 hover:text-green-700 bg-transparent">
            <a href={resource.download_link} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-1" />
              Download
            </a>
          </Button>
        )}

        {resource.linkedin_profile && (
          <Button variant="outline" size="sm" asChild className="text-blue-700 hover:text-blue-800 bg-transparent">
            <a href={resource.linkedin_profile} target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4 mr-1" />
              LinkedIn
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
