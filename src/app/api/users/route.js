import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Book from "@/models/Book";
import { authGuard } from "@/app/middleware/auth";

// Function to add CORS headers
function addCorsHeaders(res) {
  res.headers.set("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Allow GET, POST, and OPTIONS methods
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  ); // Allow specific headers
  return res;
}

async function getBooksHandler(req) {
  try {
    await connectToDatabase();
    const books = await Book.find({});
    const response = NextResponse.json(books, { status: 200 });
    return addCorsHeaders(response); // Add CORS headers
  } catch (error) {
    const response = NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
    return addCorsHeaders(response); // Add CORS headers
  }
}

export const GET = authGuard(getBooksHandler);

async function postBookHandler(req) {
  try {

    const bodyText = await req.text();
    if (!bodyText) {
      const response = NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
      return addCorsHeaders(response); // Add CORS headers
    }

    const data = JSON.parse(bodyText);

    const { title, author, genre, publishedYear } = data;
    if (!title || !author) {
      const response = NextResponse.json(
        { error: "Title and Author are required" },
        { status: 422 }
      );
      return addCorsHeaders(response);
    }

    await connectToDatabase();
    const newBook = new Book({ title, author, genre, publishedYear });
    await newBook.save();

    const response = NextResponse.json(newBook, { status: 201 });
    return addCorsHeaders(response);
  } catch (error) {
    const response = NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

export const POST = authGuard(postBookHandler);

// Handle OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
