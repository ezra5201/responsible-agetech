'use client'

import { useState, useEffect } from 'react'
import { ResourceWithTags, Tag } from '@/lib/db'
import { ResourceCard } from '@/components/resource-card'
import { Plus, TagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

export default function AdminPage() {
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceWithTags | null>(null)

  useEffect(() => {
    fetchResources()
    fetchTags()
  }, [])

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources')
      const data = await response.json()
      setResources(data)
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      const data = await response.json()
      setTags(data)
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleResourceSubmit = async (formData: FormData) => {
    try {
      const data = {
        submitted_by: formData.get('submitted_by'),
        date: formData.get('date'),
        title: formData.get('title'),
        description: formData.get('description'),
        url_link: formData.get('url_link'),
        download_link: formData.get('download_link'),
        tagIds: formData.getAll('tags').map(id => parseInt(id as string))
      }

      const url = editingResource 
        ? `/api/resources/${editingResource.id}`
        : '/api/resources'
      
      const method = editingResource ? 'PUT' : 'POST'

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      setIsResourceDialogOpen(false)
      setEditingResource(null)
      fetchResources()
    } catch (error) {
      console.error('Error saving resource:', error)
    }
  }

  const handleResourceDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      await fetch(`/api/resources/${id}`, { method: 'DELETE' })
      fetchResources()
    } catch (error) {
      console.error('Error deleting resource:', error)
    }
  }

  const handleTagSubmit = async (formData: FormData) => {
    try {
      const data = {
        name: formData.get('name'),
        color: formData.get('color')
      }

      await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      setIsTagDialogOpen(false)
      fetchTags()
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resource Management</h1>
          <div className="flex gap-4">
            <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <TagIcon className="w-4 h-4 mr-2" />
                  Manage Tags
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Tag</DialogTitle>
                </DialogHeader>
                <form action={handleTagSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="tag-name">Tag Name</Label>
                    <Input id="tag-name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="tag-color">Color</Label>
                    <Input id="tag-color" name="color" type="color" defaultValue="#3B82F6" />
                  </div>
                  <Button type="submit">Create Tag</Button>
                </form>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Existing Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: `${tag.color}20`, 
                          color: tag.color,
                          border: `1px solid ${tag.color}40`
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingResource(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingResource ? 'Edit Resource' : 'Add New Resource'}
                  </DialogTitle>
                </DialogHeader>
                <form action={handleResourceSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="submitted_by">Submitted By</Label>
                      <Input 
                        id="submitted_by" 
                        name="submitted_by" 
                        defaultValue={editingResource?.submitted_by}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input 
                        id="date" 
                        name="date" 
                        type="date" 
                        defaultValue={editingResource?.date}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      defaultValue={editingResource?.title}
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      defaultValue={editingResource?.description || ''}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="url_link">URL Link</Label>
                      <Input 
                        id="url_link" 
                        name="url_link" 
                        type="url"
                        defaultValue={editingResource?.url_link || ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="download_link">Download Link</Label>
                      <Input 
                        id="download_link" 
                        name="download_link" 
                        type="url"
                        defaultValue={editingResource?.download_link || ''}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tags</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`tag-${tag.id}`}
                            name="tags"
                            value={tag.id}
                            defaultChecked={editingResource?.tags?.some(t => t.id === tag.id)}
                          />
                          <Label 
                            htmlFor={`tag-${tag.id}`}
                            className="text-sm"
                            style={{ color: tag.color }}
                          >
                            {tag.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button type="submit">
                    {editingResource ? 'Update Resource' : 'Create Resource'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              showActions={true}
              onEdit={(resource) => {
                setEditingResource(resource)
                setIsResourceDialogOpen(true)
              }}
              onDelete={handleResourceDelete}
            />
          ))}
        </div>

        {resources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No resources yet. Add your first resource!</p>
          </div>
        )}
      </div>
    </div>
  )
}
