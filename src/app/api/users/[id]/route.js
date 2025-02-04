import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";

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

// Get user and related model (Patient or Doctor) by ID
export async function GET(_, { params }) {
  try {
    await connectToDatabase();

    // Fetch the user
    const user = await User.findById(params.id);
    if (!user)
      return addCorsHeaders(
        NextResponse.json({ error: "User not found" }, { status: 404 })
      );

    // Fetch related model (Patient or Doctor)
    let relatedModel;
    if (user.role === "Doctor") {
      relatedModel = await Doctor.findById(user.doctor);
    } else if (user.role === "Patient") {
      relatedModel = await Patient.findById(user.patient);
    }

    return addCorsHeaders(
      NextResponse.json({ user, relatedModel }, { status: 200 })
    );
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    );
  }
}

// Update user and related model (Patient or Doctor)
export async function PUT(req, { params }) {
  try {
    const updateData = await req.json();
    await connectToDatabase();

    // Find the user and related model (Patient or Doctor)
    const user = await User.findById(params.id);
    if (!user)
      return addCorsHeaders(
        NextResponse.json({ error: "User not found" }, { status: 404 })
      );

    let relatedModel;
    if (user.role === "Doctor") {
      relatedModel = await Doctor.findById(user.doctor);
    } else if (user.role === "Patient") {
      relatedModel = await Patient.findById(user.patient);
    }

    // Update user and related model
    await User.findByIdAndUpdate(params.id, updateData, { new: true });
    if (user.role === "Doctor" && relatedModel) {
      await Doctor.findByIdAndUpdate(user.doctor, updateData, { new: true });
    } else if (user.role === "Patient" && relatedModel) {
      await Patient.findByIdAndUpdate(user.patient, updateData, { new: true });
    }

    return addCorsHeaders(
      NextResponse.json({ user, relatedModel }, { status: 200 })
    );
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    );
  }
}

// Mark user and related model (Patient or Doctor) as suspended
export async function DELETE(_, { params }) {
  try {
    await connectToDatabase();

    // Find the user
    const user = await User.findById(params.id);
    if (!user)
      return addCorsHeaders(
        NextResponse.json({ error: "User not found" }, { status: 404 })
      );

    // Update user status to "Suspended"
    await User.findByIdAndUpdate(
      params.id,
      { status: "Suspended" },
      { new: true }
    );

    // Find and update related model based on user role to "Suspended"
    let relatedModel;
    if (user.role === "Doctor") {
      relatedModel = await Doctor.findById(user.doctor);
      if (relatedModel) {
        await Doctor.findByIdAndUpdate(user.doctor, { status: "Suspended" });
      }
    } else if (user.role === "Patient") {
      relatedModel = await Patient.findById(user.patient);
      if (relatedModel) {
        await Patient.findByIdAndUpdate(user.patient, { status: "Suspended" });
      }
    }

    return addCorsHeaders(
      NextResponse.json(
        { message: "User and related model suspended successfully" },
        { status: 200 }
      )
    );
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Failed to suspend user" }, { status: 500 })
    );
  }
}
