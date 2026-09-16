import "./globals.css";

export const metadata = {
  title: "Mindra - AI Assistant",
  description: "Mindra AI Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}