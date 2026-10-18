import { NextResponse } from "next/server";
import { testConnection, setDbPassword } from "@/lib/db";

export async function GET() {
  const result = await testConnection();
  return NextResponse.json({
    ...result,
    database: "JanMithra",
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === undefined) {
      return NextResponse.json(
        { success: false, message: "Password field is required." },
        { status: 400 }
      );
    }

    // Test the candidate password against MySQL
    const testResult = await testConnection(password);

    if (testResult.connected) {
      setDbPassword(password);
      return NextResponse.json({
        success: true,
        message: "Successfully connected to JanMithra MySQL database!",
        userCount: testResult.userCount,
        schemeCount: testResult.schemeCount,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Connection failed: ${testResult.error}`,
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
