import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import Admin from "@/models/Admin";
import { URL } from "url";

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
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}

// Get users with search query, pagination, role filter
export async function GET(req) {
  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const role = url.searchParams.get("role") || "";

    const query = {
      ...(search && {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }),
      ...(role && { role }),
    };

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit);
    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const detailedUsers = await Promise.all(
      users.map(async (user) => {
        let relatedModel = null;
        if (user.role === "Doctor") {
          relatedModel = await Doctor.findById(user.doctor);
        } else if (user.role === "Patient") {
          relatedModel = await Patient.findById(user.patient);
        } else if (user.role === "Admin") {
          relatedModel = await Admin.findById(user.admin);
        }

        return { user, relatedModel };
      })
    );

    return addCorsHeaders(
      NextResponse.json(
        {
          message: "Users fetched successfully",
          data: { users: detailedUsers, page, totalPages, totalCount },
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
