import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function sendResourceSubmissionNotification(resourceData: {
  id: number
  title: string
  description: string
  author: string
  url_link?: string
  download_link?: string
  submitted_by: string
  submitter_email: string
  linkedin_profile?: string
}) {
  try {
    console.log("[v0] Checking email credentials...")
    console.log("[v0] EMAIL_USER exists:", !!process.env.EMAIL_USER)
    console.log("[v0] EMAIL_PASS exists:", !!process.env.EMAIL_PASS)
    console.log("[v0] SHARED_MAILBOX_EMAIL exists:", !!process.env.SHARED_MAILBOX_EMAIL)

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("[v0] Email credentials not configured, skipping notifications")
      return
    }

    const sharedMailbox = process.env.SHARED_MAILBOX_EMAIL

    let recipients = []

    if (sharedMailbox) {
      recipients = [{ name: "Review Team", email: sharedMailbox }]
      console.log("[v0] Using shared mailbox for notifications")
    } else {
      const reviewers = await sql`
        SELECT name, email 
        FROM reviewers 
        WHERE is_active = true AND notification_enabled = true
      `
      recipients = reviewers
      console.log("[v0] Using individual reviewer notifications")
    }

    if (recipients.length === 0) {
      console.log("[v0] No recipients found for notifications")
      return
    }

    const emailHtml = `
      <h2>New Resource Submission</h2>
      <p>A new resource has been submitted and is awaiting review.</p>
      
      <h3>Resource Details:</h3>
      <ul>
        <li><strong>Title:</strong> ${resourceData.title}</li>
        <li><strong>Author(s):</strong> ${resourceData.author}</li>
        <li><strong>Description:</strong> ${resourceData.description}</li>
        ${resourceData.url_link ? `<li><strong>URL:</strong> <a href="${resourceData.url_link}">${resourceData.url_link}</a></li>` : ""}
        ${resourceData.download_link ? `<li><strong>Download:</strong> <a href="${resourceData.download_link}">${resourceData.download_link}</a></li>` : ""}
      </ul>
      
      <h3>Submitter Information:</h3>
      <ul>
        <li><strong>Name:</strong> ${resourceData.submitted_by}</li>
        <li><strong>Email:</strong> ${resourceData.submitter_email}</li>
        ${resourceData.linkedin_profile ? `<li><strong>LinkedIn:</strong> <a href="${resourceData.linkedin_profile}">${resourceData.linkedin_profile}</a></li>` : ""}
      </ul>
      
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin">Review in Admin Panel</a></p>
      
      <p><em>Submitted at: ${new Date().toLocaleString()}</em></p>
    `

    // Use Resend API for serverless-compatible email sending
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Resource Notifications <notifications@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
        to: recipients.map((r) => r.email),
        subject: `New Resource Submission - ${resourceData.title}`,
        html: emailHtml,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`[v0] Email notifications sent successfully to ${recipients.length} recipient(s)`)
      console.log("[v0] Email ID:", result.id)
    } else {
      const error = await response.text()
      console.error("[v0] Failed to send email via Resend:", error)

      // Fallback: Log the notification details for manual processing
      console.log("[v0] Email notification details (for manual processing):")
      console.log("[v0] Recipients:", recipients.map((r) => r.email).join(", "))
      console.log("[v0] Subject:", `New Resource Submission - ${resourceData.title}`)
      console.log("[v0] Resource ID:", resourceData.id)
    }
  } catch (error) {
    console.error("[v0] Failed to send email notifications:", error)
    // Don't throw error - email failure shouldn't break submission
  }
}
