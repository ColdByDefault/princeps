/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 */

import SignUpCard from "@/components/auth/SignUpCard";
import { getRequestConfig } from "@/i18n/request";

export default async function SignUpPage() {
  const { messages } = await getRequestConfig();

  return <SignUpCard messages={messages} />;
}
