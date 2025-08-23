"use client";

import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Login = () => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.push("/pdf-viewer");
      }
    };

    checkUser();
  }, [router]);

  const handleGoogleLogin = async () => {
    setError(null);
    
    // Get the base URL from environment or use current origin
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      setError(error.message);
    } else {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          router.push("/pdf-viewer");
        }
      });
    }
  };

  return (
    <div
      style={{
        flex: 1,
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "column",
          gap: "25px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          padding: "50px",
          borderRadius: "8px",
          backgroundColor: "white",
          width: "30%",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <Image
            src="/logo1.jpg"
            alt="Phifer Consulting Logo"
            width={200}
            height={100}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <h2>Login</h2>
        <button
          onClick={handleGoogleLogin}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0f4735",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          <Image
            src="/google-icon.svg"
            alt="Google Icon"
            width={20}
            height={20}
            style={{ objectFit: "contain" }}
          />
          Login with Google
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;
