import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: "/admin/",
      },
    ],
    sitemap: "https://remis-fantasy.com/sitemap.xml",
  };
}
