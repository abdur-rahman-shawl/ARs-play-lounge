import { NextRequest, NextResponse } from "next/server";
import he from "he";

type ApiQuestion = {
  category: string;
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

type ApiResponse = {
  response_code: number;
  results: ApiQuestion[];
};

const OPENTDB_ENDPOINT = process.env.OPENTDB_BASE_URL ?? "https://opentdb.com/api.php";
const DEFAULT_AMOUNT = 10;
const MAX_AMOUNT = 50;

const clampAmount = (value: number) => {
  if (Number.isNaN(value) || value <= 0) return DEFAULT_AMOUNT;
  return Math.min(value, MAX_AMOUNT);
};

const shuffle = <T,>(input: readonly T[]) => {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const decode = (value: string) => he.decode(value);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const amount = clampAmount(Number(url.searchParams.get("amount") ?? DEFAULT_AMOUNT));
  const difficulty = url.searchParams.get("difficulty");
  const type = url.searchParams.get("type");
  const category = url.searchParams.get("category");

  const apiUrl = new URL(OPENTDB_ENDPOINT);
  apiUrl.searchParams.set("amount", String(amount));

  if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
    apiUrl.searchParams.set("difficulty", difficulty);
  }

  if (type && ["multiple", "boolean"].includes(type)) {
    apiUrl.searchParams.set("type", type);
  }

  if (category) {
    const parsedCategory = Number(category);
    if (!Number.isNaN(parsedCategory) && parsedCategory > 0) {
      apiUrl.searchParams.set("category", String(parsedCategory));
    }
  }

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Trivia source returned ${response.status}` },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as ApiResponse;

    if (payload.response_code !== 0) {
      return NextResponse.json(
        { error: "No trivia questions available for the requested settings." },
        { status: 404 },
      );
    }

    const questions = payload.results.map((item) => {
      const correctAnswer = decode(item.correct_answer);
      const incorrectAnswers = item.incorrect_answers.map(decode);
      const options = shuffle([correctAnswer, ...incorrectAnswers]);

      return {
        id: crypto.randomUUID(),
        category: decode(item.category),
        type: item.type,
        difficulty: item.difficulty,
        question: decode(item.question),
        correctAnswer,
        options,
      };
    });

    return NextResponse.json({ questions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to fetch trivia questions", error);
    return NextResponse.json({ error: "Unable to load trivia questions." }, { status: 500 });
  }
}