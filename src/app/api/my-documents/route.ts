import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { data: user, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Supabase user error:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user details" },
        { status: 401 }
      );
    }

    const userEmail = user.user.email;
    const { data: userLab, error: userLabError } = await supabase
      .from("users_lab")
      .select("lab_id")
      .eq("email", userEmail)
      .single();

    if (userLabError || !userLab) {
      console.error("Error fetching user's lab:", userLabError);
      return NextResponse.json(
        { error: "User is not associated with any lab" },
        { status: 403 }
      );
    }

    const labId = userLab.lab_id;

    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("*")
      .eq("lab_id", labId);

    if (documentsError) {
      console.error("Supabase documents error:", documentsError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, documents });
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
