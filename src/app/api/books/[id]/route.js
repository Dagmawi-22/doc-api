import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Book from "@/models/Book";

function addCorsHeaders(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return res;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return addCorsHeaders(
    new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  );
}

export async function GET(_, { params }) {
  try {
    await connectToDatabase();
    const book = await Book.findById(params.id);
    if (!book)
      return addCorsHeaders(
        NextResponse.json({ error: "Book not found" }, { status: 404 })
      );
    return addCorsHeaders(NextResponse.json(book, { status: 200 }));
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Failed to fetch book" }, { status: 500 })
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const updateData = await req.json();
    await connectToDatabase();
    const updatedBook = await Book.findByIdAndUpdate(params.id, updateData, {
      new: true,
    });
    if (!updatedBook)
      return addCorsHeaders(
        NextResponse.json({ error: "Book not found" }, { status: 404 })
      );
    return addCorsHeaders(NextResponse.json(updatedBook, { status: 200 }));
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Failed to update book" }, { status: 500 })
    );
  }
}

export async function DELETE(_, { params }) {
  try {
    await connectToDatabase();
    const deletedBook = await Book.findByIdAndDelete(params.id);
    if (!deletedBook)
      return addCorsHeaders(
        NextResponse.json({ error: "Book not found" }, { status: 404 })
      );
    return addCorsHeaders(
      NextResponse.json(
        { message: "Book deleted successfully" },
        { status: 200 }
      )
    );
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Failed to delete book" }, { status: 500 })
    );
  }
}
