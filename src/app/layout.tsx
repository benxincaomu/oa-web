"use client";
import "./globals.css";
import { ConfigProvider } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Suspense } from "react";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <html lang="en">
    <body><ConfigProvider
      theme={{

        // algorithm: theme.defaultAlgorithm,
        components: {
          Table: {
            colorBorder: "#180bccff",
            colorBorderSecondary: "#7b799eff",
            rowSelectedHoverBg: "#f1f8f2ff",
            headerBg: "#7d9474ff",

          }
        }
      }}
    >
      <AntdRegistry>
        <Suspense fallback={<div>Loading...</div>}>

          {children}
        </Suspense>
      </AntdRegistry>
    </ConfigProvider>
    </body>
  </html>
}
