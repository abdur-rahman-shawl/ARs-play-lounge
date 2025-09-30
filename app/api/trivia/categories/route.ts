import { NextResponse } from "next/server";

const OPENTDB_CATEGORIES_ENDPOINT = process.env.OPENTDB_CATEGORIES_URL ?? "https://opentdb.com/api_category.php";

export async function GET() {
  try {
    const response = await fetch(OPENTDB_CATEGORIES_ENDPOINT, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Trivia categories request failed with status ${response.status}` },
        { status: 502 },
      );
    }

    const payload = await response.json();
    const categories = Array.isArray(payload.trivia_categories) ? payload.trivia_categories : [];

    return NextResponse.json({ categories }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to fetch trivia categories", error);
    return NextResponse.json({ error: "Unable to load trivia categories." }, { status: 500 });
  }
}