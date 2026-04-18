/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="flex flex-1 min-h-0 overflow-hidden">{children}</div>;
}
