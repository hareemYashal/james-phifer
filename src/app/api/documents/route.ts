import {NextRequest, NextResponse} from "next/server";
import {supabase} from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.fields || !Array.isArray(body.fields)) {
      return NextResponse.json({error: "Invalid payload"}, {status: 400});
    }

    const {error, data} = await supabase
      .from("documents")
      .insert([{data: body.fields}])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({success: true, document: data[0]});
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({error: err.message}, {status: 500});
  }
}
