import Providers from "./providers";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Jost } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jost",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId && process.env.NODE_ENV === "development") {
    console.warn(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined. Google login will not work.",
    );
  }

  return (
    <html lang="en" className={jost.variable}>
      <body>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            <AntdRegistry>
              <Providers>{children}</Providers>
            </AntdRegistry>
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              containerStyle={{
                zIndex: 9999,
              }}
              toastOptions={{
                duration: 4000,
                style: {
                  background: "rgba(128, 128, 128, 0.2)",
                  color: "#ffffff",
                  backdropFilter: "blur(10px)",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "var(--font-jost)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                },
                success: {
                  duration: 3000,
                  style: {
                    background: "rgba(34, 197, 94, 0.2)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                  },
                  iconTheme: {
                    primary: "#22c55e",
                    secondary: "#ffffff",
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  },
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#ffffff",
                  },
                },
                loading: {
                  duration: Infinity,
                  style: {
                    background: "rgba(128, 128, 128, 0.2)",
                  },
                },
              }}
            />
          </GoogleOAuthProvider>
        ) : (
          <AntdRegistry>
            <Providers>{children}</Providers>
          </AntdRegistry>
        )}
      </body>
    </html>
  );
}
