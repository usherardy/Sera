import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader, SectionHeader } from "@/components/common/layout-bits";
import { FindingListItem } from "@/components/projects/project-bits";
import { TodoList } from "@/components/projects/todo-list";
import { listTodo } from "@/lib/projects/data";
import { getViewer } from "@/lib/viewer";

export default function TodoPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Across all clients"
        title={
          <>
            Everything <em>to do</em>
          </>
        }
        subtitle="Your tasks, the changes waiting for your review, and what you're waiting on from clients, in one place."
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-card bg-cream-dark/60" />}>
        <TodoContent />
      </Suspense>
    </div>
  );
}

async function TodoContent() {
  const [todo, viewer] = await Promise.all([listTodo(), getViewer()]);
  const nothing = todo.tasks.length === 0 && todo.review.length === 0 && todo.waiting.length === 0;
  if (nothing) {
    return (
      <EmptyState
        icon={<CheckCircle2 />}
        title="All clear."
        body="Promises you make on calls become tasks here automatically. Record a call to get started."
      />
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-5">
        <SectionHeader title="Your tasks" count={todo.tasks.length} />
        {todo.tasks.length === 0 ? (
          <p className="text-sm text-ink-muted">No open tasks.</p>
        ) : (
          <TodoList tasks={todo.tasks} today={viewer.today} />
        )}
      </section>

      {todo.review.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeader title="Changes to review" count={todo.review.length} />
          <ul className="surface divide-y divide-cream-dark">
            {todo.review.map((f) => (
              <FindingListItem
                key={f.id}
                f={f}
                href={`/projects/${f.project.id}/conversations/${f.conversation_id}?finding=${f.id}`}
                context={`${f.project.name} · ${f.conversation.title}`}
              />
            ))}
          </ul>
        </section>
      )}

      {todo.waiting.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeader title="Waiting on clients" count={todo.waiting.length} />
          <ul className="surface divide-y divide-cream-dark">
            {todo.waiting.map((f) => (
              <FindingListItem
                key={f.id}
                f={f}
                href={`/projects/${f.project.id}/conversations/${f.conversation_id}?finding=${f.id}`}
                context={`${f.project.name} · ${f.category === "commitment" ? "Client promised this" : "Change request sent"}`}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
