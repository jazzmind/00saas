import "./globals.css";

export const metadata = {
  title: '00SaaS',
  description: 'a SaaS boilerplate for AI Agent coders',
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