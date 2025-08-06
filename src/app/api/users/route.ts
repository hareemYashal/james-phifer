import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabase
            .from("users_lab")
            .select("id, email, role, lab_id, labs(name)");
        if (error) {
            console.error("Error fetching users:", error);
            return NextResponse.json(
                { error: "Failed to fetch users" },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true, users: data });
    } catch (err: any) {
        console.error("API route error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json(
                { error: "User id is required" },
                { status: 400 }
            );
        }
        const { error } = await supabase
            .from("users_lab")
            .delete()
            .eq("id", id);
        if (error) {
            console.error("Error removing user:", error);
            return NextResponse.json(
                { error: "Failed to remove user" },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("API route error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { lab_id, email, role } = await req.json();
        if (!lab_id || !email || !role) {
            return NextResponse.json(
                { error: "lab_id, email, and role are required" },
                { status: 400 }
            );
        }
        const { error } = await supabase
            .from("users_lab")
            .insert([{ lab_id, email, role }]);
        if (error) {
            console.error("Error adding user:", error);
            return NextResponse.json(
                { error: error.details || "Error adding user. Please try again." },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("API route error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}