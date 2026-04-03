/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */



export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div>
      {children}
    </div>
  );
}
