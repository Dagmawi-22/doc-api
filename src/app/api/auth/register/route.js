import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    // Parse incoming request
    const {
      email,
      phone,
      password,
      role,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      specialization,
      licenseNumber,
      experience,
      availability,
      address,
    } = await req.json();

    // Check if required fields are missing
    if (!firstName || !lastName || !password || !role || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Generate a base username
    let baseUsername = `${firstName}${lastName}`
      .replace(/\s+/g, "")
      .toLowerCase();
    let username = baseUsername;
    let counter = 1;

    // Check for existing usernames
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User object
    const user = new User({
      username,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    // Create Doctor or Patient based on role
    let userSpecificRecord;
    if (role === "Doctor") {
      if (!specialization || !licenseNumber || !experience || !availability) {
        return NextResponse.json(
          { error: "Missing Doctor fields" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check for duplicate license number
      const existingDoctor = await Doctor.findOne({ licenseNumber });
      if (existingDoctor) {
        return NextResponse.json(
          { error: "Doctor with this license number already exists" },
          { status: 409, headers: corsHeaders }
        );
      }

      userSpecificRecord = new Doctor({
        firstName,
        lastName,
        dateOfBirth,
        gender,
        specialization,
        licenseNumber,
        experience,
        availability,
      });

      await userSpecificRecord.save();
      user.doctor = userSpecificRecord._id;
    } else if (role === "Patient") {
      if (!address) {
        return NextResponse.json(
          { error: "Missing Patient fields" },
          { status: 400, headers: corsHeaders }
        );
      }

      userSpecificRecord = new Patient({
        name: `${firstName} ${lastName}`,
        dateOfBirth,
        gender,
        address,
      });

      await userSpecificRecord.save();
      user.patient = userSpecificRecord._id;
    } else {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Save the user
    await user.save();

    // Send response
    return NextResponse.json(
      {
        message: "User and corresponding record created successfully",
        data: { user, relatedModel: userSpecificRecord },
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
