import type { Metadata } from "next";
import ThemeRegistry from "@/components/ThemeRegistry";
import NavBar from "@/components/NavBar";
import Box from "@mui/material/Box";

export const metadata: Metadata = {
  title: "AffordMed Campus Notifications",
  description: "Campus notification inbox — Placements, Events, Results",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ThemeRegistry>
          <NavBar />
          <Box
            component="main"
            sx={{
              minHeight: "calc(100vh - 64px)",
              bgcolor: "background.default",
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 2, sm: 3 },
              maxWidth: 1100,
              mx: "auto",
            }}
          >
            {children}
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
