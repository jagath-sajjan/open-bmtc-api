import "./globals.css";

export const metadata = {
  title: "BMTC Geo API",
  description: "Simple geo APIs for BMTC routes and stops",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
