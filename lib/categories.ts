import type { MomentCategory } from "@/lib/types";

export interface CategoryMeta {
  label: string;
  plural: string;
  /** dot / accent background */
  dot: string;
  /** badge styling: tinted background + readable text */
  badge: string;
}

export const CATEGORY_META: Record<MomentCategory, CategoryMeta> = {
  decision: {
    label: "Decision",
    plural: "Decisions",
    dot: "bg-fathom",
    badge: "bg-fathom/10 text-fathom",
  },
  commitment: {
    label: "Commitment",
    plural: "Commitments",
    dot: "bg-purple",
    badge: "bg-purple/15 text-[#5b4596]",
  },
  important_information: {
    label: "Important info",
    plural: "Information",
    dot: "bg-glow",
    badge: "bg-glow/20 text-[#8a4d00]",
  },
  personal_note: {
    label: "Personal note",
    plural: "Personal",
    dot: "bg-signal",
    badge: "bg-signal/35 text-[#8a2a74]",
  },
};

export const CATEGORY_ORDER: MomentCategory[] = [
  "decision",
  "commitment",
  "important_information",
  "personal_note",
];
