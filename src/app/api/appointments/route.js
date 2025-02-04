import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Appointment from "@/models/Appointment"; // Assuming the Appointment model exists

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

export async function POST(req) {
  try {
    const {
      doctor,
      patient,
      date,
      time,
      duration,
      reason,
      amount,
      status,
      paymentStatus,
      paymentMethod,
    } = await req.json();

    // Check for missing required fields
    if (!doctor || !patient || !date || !time || !reason || !amount) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Create a new appointment
    const appointment = new Appointment({
      doctor,
      patient,
      date,
      time,
      duration,
      reason,
      amount,
      status: status || "Scheduled",
      paymentStatus: paymentStatus || "Pending",
      paymentMethod,
    });

    // Save the appointment
    await appointment.save();

    // Respond with the created appointment
    return addCorsHeaders(
      NextResponse.json({
        message: "Appointment created successfully",
        data: appointment,
      }),
      { status: 201 }
    );
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Server error", details: error.message }),
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    const { id } = params;

    // Connect to the database
    await connectToDatabase();

    if (id) {
      // Retrieve a single appointment by ID
      const appointment = await Appointment.findById(id);

      // Check if the appointment exists
      if (!appointment) {
        return addCorsHeaders(
          NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        );
      }

      // Respond with the appointment
      return addCorsHeaders(NextResponse.json({ data: appointment }), {
        status: 200,
      });
    } else {
      // Retrieve all appointments
      const appointments = await Appointment.find({});

      // Respond with the list of appointments
      return addCorsHeaders(NextResponse.json({ data: appointments }), {
        status: 200,
      });
    }
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Server error", details: error.message }),
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const updateData = await req.json();

    // Connect to the database
    await connectToDatabase();

    // Update the appointment by ID
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Check if the appointment exists
    if (!updatedAppointment) {
      return addCorsHeaders(
        NextResponse.json({ error: "Appointment not found" }, { status: 404 })
      );
    }

    // Respond with the updated appointment
    return addCorsHeaders(
      NextResponse.json({
        message: "Appointment updated successfully",
        data: updatedAppointment,
      }),
      { status: 200 }
    );
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Server error", details: error.message }),
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Connect to the database
    await connectToDatabase();

    // Delete the appointment by ID
    const deletedAppointment = await Appointment.findByIdAndDelete(id);

    // Check if the appointment exists
    if (!deletedAppointment) {
      return addCorsHeaders(
        NextResponse.json({ error: "Appointment not found" }, { status: 404 })
      );
    }

    // Respond with a success message
    return addCorsHeaders(
      NextResponse.json({
        message: "Appointment deleted successfully",
        data: deletedAppointment,
      }),
      { status: 200 }
    );
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: "Server error", details: error.message }),
      { status: 500 }
    );
  }
}
