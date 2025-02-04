import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import Admin from "@/models/Admin";

export async function GET(req, { params }) {
  try {
    await connectToDatabase();

    const { id } = params; // Extract the id properly

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let relatedModel = null;
    if (user.role === "Doctor") {
      relatedModel = await Doctor.findById(user.doctor);
    } else if (user.role === "Patient") {
      relatedModel = await Patient.findById(user.patient);
    } else if (user.role === "Admin") {
      relatedModel = await Admin.findById(user.admin);
    }

    return NextResponse.json({ user, relatedModel }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
  try {
    await connectToDatabase();

    const suspendedUser = await User.findByIdAndUpdate(
      params.id,
      { status: "Suspended" },
      { new: true }
    );

    if (!suspendedUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(
      { message: "User suspended successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to suspend user" },
      { status: 500 }
    );
  }
}
