import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";

export const metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">How StudentPro works</h1>
          <p className="mt-3 text-slate-600">
            The idea is simple: one student needs help, another student can help, and they talk
            directly.
          </p>
        </div>

        <ol className="space-y-6">
          {[
            {
              title: "Create an account",
              text: "Sign up with your name, email, and university.",
            },
            {
              title: "Verify that you are a student",
              text: "Use your university email or upload an enrollment document. Only verified students can post, apply, and message.",
            },
            {
              title: "Ask for help or offer help",
              text: "Post what you need, or browse open requests and send an application.",
            },
            {
              title: "Message and agree yourselves",
              text: "Decide timing, details, and any payment directly. StudentPro does not process service payments.",
            },
          ].map((step, index) => (
            <li key={step.title} className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-[#2563EB]">Step {index + 1}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/signup" />}>Sign up</Button>
          <Button variant="outline" render={<Link href="/requests" />}>
            Browse requests
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
