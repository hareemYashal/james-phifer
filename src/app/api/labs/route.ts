import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { data: labs, error } = await supabase.from("labs").select("*");
        if (error) {
            console.error("Error fetching labs:", error);
            return NextResponse.json(
                { error: "Failed to fetch labs" },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true, labs });
    } catch (err: any) {
        console.error("API route error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json(
                { error: "Lab name is required" },
                { status: 400 }
            );
        }
        const { error } = await supabase.from("labs").insert([{ name }]);
        if (error) {
            console.error("Error adding lab:", error);
            return NextResponse.json(
                { error: "Error adding lab. Please try again." },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("API route error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { lab_id } = await req.json();
        if (!lab_id) {
            return NextResponse.json(
                { error: "Lab id is required" },
                { status: 400 }
            );
        }
        const { error } = await supabase
            .from("labs")
            .delete()
            .eq("lab_id", lab_id);
        if (error) {
            console.error("Error removing lab:", error);
            return NextResponse.json(
                { error: "Failed to remove lab" },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("API route error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}