/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "tesseract.js", "sharp", "@huggingface/transformers", "onnxruntime-node", "@tesseract.js-data/eng", "@tesseract.js-data/tel"],
    outputFileTracingIncludes: {
      "/api/**/*": ["./models/Xenova/clip-vit-base-patch32/**/*", "./node_modules/@tesseract.js-data/eng/**/*", "./node_modules/@tesseract.js-data/tel/**/*"],
    },
  },
  images: {
    domains: ["images.unsplash.com", "api.dicebear.com"],
  },
};

export default nextConfig;
