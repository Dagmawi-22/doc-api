import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";

const JWT_SECRET = process.env.JWT_SECRET;

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function POST(req) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
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

    if (!firstName || !lastName || !password || !role || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    let baseUsername = `${firstName}${lastName}`
      .replace(/\s+/g, "")
      .toLowerCase();
    let username = baseUsername;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    let userSpecificRecord;
    if (role === "Doctor") {
      if (!specialization || !licenseNumber || !experience || !availability) {
        return NextResponse.json(
          { error: "Missing Doctor fields" },
          { status: 400, headers: corsHeaders }
        );
      }

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

    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return NextResponse.json(
      {
        message: "User and corresponding record created successfully",
        data: {
          user,
          relatedModel: userSpecificRecord,
          token,
        },
      },
      {
        status: 201,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error.message },
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
}
