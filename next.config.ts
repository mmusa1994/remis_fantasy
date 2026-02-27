import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:league(premier-league|champions-league|f1-fantasy)/tabele",
        destination: "/:league/tables",
        permanent: true,
      },
      {
        source: "/:league(premier-league|champions-league|f1-fantasy)/nagrade",
        destination: "/:league/prizes",
        permanent: true,
      },
      {
        source:
          "/:league(premier-league|champions-league|f1-fantasy)/registracija",
        destination: "/:league/registration",
        permanent: true,
      },
      {
        source: "/:league(premier-league|champions-league|f1-fantasy)/galerija",
        destination: "/:league/gallery",
        permanent: true,
      },
      {
        source: "/premier-league/cijene",
        destination: "/premier-league/prices",
        permanent: true,
      },
      {
        source: "/admin/dashboard/tabele",
        destination: "/admin/dashboard/tables",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yqrqcdrnfmhcozfumilm.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "yqrqcdrnfmhcozfumilm.supabase.co",
        port: "",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
