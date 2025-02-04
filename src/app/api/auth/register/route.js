import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";

export async function POST(req) {
  try {
    // Parse incoming request
    const {
      username,
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
    if (!username || !password || !role || !phone) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ error: "User already exists" }),
        {
          status: 409,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
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
      if (
        !firstName ||
        !lastName ||
        !specialization ||
        !licenseNumber ||
        !experience ||
        !availability
      ) {
        return new NextResponse(
          JSON.stringify({ error: "Missing Doctor fields" }),
          {
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        );
      }

      // Create Doctor record
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

      // Save Doctor record
      await userSpecificRecord.save();

      // Assign doctor reference to the user
      user.doctor = userSpecificRecord._id;
    } else if (role === "Patient") {
      if (!address) {
        return new NextResponse(
          JSON.stringify({ error: "Missing Patient fields" }),
          {
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        );
      }

      // Create Patient record
      userSpecificRecord = new Patient({
        name: `${firstName} ${lastName}`,
        dateOfBirth,
        gender,
        address,
      });

      // Save Patient record
      await userSpecificRecord.save();

      // Assign patient reference to the user
      user.patient = userSpecificRecord._id;
    } else {
      return new NextResponse(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Save the user
    await user.save();

    // Return User and related model in the response
    const responseData = {
      user,
      relatedModel: userSpecificRecord,
    };

    // Send a successful response with the created user and related model
    return new NextResponse(
      JSON.stringify({
        message: "User and corresponding record created successfully",
        data: responseData,
      }),
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    // Return a server error response
    return new NextResponse(
      JSON.stringify({ error: "Server error", details: error.message }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
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
