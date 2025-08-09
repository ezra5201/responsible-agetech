import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Simple fallback tag suggestion without AI
function generateSimpleTagSuggestions(content: string, availableTags: any[]) {
  const suggestions = []
  const contentLower = content.toLowerCase()

  // Simple keyword matching
  const keywords = [
    { words: ["health", "medical", "healthcare", "clinical"], category: "Health" },
    { words: ["education", "learning", "teaching", "academic"], category: "Education" },
    { words: ["technology", "digital", "tech", "software", "app"], category: "Technology" },
    { words: ["research", "study", "analysis", "investigation"], category: "Research" },
    { words: ["aging", "elderly", "senior", "older adult"], category: "Aging" },
    { words: ["africa", "african", "sub-saharan"], category: "Geography" },
    { words: ["policy", "government", "public"], category: "Policy" },
    { words: ["community", "social", "society"], category: "Social" },
  ]

  for (const tag of availableTags) {
    let confidence = 0
    const tagNameLower = tag.name.toLowerCase()

    // Direct name match
    if (contentLower.includes(tagNameLower)) {
      confidence = 0.9
    }

    // Keyword category matching
    for (const keywordGroup of keywords) {
      if (keywordGroup.words.some((word) => contentLower.includes(word))) {
        if (
          tagNameLower.includes(keywordGroup.category.toLowerCase()) ||
          tag.category.toLowerCase().includes(keywordGroup.category.toLowerCase())
        ) {
          confidence = Math.max(confidence, 0.7)
        }
      }
    }

    // Partial word matching
    const words = contentLower.split(/\s+/)
    for (const word of words) {
      if (word.length > 3 && tagNameLower.includes(word)) {
        confidence = Math.max(confidence, 0.6)
      }
    }

    if (confidence >= 0.6) {
      suggestions.push({
        tagId: tag.id,
        tagName: tag.name,
        confidence: confidence,
        reasoning:
          confidence >= 0.9
            ? "Direct keyword match"
            : confidence >= 0.7
              ? "Category keyword match"
              : "Partial content match",
        category: tag.category,
        subcategory: tag.subcategory,
      })
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 8)
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, submitted_by, url_link } = await request.json()

    // Get all available tags from the hierarchy
    const hierarchyData = await sql`
      SELECT * FROM complete_tag_hierarchy 
      WHERE tag_id IS NOT NULL
      ORDER BY category_name, sub_category_name, tag_name
    `

    // Build a flat list of available tags
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

    // Use simple keyword-based suggestions as fallback
    const suggestions = generateSimpleTagSuggestions(contentToAnalyze, availableTags)

    return NextResponse.json({
      suggestions: suggestions,
      totalAvailableTags: availableTags.length,
      analysedContent: {
        hasTitle: !!title,
        hasDescription: !!description,
        hasSubmitter: !!submitted_by,
        hasUrl: !!url_link,
      },
      aiModel: "keyword-matching", // Indicate this is not AI-powered
      note: "Using keyword-based suggestions. For AI-powered suggestions, configure an AI service.",
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
