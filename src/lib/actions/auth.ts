export async function fetchUserDetails() {
  try {
    const baseUrl =
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        : "";

    const accessToken =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (!accessToken) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${baseUrl}/api/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch user details");
    }

    const { user } = await response.json();

    return user.user.user_metadata || user.user || {};
  } catch (error: any) {
    console.log("Error fetching user details:", error.message);
    throw error;
  }
}
