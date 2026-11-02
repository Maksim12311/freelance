import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function VerifiedBadge({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="secondary"
            className="gap-1 border border-blue-100 bg-blue-50 text-[#2563EB] hover:bg-blue-50"
          />
        }
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        {compact ? null : <span>Verified student</span>}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        Student affiliation was verified via StudentPro. This is not proof of
        authorization to perform paid work under Austrian law.
      </TooltipContent>
    </Tooltip>
  );
}
