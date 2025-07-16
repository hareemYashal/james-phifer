"use client";

import Loader from "@/components/ui/loader";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ShowToast } from "@/shared/showToast";

const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const userEmail = session.user.email;

            try {
              const { data: userData, error: userError } = await supabase
                .from("users_lab")
                .select("*")
                .eq("email", userEmail)
                .single();

              if (userError || !userData) {
                ShowToast("Access Denied: Your email is not authorized.");
                await supabase.auth.signOut();
                router.push("/login");
                return;
              }
              localStorage.setItem("access_token", session.access_token);
              router.push("/pdf-viewer");
            } catch (err) {
              console.error("Error verifying user:", err);
              ShowToast("An error occurred while verifying your access.");
            }
          }
        });
        setLoading(false);
      } else {
        router.push("/login");
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <Loader />;
  }

  return <>{children}</>;
};

export default AuthCheck;
