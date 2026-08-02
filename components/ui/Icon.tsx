import { SVGProps } from "react";
import { Trash2, User, ArrowLeft, Plus, Search, ListFilter, ChevronRight, Image, Camera, MessageSquare, Sprout, Leaf, Check } from "lucide-react";
import styles from "./Icon.module.css";


// Semantic name -> Lucide glyph. Add entries only as features need them —
// see AGENTS.md task scope, do not pre-map the whole Lucide set.
const icons = {
  delete: Trash2,
  user: User,
  back: ArrowLeft,
  add: Plus,
  search: Search,
  filter: ListFilter,
  right: ChevronRight,
  image: Image,
  camera: Camera,
  message: MessageSquare,
  sprout: Sprout,
  leaf: Leaf,
  check: Check,
} as const;

type IconName = keyof typeof icons;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name" | "color"> {
  name: IconName;
  size?: number;
  color?: string;
  "aria-label"?: string;
}

// No --icon-* or --space-* sizing tokens exist yet (see contradiction #1 in
// docs/styleguide/naming-convention.md — --space-* is still missing project-wide).
// Defaults below are hard-coded rather than invented tokens; revisit once that gap closes.
const DEFAULT_SIZE = 20;
const DEFAULT_COLOR = "currentColor";

function Icon({
  name,
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  className = "",
  "aria-label": ariaLabel,
  ...props
}: IconProps) {
  const Glyph = icons[name];

  return (
    <Glyph
      size={size}
      color={color}
      className={[styles["o-icon"], className].filter(Boolean).join(" ")}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      {...props}
    />
  );
}

export { Icon };
export type { IconProps, IconName };

// Usage example (feature components should always go through this wrapper,
// never import from lucide-react directly):
//
//   import { Icon } from "@/components/ui/Icon";
//   <Icon name="delete" aria-label="Delete plant" />
