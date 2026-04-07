/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 */

import { getVersion } from "@/lib/utils";

interface VersionDisplayProps {
  prefix?: string;
  className?: string;
  versionOnly?: boolean;
  titleLabel?: string;
}

export default function VersionDisplay({
  prefix = "v.",
  className = "",
  versionOnly = false,
  titleLabel = "Application version",
}: VersionDisplayProps) {
  const version = getVersion();
  const displayText = versionOnly ? version : `${prefix}${version}`;
  return (
    <span className={className} title={`${titleLabel} ${version}`}>
      {displayText}
    </span>
  );
}
