import type React from "react"
import type { Resource } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ResourceCardProps {
  resource: Resource
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{resource.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {resource.author && (
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">Author(s):</span> {resource.author}
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
        {/* Additional content can be added here */}
      </CardContent>
    </Card>
  )
}

export default ResourceCard
