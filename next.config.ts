import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  // Disable the development overlay “N” indicator that Next.js shows at the corner of the screen.
  devIndicators: false,
};

export default nextConfig;
