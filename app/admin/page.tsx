"use client"

import { useState } from "react"
import { Label, Input, Button } from "@alibaba-cloud/antd"

const AdminPage = () => {
  const [formData, setFormData] = useState({
    dateSubmitted: "",
    title: "",
    author: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const response = await fetch("/api/resource", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateSubmitted: formData.dateSubmitted,
        title: formData.title,
        author: formData.author,
      }),
    })
    const result = await response.json()
    console.log(result)
  }

  const handleEdit = (resource) => {
    setFormData({
      dateSubmitted: resource.dateSubmitted || "",
      title: resource.title || "",
      author: resource.author || "",
    })
  }

  const resetForm = () => {
    setFormData({
      dateSubmitted: "",
      title: "",
      author: "",
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="dateSubmitted">Date Submitted</Label>
          <Input
            id="dateSubmitted"
            name="dateSubmitted"
            value={formData.dateSubmitted}
            onChange={handleInputChange}
            placeholder="Enter date submitted"
          />
        </div>
        <div>
          <Label htmlFor="author">Author/s</Label>
          <Input
            id="author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            placeholder="Enter author name(s)"
          />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter title"
          />
        </div>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
        <Button onClick={resetForm}>Reset</Button>
      </form>
    </div>
  )
}

export default AdminPage
