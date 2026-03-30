export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {children}
    </div>
  );
}
