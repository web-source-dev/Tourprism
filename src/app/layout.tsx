import type { Metadata } from "next";
import { inter, poppins } from "./fonts";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeRegistry } from "@/components/ThemeRegistry";
<<<<<<< HEAD
=======
import { ToastProvider } from "@/ui/toast";
>>>>>>> 2945eb6 (Initial commit)

// Import Remixicon
import 'remixicon/fonts/remixicon.css';

export const metadata: Metadata = {
  title: "TourPrism",
  description: "Access real-time, hyperlocal safety alerts and insights for travelers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
      >
        <ThemeRegistry>
          <AuthProvider>
<<<<<<< HEAD
            {children}
=======
            <ToastProvider>
              {children}
            </ToastProvider>
>>>>>>> 2945eb6 (Initial commit)
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
