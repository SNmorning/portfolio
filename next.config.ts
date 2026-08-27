import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 隐藏本地开发时左下角的 Next.js 开发指示器按钮（线上本就不显示）
  devIndicators: false,
};

export default nextConfig;
