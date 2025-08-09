import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { xai } from "@ai-sdk/xai"
import { z } from "zod"
import { sql } from "@/lib/db"

const TagSuggestionSchema = z.object({
  suggestedTags: z
    .array(
      z.object({
        tagName: z.string().describe("The exact name of the tag as it appears in the taxonomy"),
        confidence: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
        reasoning: z.string().describe("Brief explanation of why this tag is relevant"),
      }),
    )
    .describe("Array of suggested tags with confidence scores"),
})

export async function POST(request: NextRequest) {
  try {
    const { title, description, submitted_by, url_link } = await request.json()

    // Check if we have the required API key
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        {
          error: "AI service not configured. Please set up the XAI_API_KEY environment variable.",
          suggestions: [],
        },
        { status: 500 },
      )
    }

    // Get all available tags from the hierarchy
    const hierarchyData = await sql`
      SELECT * FROM complete_tag_hierarchy 
      WHERE tag_id IS NOT NULL
      ORDER BY category_name, sub_category_name, tag_name
    `

    // Build a flat list of available tags for the AI to choose from
    const availableTags = hierarchyData.map((row) => ({
      id: row.tag_id,
      name: row.tag_name,
      category: row.category_name,
      subcategory: row.sub_category_name,
      fullPath: row.full_path,
    }))

    if (availableTags.length === 0) {
      return NextResponse.json({
        error: "No tags available in the system",
        suggestions: [],
      })
    }

    // Create the content string for analysis
    const contentToAnalyze = [
      title && `Title: ${title}`,
      description && `Description: ${description}`,
      submitted_by && `Submitted by: ${submitted_by}`,
      url_link && `URL: ${url_link}`,
    ]
      .filter(Boolean)
      .join("\n\n")

    if (!contentToAnalyze.trim()) {
      return NextResponse.json({
        error: "No content provided for analysis",
        suggestions: [],
      })
    }

    // Generate tag suggestions using xAI (Grok)
    const { object } = await generateObject({
      model: xai("grok-3"),
      schema: TagSuggestionSchema,
      system: `You are an expert content analyst specializing in academic and research resource categorization, particularly in aging, health, and technology research. 

Your task is to analyze resource content and suggest the most relevant tags from the available taxonomy.

AVAILABLE TAGS:
${availableTags.map((tag) => `- "${tag.name}" (${tag.category} > ${tag.subcategory})`).join("\n")}

INSTRUCTIONS:
1. Analyze the provided resource content carefully
2. Suggest only tags that exist in the available taxonomy (use exact tag names)
3. Focus on the most relevant and specific tags
4. Provide confidence scores based on relevance (0.0 to 1.0)
5. Limit suggestions to 5-8 most relevant tags
6. Consider academic disciplines, research methods, geographic regions, and content types
7. Prioritize tags with confidence > 0.6
8. Pay special attention to aging, health, technology, and geographic context

Be precise and only suggest tags that truly match the content. Focus on academic and research relevance.`,
      prompt: `Analyze this resource and suggest relevant tags:

${contentToAnalyze}

Suggest the most relevant tags from the available taxonomy, focusing on high-confidence matches that would help researchers find this resource.`,
    })

    // Filter suggestions by confidence and validate tag existence
    const validSuggestions = object.suggestedTags
      .filter((suggestion) => suggestion.confidence >= 0.6)
      .filter((suggestion) => availableTags.some((tag) => tag.name.toLowerCase() === suggestion.tagName.toLowerCase()))
      .map((suggestion) => {
        const matchingTag = availableTags.find((tag) => tag.name.toLowerCase() === suggestion.tagName.toLowerCase())
        return {
          ...suggestion,
          tagId: matchingTag?.id,
          tagName: matchingTag?.name, // Use exact name from database
          category: matchingTag?.category,
          subcategory: matchingTag?.subcategory,
        }
      })
      .filter((suggestion) => suggestion.tagId) // Only include valid tag IDs
      .sort((a, b) => b.confidence - a.confidence) // Sort by confidence
      .slice(0, 8) // Limit to top 8 suggestions

    return NextResponse.json({
      suggestions: validSuggestions,
      totalAvailableTags: availableTags.length,
      analysedContent: {
        hasTitle: !!title,
        hasDescription: !!description,
        hasSubmitter: !!submitted_by,
        hasUrl: !!url_link,
      },
      aiModel: "grok-3",
    })
  } catch (error) {
    console.error("Error generating tag suggestions:", error)

    // Provide more specific error messages
    let errorMessage = "Failed to generate tag suggestions"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "AI service authentication failed. Please check API key configuration."
        statusCode = 401
      } else if (error.message.includes("rate limit")) {
        errorMessage = "AI service rate limit exceeded. Please try again in a moment."
        statusCode = 429
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Network error connecting to AI service. Please try again."
        statusCode = 503
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        suggestions: [],
      },
      { status: statusCode },
    )
  }
}
