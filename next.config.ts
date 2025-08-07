import type { NextConfig } from "next";
const API_BASE_URL = process.env.API_BASE_URL ;


const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/:path((?!app(?:$|/)).*)", // 
        destination: `${API_BASE_URL}/:path*`, 
      }
    ];
  }

};

export default nextConfig;
