import { NextRequest, NextResponse } from "next/server";
import { supabase, storageClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fields = formData.get("fields");
    const file = formData.get("file") as File | null;

    if (!fields) {
      return NextResponse.json(
        { error: "Missing fields data" },
        { status: 400 }
      );
    }

    let parsedFields;
    try {
      parsedFields = JSON.parse(fields as string);
      if (!Array.isArray(parsedFields)) {
        return NextResponse.json(
          { error: "Invalid fields format" },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in fields" },
        { status: 400 }
      );
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

    // Handle file upload if a file is provided
    let fileUrl = null;
    if (file) {
      const fileName = `${labId}/${user.user.id}/${Date.now()}-${file.name}`;
      const fileBuffer = await file.arrayBuffer();

      const { data: uploadData, error: uploadError } =
        await storageClient.storage
          .from("lab-documents")
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        console.error("File upload error:", uploadError);
        return NextResponse.json(
          { error: uploadError.message },
          { status: 500 }
        );
      }

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = storageClient.storage.from("lab-documents").getPublicUrl(fileName);

      fileUrl = publicUrl;
    }

    // Insert document data with file URL if available
    const { error: insertError, data: documentData } = await supabase
      .from("documents")
      .insert([
        {
          data: parsedFields,
          lab_id: labId,
          uploaded_by: user.user.id,
          url: fileUrl, // Store the file URL
        },
      ])
      .select();

    if (insertError) {
      console.error("Supabase error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: documentData[0],
      fileUrl: fileUrl,
    });
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
