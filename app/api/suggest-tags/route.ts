import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
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

    // Generate tag suggestions using AI
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: TagSuggestionSchema,
      system: `You are an expert content analyst specializing in academic and research resource categorization. 

Your task is to analyze resource content and suggest the most relevant tags from the available taxonomy.

AVAILABLE TAGS:
${availableTags.map((tag) => `- "${tag.name}" (${tag.category} > ${tag.subcategory})`).join("\n")}

INSTRUCTIONS:
1. Analyze the provided resource content carefully
2. Suggest only tags that exist in the available taxonomy (use exact tag names)
3. Focus on the most relevant and specific tags
4. Provide confidence scores based on relevance
5. Limit suggestions to 5-8 most relevant tags
6. Consider academic disciplines, research methods, geographic regions, and content types
7. Prioritize tags with confidence > 0.6

Be precise and only suggest tags that truly match the content.`,
      prompt: `Analyze this resource and suggest relevant tags:

${contentToAnalyze}

Suggest the most relevant tags from the available taxonomy, focusing on high-confidence matches.`,
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
    })
  } catch (error) {
    console.error("Error generating tag suggestions:", error)
    return NextResponse.json(
      {
        error: "Failed to generate tag suggestions",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestions: [],
      },
      { status: 500 },
    )
  }
}
