import { Badge } from "@/components/ui/badge";
import {
  formatCountdown,
  getCreditBackStatus,
  type CreditBackApplication,
} from "@/lib/credit-back";

type Props = {
  application: Pick<
    CreditBackApplication,
    | "awaiting_customer_response"
    | "customer_responded_at"
    | "customer_response_kind"
    | "credit_refunded_at"
    | "response_deadline_at"
    | "credit_id"
    | "fee_eur"
    | "status"
  >;
  perspective: "specialist" | "customer";
};

export function CreditBackStatusBadge({ application, perspective }: Props) {
  const status = getCreditBackStatus(application);
  const countdown = formatCountdown(application.response_deadline_at);

  if (status === "not_applicable") {
    return <Badge variant="outline">{application.status}</Badge>;
  }

  if (status === "credit_returned") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="border-transparent bg-[#fff0f2] text-[#be123c]">Credit returned</Badge>
        <Badge variant="outline">{application.status}</Badge>
      </div>
    );
  }

  if (status === "responded") {
    const kind = application.customer_response_kind ?? "response";
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">
          {perspective === "customer" ? "You responded" : "Customer responded"}
          {kind !== "response" ? ` · ${kind}` : ""}
        </Badge>
        <Badge variant="outline">{application.status}</Badge>
      </div>
    );
  }

  if (status === "expired_pending_job") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="border-transparent bg-amber-100 text-amber-950">
          Deadline passed · credit return pending
        </Badge>
        <Badge variant="outline">{application.status}</Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge className="border-transparent bg-[#fff0f2] text-[#9f1239]">
        {countdown.label}
      </Badge>
      <Badge variant="outline">{application.status}</Badge>
    </div>
  );
}

export function CreditBackHint({
  perspective,
}: {
  perspective: "specialist" | "customer";
}) {
  if (perspective === "customer") {
    return (
      <p className="text-xs text-[#6f5f64]">
        Message, accept, or decline within 72 hours. Viewing alone does not count — otherwise the
        specialist’s application credit is returned.
      </p>
    );
  }
  return (
    <p className="text-xs text-[#6f5f64]">
      If the customer does not message, accept, or decline within 72 hours, your credit returns
      automatically. Monetary payment rights stay separate.
    </p>
  );
}
