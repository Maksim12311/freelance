import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PlatformNotice({
  title = "StudentPro only connects students",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {children ??
          "You are responsible for independently agreeing on the details of any arrangement and complying with applicable laws. StudentPro does not process service payments, employ students, or guarantee service quality."}
      </AlertDescription>
    </Alert>
  );
}
