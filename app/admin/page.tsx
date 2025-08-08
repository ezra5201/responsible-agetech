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
import { ThreeLevelTagSelector } from '@/components/three-level-tag-selector'

export default function AdminPage() {
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceWithTags | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [tagHierarchy, setTagHierarchy] = useState<any>({})

  useEffect(() => {
    fetchResources()
    fetchTags()
  }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/resources')
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error('Server returned non-JSON response')
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setResources(data)
      } else {
        console.error('API returned non-array data:', data)
        setResources([])
        setError('Invalid data format received from server')
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch resources')
      setResources([]) // Ensure resources is always an array
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.flat && Array.isArray(data.flat)) {
        setTags(data.flat)
        setTagHierarchy(data.hierarchy || {})
      } else {
        setTags([])
        setTagHierarchy({})
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
      setTags([])
      setTagHierarchy({})
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
        linkedin_profile: formData.get('linkedin_profile'),
        tagIds: formData.getAll('tags').map(id => parseInt(id as string))
      }

      const url = editingResource 
        ? `/api/resources/${editingResource.id}`
        : '/api/resources'
      
      const method = editingResource ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setIsResourceDialogOpen(false)
      setEditingResource(null)
      fetchResources()
    } catch (error) {
      console.error('Error saving resource:', error)
      alert('Failed to save resource. Please try again.')
    }
  }

  const handleResourceDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      const response = await fetch(`/api/resources/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      fetchResources()
    } catch (error) {
      console.error('Error deleting resource:', error)
      alert('Failed to delete resource. Please try again.')
    }
  }

  const handleTagSubmit = async (formData: FormData) => {
    try {
      const data = {
        name: formData.get('name'),
        color: formData.get('color')
      }

      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Remove this line: setIsTagDialogOpen(false)
      
      // Clear the form after successful submission
      const form = document.querySelector('form[action="handleTagSubmit"]') as HTMLFormElement
      if (form) {
        form.reset()
      }
      
      fetchTags()
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Failed to create tag. Please try again.')
    }
  }

  const handleQuickTagAdd = async () => {
    if (!newTagName.trim()) return
    
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor })
      })
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
  
      setNewTagName('')
      setNewTagColor('#3B82F6')
      setIsAddingTag(false)
      fetchTags() // Refresh the tags list
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Failed to create tag. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading admin panel...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Admin Panel</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null)
                fetchResources()
                fetchTags()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
            <div className="mt-4 text-sm text-red-500">
              <p>Make sure you have:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Set up the DATABASE_URL environment variable</li>
                <li>Run the database setup scripts</li>
                <li>Deployed to a platform that supports server-side functions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
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
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tag Management</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Add New Tag Form */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Add New Tag</h3>
                    <form action={handleTagSubmit} className="space-y-4" key={tags.length}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tag-name">Tag Name</Label>
                          <Input id="tag-name" name="name" required />
                        </div>
                        <div>
                          <Label htmlFor="tag-color">Color</Label>
                          <Input id="tag-color" name="color" type="color" defaultValue="#3B82F6" />
                        </div>
                      </div>
                      <Button type="submit">Create Tag</Button>
                    </form>
                  </div>
                  
                  {/* Hierarchical Tag Display */}
                  <div>
                    <h3 className="font-medium mb-3">All Tags ({tags.length} total)</h3>
                    <ThreeLevelTagSelector
                      hierarchy={tagHierarchy}
                      selectedTags={[]}
                      onTagChange={() => {}} // Read-only display
                    />
                    
                    {Object.keys(tagHierarchy).length === 0 && (
                      <p className="text-gray-500 text-sm">No tags created yet.</p>
                    )}
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
                    <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
                    <Input 
                      id="linkedin_profile" 
                      name="linkedin_profile" 
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      defaultValue={editingResource?.linkedin_profile || ''}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Tags</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingTag(!isAddingTag)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Tag
                      </Button>
                    </div>
                    
                    {isAddingTag && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md border">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label htmlFor="quick-tag-name" className="text-xs">Tag Name</Label>
                            <Input
                              id="quick-tag-name"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              placeholder="Enter tag name"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quick-tag-color" className="text-xs">Color</Label>
                            <Input
                              id="quick-tag-color"
                              type="color"
                              value={newTagColor}
                              onChange={(e) => setNewTagColor(e.target.value)}
                              className="h-8 w-16"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleQuickTagAdd}
                            disabled={!newTagName.trim()}
                            className="h-8"
                          >
                            Add
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAddingTag(false)
                              setNewTagName('')
                              setNewTagColor('#3B82F6')
                            }}
                            className="h-8"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="max-h-96 overflow-y-auto">
                      <ThreeLevelTagSelector
                        hierarchy={tagHierarchy}
                        defaultValues={editingResource?.tags?.map(t => t.id) || []}
                      />
                    </div>
                    
                    {Object.keys(tagHierarchy).length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        No tags available. Create your first tag using the "Add Tag" button above.
                      </p>
                    )}
                  </div>
                  
                  <Button type="submit">
                    {editingResource ? 'Update Resource' : 'Create Resource'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Resources Grid */}
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

        {resources.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first resource!</p>
              <Button onClick={() => setIsResourceDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Resource
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
