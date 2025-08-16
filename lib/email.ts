import nodemailer from "nodemailer"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Create transporter for Outlook SMTP
const transporter = nodemailer.createTransporter({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

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
    // Get all active reviewers with notifications enabled
    const reviewers = await sql`
      SELECT name, email 
      FROM reviewers 
      WHERE is_active = true AND notification_enabled = true
    `

    if (reviewers.length === 0) {
      console.log("[v0] No active reviewers found for notifications")
      return
    }

    // Create email content
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

    // Send email to all active reviewers
    const emailPromises = reviewers.map((reviewer) =>
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: reviewer.email,
        subject: `New Resource Submission - ${resourceData.title}`,
        html: emailHtml,
      }),
    )

    await Promise.all(emailPromises)
    console.log(`[v0] Email notifications sent to ${reviewers.length} reviewers`)
  } catch (error) {
    console.error("[v0] Failed to send email notifications:", error)
    // Don't throw error - email failure shouldn't break submission
  }
}
