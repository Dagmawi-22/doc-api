import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import Admin from "@/models/Admin"; // Assuming an Admin model exists

// Utility function for adding CORS headers
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

// Get users with search query, pagination, role filter, and optional view details
export async function GET(req) {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      role = "",
    } = req.nextUrl.searchParams;

    await connectToDatabase();

    // Build query for search and role
    const query = {
      ...(search && {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }),
      ...(role && { role }), // Only filter by role if provided
    };

    // Pagination and limiting the number of results
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get total count of users for pagination
    const totalCount = await User.countDocuments(query);

    const totalPages = Math.ceil(totalCount / limit);

    // Fetch additional details (Doctor, Patient, Admin) based on user role
    const detailedUsers = await Promise.all(
      users.map(async (user) => {
        let relatedModel = null;
        if (user.role === "Doctor") {
          relatedModel = await Doctor.findById(user.doctor);
        } else if (user.role === "Patient") {
          relatedModel = await Patient.findById(user.patient);
        } else if (user.role === "Admin") {
          relatedModel = await Admin.findById(user.admin); // Assuming Admin field is stored in the user model
        }

        return { user, relatedModel };
      })
    );

    return addCorsHeaders(
      NextResponse.json(
        {
          message: "Users fetched successfully",
          data: {
            users: detailedUsers,
            page,
            totalPages,
            totalCount,
          },
        },
        { status: 200 }
      )
    );
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    );
  }
}

// Get user details by ID
export async function GET_DETAILS(_, { params }) {
  try {
    await connectToDatabase();

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
    } else if (user.role === "Admin") {
      relatedModel = await Admin.findById(user.admin);
    }

    return addCorsHeaders(
      NextResponse.json({ user, relatedModel }, { status: 200 })
    );
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json(
        { error: "Failed to fetch user details" },
        { status: 500 }
      )
    );
  }
}

// Suspend a user
export async function DELETE(_, { params }) {
  try {
    await connectToDatabase();

    // Find the user and update status to "Suspended"
    const suspendedUser = await User.findByIdAndUpdate(
      params.id,
      { status: "Suspended" },
      { new: true }
    );
    if (!suspendedUser)
      return addCorsHeaders(
        NextResponse.json({ error: "User not found" }, { status: 404 })
      );

    // Suspend related model based on user role
    if (suspendedUser.role === "Doctor") {
      await Doctor.findByIdAndUpdate(suspendedUser.doctor, {
        status: "Suspended",
      });
    } else if (suspendedUser.role === "Patient") {
      await Patient.findByIdAndUpdate(suspendedUser.patient, {
        status: "Suspended",
      });
    } else if (suspendedUser.role === "Admin") {
      await Admin.findByIdAndUpdate(suspendedUser.admin, {
        status: "Suspended",
      });
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
