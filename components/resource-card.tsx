import { ResourceWithTags } from '@/lib/db'
import { resourceStyles, combineStyles } from '@/lib/styles'
import { ExternalLink, Download, Calendar, User, Linkedin, Clock } from 'lucide-react'

interface ResourceCardProps {
  resource: ResourceWithTags
  showActions?: boolean
  onEdit?: (resource: ResourceWithTags) => void
  onDelete?: (id: number) => void
}

export function ResourceCard({ resource, showActions = false, onEdit, onDelete }: ResourceCardProps) {
  const cardClasses = combineStyles(
    resourceStyles.card.background,
    resourceStyles.card.border,
    resourceStyles.card.borderRadius,
    resourceStyles.card.shadow,
    resourceStyles.card.padding,
    resourceStyles.card.transition,
    resourceStyles.card.hover
  )

  const titleClasses = combineStyles(
    resourceStyles.title.size,
    resourceStyles.title.weight,
    resourceStyles.title.color,
    resourceStyles.title.marginBottom
  )

  const descriptionClasses = combineStyles(
    resourceStyles.description.size,
    resourceStyles.description.color,
    resourceStyles.description.marginBottom,
    resourceStyles.description.lineHeight
  )

  const metadataClasses = combineStyles(
    resourceStyles.metadata.size,
    resourceStyles.metadata.color,
    resourceStyles.metadata.marginBottom
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const wasUpdated = resource.updated_at && resource.updated_at !== resource.created_at

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-start mb-3">
        <h3 className={titleClasses}>{resource.title}</h3>
        {showActions && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(resource)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(resource.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className={metadataClasses}>
        <div className="flex items-center gap-4 mb-2">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {resource.submitted_by}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(resource.date)}
          </span>
        </div>
        {wasUpdated && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            Updated {formatDateTime(resource.updated_at)}
          </div>
        )}
      </div>

      {resource.description && (
        <p className={descriptionClasses}>
          {resource.description}
        </p>
      )}

      {resource.tags && resource.tags.length > 0 && (
        <div className="mb-4">
          {resource.tags.map((tag) => (
            <span
              key={tag.tag_id}
              className={combineStyles(
                resourceStyles.tag.padding,
                resourceStyles.tag.borderRadius,
                resourceStyles.tag.size,
                resourceStyles.tag.weight,
                resourceStyles.tag.margin
              )}
              style={{ 
                backgroundColor: `${tag.effective_color}20`, 
                color: tag.effective_color,
                border: `1px solid ${tag.effective_color}40`
              }}
              title={tag.full_path}
            >
              {tag.tag_name}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {resource.url_link && (
          <a
            href={resource.url_link}
            target="_blank"
            rel="noopener noreferrer"
            className={combineStyles(
              resourceStyles.primaryButton.background,
              resourceStyles.primaryButton.text,
              resourceStyles.primaryButton.padding,
              resourceStyles.primaryButton.borderRadius,
              resourceStyles.primaryButton.size,
              resourceStyles.primaryButton.weight,
              resourceStyles.primaryButton.transition,
              'inline-flex items-center gap-2'
            )}
          >
            <ExternalLink className="w-4 h-4" />
            Visit
          </a>
        )}
        {resource.download_link && (
          <a
            href={resource.download_link}
            target="_blank"
            rel="noopener noreferrer"
            className={combineStyles(
              resourceStyles.secondaryButton.background,
              resourceStyles.secondaryButton.text,
              resourceStyles.secondaryButton.padding,
              resourceStyles.secondaryButton.borderRadius,
              resourceStyles.secondaryButton.size,
              resourceStyles.secondaryButton.weight,
              resourceStyles.secondaryButton.transition,
              'inline-flex items-center gap-2'
            )}
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        )}
        {resource.linkedin_profile && (
          <a
            href={resource.linkedin_profile}
            target="_blank"
            rel="noopener noreferrer"
            className={combineStyles(
              'bg-blue-700 hover:bg-blue-800',
              resourceStyles.primaryButton.text,
              resourceStyles.primaryButton.padding,
              resourceStyles.primaryButton.borderRadius,
              resourceStyles.primaryButton.size,
              resourceStyles.primaryButton.weight,
              resourceStyles.primaryButton.transition,
              'inline-flex items-center gap-2'
            )}
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}
