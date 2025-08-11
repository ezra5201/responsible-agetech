"use client"

import type React from "react"

const handleSubmitResource = (event: React.FormEvent) => {
  event.preventDefault()
  // Handle form submission logic here
}

const Page = () => {
  return (
    <form onSubmit={handleSubmitResource} className="space-y-6" id="resource-form">
      {/* rest of code here */}
    </form>
  )
}

export default Page
