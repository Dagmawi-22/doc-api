import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";

export const runtime = "nodejs";
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return new NextResponse(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    await connectToDatabase();

    // Try to find the user by username, phone, or email
    const user = await User.findOne({
      $or: [
        { username },
        { phone: username }, // If username is a phone number
        { email: username }, // If username is an email
      ],
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid credentials" }),
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid credentials" }),
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // Fetch the related model (Patient or Doctor)
    let relatedModel;
    if (user.role === "Doctor") {
      relatedModel = await Doctor.findById(user.doctor);
    } else if (user.role === "Patient") {
      relatedModel = await Patient.findById(user.patient);
    }

    // Create the JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return the user, related model, and token in the response
    const responseData = {
      token,
      user,
      role: user.role,
      relatedModel,
    };

    return new NextResponse(
      JSON.stringify({ message: "Login successful", data: responseData }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
