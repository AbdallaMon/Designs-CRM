// Single source of truth for STATUS colors across the v2 UI. Folds the scattered legacy maps
// (helpers/colors.js: STATUS_COLORS / NotificationColors / contractLevelColors) into ONE
// structured token set that lives on `theme.palette.status.*` and is read by <StatusChip>.
//
// Shape:
//   status.semantic.<success|warning|error|info|neutral>  → { main, contrastText, bg, fg }
//   status.<domain>.<ENUM_KEY>                            → { semantic }  (maps a domain enum
//                                                            value to a semantic bucket)
//
// `bg`/`fg` are a tonal pair tuned for an always-labelled chip (soft tinted background + a
// readable foreground that meets ≥4.5:1 on that background) — NEVER color-only; <StatusChip>
// always renders the Arabic label too (UX plan §2). Domain enum VALUES are the Prisma enum
// keys (the data contract); Arabic labels live in statusLabels.js.

import colors from "@/app/v2/lib/theme/colors";

// Five semantic buckets. Each carries a strong `main` (for dots/borders) and a soft tinted
// pair (`bg`/`fg`) for the chip surface. Greens/reds/blues are taken from the existing palette
// so the redesign stays on-brand.
export const STATUS_SEMANTICS = {
  success: {
    main: colors.success,
    contrastText: "#ffffff",
    bg: "#e7eee1",
    fg: colors.successDark,
  },
  warning: {
    // brand caramel is the legacy "warning" — but use the accessible dark caramel for the
    // foreground so the LABEL stays readable on the soft tint.
    main: colors.primary,
    contrastText: "#ffffff",
    bg: colors.primaryAlt,
    fg: colors.primaryTextOnLight,
  },
  error: {
    main: colors.error,
    contrastText: "#ffffff",
    bg: "#f6e4e2",
    fg: colors.errorDark,
  },
  info: {
    main: colors.info,
    contrastText: "#ffffff",
    bg: "#e4eaf0",
    fg: colors.infoDark,
  },
  neutral: {
    main: colors.textTertiary,
    contrastText: "#ffffff",
    bg: colors.bgTertiary,
    fg: colors.textSecondary,
  },
};

// Domain → enum value → semantic bucket. (Values are the Prisma enum keys.)
// lead: ClientLeadStatus · contract: ContractStatus · payment: PaymentStatus +
// PaymentStatusNew · task: TaskStatus · session: SessionStatus / ContractSessionStatus.
export const STATUS_DOMAINS = {
  lead: {
    NEW: "info",
    IN_PROGRESS: "info",
    INTERESTED: "success",
    NEEDS_IDENTIFIED: "warning",
    NEGOTIATING: "warning",
    LEADEXCHANGE: "neutral",
    REJECTED: "error",
    FINALIZED: "success",
    CONVERTED: "success",
    ON_HOLD: "warning",
    ARCHIVED: "neutral",
  },
  contract: {
    IN_PROGRESS: "info",
    COMPLETED: "success",
    CANCELLED: "error",
    // ContractSessionStatus (e-sign lifecycle)
    INITIAL: "neutral",
    SIGNING: "warning",
    REGISTERED: "success",
  },
  payment: {
    PENDING: "warning",
    PARTIALLY_PAID: "info",
    FULLY_PAID: "success",
    OVERDUE: "error",
    // PaymentStatusNew
    RECEIVED: "success",
    TRANSFERRED: "success",
    DUE: "warning",
    NOT_DUE: "neutral",
  },
  task: {
    TODO: "neutral",
    IN_PROGRESS: "info",
    DONE: "success",
    CANCELLED: "error",
  },
  session: {
    INITIAL: "neutral",
    PREVIEW_COLOR_PATTERN: "info",
    SELECTED_COLOR_PATTERN: "info",
    PREVIEW_MATERIAL: "info",
    SELECTED_MATERIAL: "info",
    PREVIEW_STYLE: "info",
    SELECTED_STYLE: "info",
    PREVIEW_IMAGES: "info",
    SELECTED_IMAGES: "warning",
    PDF_GENERATED: "success",
    SUBMITTED: "success",
  },
};

// The object placed on `theme.palette.status`. <StatusChip> reads this.
export const statusPalette = {
  semantic: STATUS_SEMANTICS,
  domains: STATUS_DOMAINS,
};

export default statusPalette;
