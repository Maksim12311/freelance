import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { Button } from "@/components/ui/button";

export const metadata = { title: "How It Works" };

const steps = [
  {
    title: "Create an account",
    body: "Sign up with your details and university affiliation.",
  },
  {
    title: "Verify student status",
    body: "Confirm with an approved university email domain or an enrollment document reviewed by administrators.",
  },
  {
    title: "Browse or publish requests",
    body: "Find help across categories or post what you need in Vienna.",
  },
  {
    title: "Apply and message",
    body: "Send applications, contact students, and agree on details independently.",
  },
  {
    title: "Leave peer feedback",
    body: "After both sides confirm a collaboration, share ratings as peer feedback — not a legal guarantee.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">How It Works</h1>
          <p className="text-slate-600">
            StudentPro connects verified students for independent collaborations. Payments and
            service contracts stay between students.
          </p>
        </div>
        <PlatformNotice />
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4"
            >
              <p className="text-sm font-semibold text-[#2563EB]">Step {index + 1}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">{step.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-3">
          <Button className="bg-[#2563EB] hover:bg-blue-700" render={<Link href="/signup" />}>Create account</Button>
          <Button variant="outline" render={<Link href="/requests" />}>Browse requests</Button>
        </div>
      </div>
    </PublicShell>
  );
}
