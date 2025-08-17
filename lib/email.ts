import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function createAWSSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string,
  region: string,
  service = "ses",
) {
  const accessKey = process.env.AWS_ACCESS_KEY_ID!
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY!

  // Simple AWS signature v4 implementation for SES
  const date =
    new Date()
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, "")
      .slice(0, 15) + "Z"
  const dateStamp = date.slice(0, 8)

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const algorithm = "AWS4-HMAC-SHA256"

  // Create canonical request
  const canonicalHeaders =
    Object.keys(headers)
      .sort()
      .map((key) => `${key.toLowerCase()}:${headers[key]}`)
      .join("\n") + "\n"

  const signedHeaders = Object.keys(headers)
    .sort()
    .map((key) => key.toLowerCase())
    .join(";")

  const payloadHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body)).then((buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  )

  const canonicalRequest = [method, "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n")

  const stringToSign = [
    algorithm,
    date,
    credentialScope,
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalRequest)).then((buffer) =>
      Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    ),
  ].join("\n")

  // Create signing key
  const kDate = await crypto.subtle
    .importKey("raw", new TextEncoder().encode(`AWS4${secretKey}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((key) => crypto.subtle.sign("HMAC", key, new TextEncoder().encode(dateStamp)))

  const kRegion = await crypto.subtle
    .importKey("raw", kDate, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((key) => crypto.subtle.sign("HMAC", key, new TextEncoder().encode(region)))

  const kService = await crypto.subtle
    .importKey("raw", kRegion, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((key) => crypto.subtle.sign("HMAC", key, new TextEncoder().encode(service)))

  const kSigning = await crypto.subtle
    .importKey("raw", kService, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((key) => crypto.subtle.sign("HMAC", key, new TextEncoder().encode("aws4_request")))

  const signature = await crypto.subtle
    .importKey("raw", kSigning, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((key) => crypto.subtle.sign("HMAC", key, new TextEncoder().encode(stringToSign)))
    .then((buffer) =>
      Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    )

  return `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

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
    console.log("[v0] Checking AWS SES credentials...")
    console.log("[v0] AWS_ACCESS_KEY_ID exists:", !!process.env.AWS_ACCESS_KEY_ID)
    console.log("[v0] AWS_SECRET_ACCESS_KEY exists:", !!process.env.AWS_SECRET_ACCESS_KEY)
    console.log("[v0] AWS_REGION exists:", !!process.env.AWS_REGION)
    console.log("[v0] SHARED_MAILBOX_EMAIL exists:", !!process.env.SHARED_MAILBOX_EMAIL)

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      console.log("[v0] AWS SES credentials not configured, skipping notifications")
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

    const region = process.env.AWS_REGION!
    const fromEmail =
      process.env.AWS_SES_FROM_EMAIL || process.env.SHARED_MAILBOX_EMAIL || "notifications@yourdomain.com"

    const sesEndpoint = `https://email.${region}.amazonaws.com/`
    const date =
      new Date()
        .toISOString()
        .replace(/[:-]|\.\d{3}/g, "")
        .slice(0, 15) + "Z"

    const emailParams = {
      Source: fromEmail,
      Destination: {
        ToAddresses: recipients.map((r) => r.email),
      },
      Message: {
        Subject: {
          Data: `New Resource Submission - ${resourceData.title}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: emailHtml,
            Charset: "UTF-8",
          },
        },
      },
    }

    const body = new URLSearchParams({
      Action: "SendEmail",
      Version: "2010-12-01",
      ...Object.fromEntries(
        Object.entries(emailParams)
          .flatMap(([key, value]) =>
            typeof value === "object"
              ? Object.entries(value)
                  .map(([subKey, subValue]) => [
                    `${key}.${subKey}`,
                    typeof subValue === "object"
                      ? Object.entries(subValue)
                          .map(([subSubKey, subSubValue]) => [
                            `${key}.${subKey}.${subSubKey}`,
                            Array.isArray(subSubValue)
                              ? subSubValue.map((item, index) => [
                                  `${key}.${subKey}.${subSubKey}.member.${index + 1}`,
                                  item,
                                ])
                              : [[`${key}.${subKey}.${subSubKey}`, subSubValue]],
                          ])
                          .flat(2)
                      : [[`${key}.${subKey}`, subValue]],
                  ])
                  .flat(2)
              : [[key, value]],
          )
          .flat(2),
      ),
    }).toString()

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Amz-Date": date,
      Host: `email.${region}.amazonaws.com`,
    }

    const authorization = await createAWSSignature("POST", sesEndpoint, headers, body, region)
    headers["Authorization"] = authorization

    const response = await fetch(sesEndpoint, {
      method: "POST",
      headers,
      body,
    })

    if (response.ok) {
      const result = await response.text()
      console.log(`[v0] Email notifications sent successfully via AWS SES to ${recipients.length} recipient(s)`)
      console.log("[v0] SES Response:", result)
    } else {
      const error = await response.text()
      console.error("[v0] Failed to send email via AWS SES:", error)

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
