import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isVerificationActive, requireVerifiedStudent } from "@/lib/auth";
import { markConversationReadAction, sendMessageAction } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/server";
import { cn, formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const profile = await requireVerifiedStudent("/messages");
  const verified = isVerificationActive(profile) || profile.is_admin;
  const { c: activeId } = await searchParams;
  const supabase = await createClient();

  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at, conversation:conversations(id, last_message_at, updated_at)")
    .eq("profile_id", profile.id)
    .order("joined_at", { ascending: false });

  const conversationIds = (participation ?? []).map((p) => p.conversation_id);
  const { data: participants } = conversationIds.length
    ? await supabase
        .from("conversation_participants")
        .select("conversation_id, profile:profiles(id, display_name, avatar_url)")
        .in("conversation_id", conversationIds)
    : { data: [] };

  const conversations = (participation ?? []).map((row) => {
    const others =
      participants
        ?.filter((p) => p.conversation_id === row.conversation_id)
        .map((p) => (Array.isArray(p.profile) ? p.profile[0] : p.profile))
        .filter((p) => p && p.id !== profile.id) ?? [];
    const conversation = Array.isArray(row.conversation)
      ? row.conversation[0]
      : row.conversation;
    return {
      id: row.conversation_id,
      last_message_at: conversation?.last_message_at,
      otherName: others[0]?.display_name || "Conversation",
      last_read_at: row.last_read_at,
    };
  });

  const selectedId = activeId || conversations[0]?.id;
  let messages: Array<{
    id: string;
    body: string;
    sender_id: string;
    created_at: string;
    is_deleted: boolean;
  }> = [];

  if (selectedId) {
    await markConversationReadAction(selectedId);
    const { data } = await supabase
      .from("messages")
      .select("id, body, sender_id, created_at, is_deleted")
      .eq("conversation_id", selectedId)
      .order("created_at", { ascending: true });
    messages = data ?? [];
  }

  return (
    <AppShell
      user={{
        id: profile.id,
        displayName: profile.display_name,
        firstName: profile.first_name,
        isAdmin: profile.is_admin,
        verified,
        activeMode: profile.active_mode ?? "customer",
      }}
    >
      <div className="flex flex-col gap-4">
        <PlatformNotice compact title="Direct messaging notice">
          Agree on details and payment directly. StudentPro does not process service payments.
        </PlatformNotice>
        <div className="grid min-h-[70vh] overflow-hidden rounded-2xl border border-[#f0d5db] bg-white lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-slate-200 lg:border-r lg:border-b-0">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
              Conversations
            </div>
            <div className="max-h-[30vh] overflow-y-auto lg:max-h-none">
              {conversations.length ? (
                conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/messages?c=${conversation.id}`}
                    className={cn(
                      "block border-b border-slate-100 px-4 py-3 text-sm transition hover:bg-slate-50",
                      selectedId === conversation.id && "bg-blue-50",
                    )}
                  >
                    <p className="font-medium">{conversation.otherName}</p>
                    <p className="text-xs text-slate-500">
                      {conversation.last_message_at
                        ? formatRelativeDate(conversation.last_message_at)
                        : "No messages yet"}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="p-4">
                  <EmptyState
                    title="No conversations"
                    description="Contact a student from a request or profile to start chatting."
                  />
                </div>
              )}
            </div>
          </aside>
          <section className="flex min-h-[50vh] flex-col">
            {selectedId ? (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        message.sender_id === profile.id
                          ? "ml-auto bg-[#2563EB] text-white"
                          : "bg-slate-100 text-slate-800",
                      )}
                    >
                      {message.is_deleted ? (
                        <span className="italic opacity-70">Message removed</span>
                      ) : (
                        message.body
                      )}
                      <div
                        className={cn(
                          "mt-1 text-[10px]",
                          message.sender_id === profile.id
                            ? "text-blue-100"
                            : "text-slate-500",
                        )}
                      >
                        {formatRelativeDate(message.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
                <form action={sendMessageAction} className="border-t border-slate-200 p-4">
                  <input type="hidden" name="conversationId" value={selectedId} />
                  <Textarea name="body" required placeholder="Write a message…" rows={3} />
                  <div className="mt-3 flex justify-end">
                    <Button type="submit">Send</Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState title="Select a conversation" />
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
