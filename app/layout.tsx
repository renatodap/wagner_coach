// Root layout - minimal, just sets up HTML structure
// Actual layout with providers is in app/[locale]/layout.tsx

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
