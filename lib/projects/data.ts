import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { needsReview } from "./meta";
import type {
  Conversation,
  ConversationDetail,
  Finding,
  FindingWithSource,
  Project,
  ProjectSummary,
  Task,
} from "./types";

// Real data, read as the signed-in user. RLS guarantees every query only sees
// the viewer's own rows; we never filter by user_id for security.

/** Per-request client. connection() marks the render as request-time (Cache Components). */
async function createClient() {
  await connection();
  return createServerClient();
}

const PROJECT_COLS =
  "id,name,client_name,original_description,agreed_scope,exclusions,fixed_price,currency,deadline,is_sample,created_at";
const CONVERSATION_COLS =
  "id,project_id,title,source,summary,recorded_at,processing_status,error_message,is_sample,analysis_started_at";
const FINDING_COLS =
  "id,project_id,conversation_id,category,title,description,source_quote,transcript_start_seconds,transcript_end_seconds,related_scope_item,explanation,confidence,suggested_follow_up,owner_label,due_date,due_phrase,review_status,client_status,notes,client_message,is_sample,created_at";
const TASK_COLS = "id,project_id,finding_id,title,owner,due_date,status,is_sample,created_at";

/** A conversation stuck mid-analysis this long is shown as failed so it can be retried. */
const STUCK_AFTER_MS = 3 * 60 * 1000;

type ConversationRow = Conversation & { analysis_started_at: string | null };

function toConversation(row: ConversationRow): Conversation {
  const { analysis_started_at, ...rest } = row;
  if (
    rest.processing_status === "analyzing" &&
    analysis_started_at &&
    Date.now() - new Date(analysis_started_at).getTime() > STUCK_AFTER_MS
  ) {
    return { ...rest, processing_status: "failed", error_message: "Analysis took too long. Try again." };
  }
  return rest;
}

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Couldn't load ${what}: ${error?.message ?? "unknown error"}`);
}

/** Signed-in user's id, or redirect to /login. */
async function requireUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return userId;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  await requireUserId(supabase);

  const [projects, conversations, findings, tasks] = await Promise.all([
    supabase.from("projects").select(PROJECT_COLS).order("created_at", { ascending: false }),
    supabase.from("conversations").select("id,project_id"),
    supabase.from("findings").select("project_id,category,review_status"),
    supabase.from("follow_up_tasks").select("project_id,status"),
  ]);
  if (projects.error) fail("projects", projects.error);
  if (conversations.error) fail("conversations", conversations.error);
  if (findings.error) fail("findings", findings.error);
  if (tasks.error) fail("tasks", tasks.error);

  return ((projects.data ?? []) as unknown as Project[]).map((p) => ({
    ...p,
    conversation_count: (conversations.data ?? []).filter((c) => c.project_id === p.id).length,
    pending_changes: (findings.data ?? []).filter(
      (f) => f.project_id === p.id && needsReview(f as Pick<Finding, "category" | "review_status">),
    ).length,
    open_tasks: (tasks.data ?? []).filter((t) => t.project_id === p.id && t.status === "open").length,
  }));
}

export interface ProjectBundle {
  project: Project;
  conversations: Conversation[];
  findings: FindingWithSource[];
  tasks: Task[];
}

export async function getProject(id: string): Promise<ProjectBundle | null> {
  const supabase = await createClient();
  await requireUserId(supabase);

  const { data: project, error } = await supabase.from("projects").select(PROJECT_COLS).eq("id", id).maybeSingle();
  if (error) fail("the project", error);
  if (!project) return null;

  const [conversations, findings, tasks] = await Promise.all([
    supabase.from("conversations").select(CONVERSATION_COLS).eq("project_id", id).order("recorded_at", { ascending: true }),
    supabase.from("findings").select(FINDING_COLS).eq("project_id", id).order("created_at", { ascending: true }),
    supabase.from("follow_up_tasks").select(TASK_COLS).eq("project_id", id).order("created_at", { ascending: true }),
  ]);
  if (conversations.error) fail("conversations", conversations.error);
  if (findings.error) fail("findings", findings.error);
  if (tasks.error) fail("tasks", tasks.error);

  const convs = ((conversations.data ?? []) as unknown as ConversationRow[]).map(toConversation);
  const byId = new Map(convs.map((c) => [c.id, c]));
  const joined = ((findings.data ?? []) as unknown as Finding[]).flatMap((f) => {
    const c = byId.get(f.conversation_id);
    return c ? [{ ...f, conversation: { id: c.id, title: c.title, recorded_at: c.recorded_at } }] : [];
  });

  return { project: project as unknown as Project, conversations: convs, findings: joined, tasks: (tasks.data ?? []) as unknown as Task[] };
}

export interface ConversationBundle {
  project: Project;
  conversation: ConversationDetail;
  findings: FindingWithSource[];
  tasks: Task[];
}

export async function getConversation(projectId: string, conversationId: string): Promise<ConversationBundle | null> {
  const supabase = await createClient();
  await requireUserId(supabase);

  const [project, conversation] = await Promise.all([
    supabase.from("projects").select(PROJECT_COLS).eq("id", projectId).maybeSingle(),
    supabase
      .from("conversations")
      .select(`${CONVERSATION_COLS},transcript`)
      .eq("id", conversationId)
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);
  if (project.error) fail("the project", project.error);
  if (conversation.error) fail("the conversation", conversation.error);
  if (!project.data || !conversation.data) return null;

  const [findings, tasks] = await Promise.all([
    supabase.from("findings").select(FINDING_COLS).eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    supabase.from("follow_up_tasks").select(TASK_COLS).eq("project_id", projectId).order("created_at", { ascending: true }),
  ]);
  if (findings.error) fail("findings", findings.error);
  if (tasks.error) fail("tasks", tasks.error);

  const row = conversation.data as unknown as ConversationRow & { transcript: string };
  const { transcript, ...rest } = row;
  const base = toConversation(rest);
  const detail: ConversationDetail = { ...base, transcript };

  return {
    project: project.data as unknown as Project,
    conversation: detail,
    findings: ((findings.data ?? []) as unknown as Finding[]).map((f) => ({
      ...f,
      conversation: { id: detail.id, title: detail.title, recorded_at: detail.recorded_at },
    })),
    tasks: (tasks.data ?? []) as unknown as Task[],
  };
}

export interface ActivityItem {
  conversation: Conversation;
  project: Pick<Project, "id" | "name">;
}

/** Most recently added conversations across all projects, for the dashboard. */
export async function listRecentConversations(limit = 5): Promise<ActivityItem[]> {
  const supabase = await createClient();
  await requireUserId(supabase);
  const { data, error } = await supabase
    .from("conversations")
    .select(`${CONVERSATION_COLS},project:projects(id,name)`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("recent activity", error);
  return ((data ?? []) as unknown as (ConversationRow & { project: Pick<Project, "id" | "name"> })[]).flatMap((row) => {
    const { project, ...conv } = row;
    return project ? [{ conversation: toConversation(conv), project }] : [];
  });
}
