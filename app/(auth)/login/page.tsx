/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import { LoginCard } from "@/components/auth";
import { getRequestConfig } from "@/i18n/request";

export default async function LoginPage() {
  const { messages } = await getRequestConfig();

  return <LoginCard messages={messages} />;
}
