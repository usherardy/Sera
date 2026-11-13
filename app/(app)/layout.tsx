import { BottomNav, TopNav } from "@/components/nav/app-nav";
import { DESIGN_PREVIEW } from "@/lib/preview";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {DESIGN_PREVIEW && (
        <div className="bg-ink px-4 py-1.5 text-center font-mono text-[0.7rem] tracking-wider text-cream/80 uppercase">
          Design preview · Supabase not configured · not saved
        </div>
      )}
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-36 sm:px-6 sm:pt-10 sm:pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
