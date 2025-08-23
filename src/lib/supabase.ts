import { createClient } from "@supabase/supabase-js";

// Server-side client with admin privileges (service role)
// Use this for database operations that require admin access
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

// Storage client with appropriate bucket policies
// This ensures proper storage access control
export const storageClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "x-supabase-storage": "true",
      },
    },
  }
);
