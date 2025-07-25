import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.fields || !Array.isArray(body.fields)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

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

    const { error: insertError, data: documentData } = await supabase
      .from("documents")
      .insert([{ data: body.fields, lab_id: labId, uploaded_by: user.user.id }])
      .select();

    if (insertError) {
      console.error("Supabase error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, document: documentData[0] });
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
