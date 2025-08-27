import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: documentId } = await params;

        if (!documentId) {
            return NextResponse.json(
                { error: "Document ID is required" },
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

        // Fetch the document with lab access check
        const { data: document, error: documentError } = await supabase
            .from("documents")
            .select("*")
            .eq("id", documentId)
            .eq("lab_id", labId)
            .single();

        if (documentError) {
            console.error("Error fetching document:", documentError);
            return NextResponse.json(
                { error: "Document not found or access denied" },
                { status: 404 }
            );
        }

        // Parse the data field to extract grid data
        let parsedData = document.data;
        if (typeof parsedData === 'string') {
            try {
                parsedData = JSON.parse(parsedData);
            } catch (e) {
                console.error("Error parsing document data:", e);
                // Fallback to legacy format
                parsedData = { originalExtractedFields: parsedData };
            }
        }

        // Ensure we have the expected structure
        const documentData = {
            id: document.id,
            companyContactData: parsedData.companyContactData || [],
            sampleData: parsedData.sampleData || [],
            nonSampleData: parsedData.nonSampleData || [],
            // originalExtractedFields: parsedData.originalExtractedFields || parsedData,
            categorizedSections: parsedData.categorizedSections || {
                companyLocationInfo: [],
                contactProjectInfo: [],
                dataDeliverables: [],
                containerInfo: [],
                collectedSampleDataInfo: [],
            },
            url: document.url,
            created_at: document.created_at,
            lab_id: document.lab_id,
            uploaded_by: document.uploaded_by,
        };

        return NextResponse.json({
            success: true,
            document: documentData,
        });
    } catch (err: any) {
        console.error("API route error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: documentId } = await params;

        if (!documentId) {
            return NextResponse.json(
                { error: "Document ID is required" },
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

        // Get form data
        const formData = await req.formData();
        const fields = formData.get("fields");

        if (!fields) {
            return NextResponse.json(
                { error: "Missing fields data" },
                { status: 400 }
            );
        }

        let parsedFields;
        try {
            parsedFields = JSON.parse(fields as string);
            if (!parsedFields || typeof parsedFields !== 'object' || Array.isArray(parsedFields)) {
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

        // Update the document
        const { error: updateError, data: updatedDocument } = await supabase
            .from("documents")
            .update({
                data: parsedFields,
                // updated_at: new Date().toISOString(),
            })
            .eq("id", documentId)
            .eq("lab_id", labId)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating document:", updateError);
            return NextResponse.json(
                { error: "Failed to update document" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            document: updatedDocument,
        });
    } catch (err: any) {
        console.error("API route error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
