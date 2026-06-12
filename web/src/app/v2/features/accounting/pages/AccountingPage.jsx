"use client";

// Accounting feature page — the single permission-gated surface that replaces the legacy
// @accountant role-slot routes (payments / payments/3d-status / payments/overdue /
// payments/paid / operational-expenses / rents / salaries / outcome). The active sub-view
// lives in the URL (`?view=`) so back/forward + deep links work; the view set is filtered
// by the user's accounting.* permission codes (the BE grants them to the ACCOUNTANT role
// only). Behavior + appearance preserved from the legacy screens, single-language Arabic/RTL.

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { ACCOUNTING_VIEWS } from "../config/accountingConstants.js";
import { PaymentsKanban } from "../components/PaymentsKanban.jsx";
import { PaymentsTable } from "../components/PaymentsTable.jsx";
import { ExpensesView } from "../components/ExpensesView.jsx";
import { RentsView } from "../components/RentsView.jsx";
import { SalariesView } from "../components/SalariesView.jsx";
import { OutcomeView } from "../components/OutcomeView.jsx";

const P = PERMISSIONS.ACCOUNTING;

// Each view declares which permission code unlocks it. The whole feature is gated on having
// at least one of these (the ACCOUNTANT role holds them all).
const VIEW_PERMS = {
  payments: P.PAYMENT_LIST,
  threeD: P.PAYMENT_LIST,
  overdue: P.PAYMENT_LIST,
  paid: P.PAYMENT_LIST,
  expenses: P.EXPENSE_LIST,
  rents: P.RENT_LIST,
  salaries: P.SALARY_VIEW,
  outcome: P.OUTCOME_LIST,
};

export function AccountingPage() {
  const { hasPermission, hasAnyPermission } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const canAccess = hasAnyPermission(Object.values(P));

  // The views the user is allowed to see, in display order.
  const views = useMemo(
    () => Object.keys(ACCOUNTING_VIEWS).filter((key) => hasPermission(VIEW_PERMS[key])),
    [hasPermission],
  );

  const requested = sp.get("view");
  const active = views.includes(requested) ? requested : views[0];

  function selectView(key) {
    const params = new URLSearchParams(sp.toString());
    params.set("view", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (!canAccess) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى قسم المحاسبة</Typography>
      </Box>
    );
  }

  function renderActive() {
    switch (active) {
      case "payments":
        return <PaymentsKanban mode="level" />;
      case "threeD":
        return <PaymentsKanban mode="three-d" />;
      case "overdue":
        return <PaymentsTable status="OVERDUE" showMarkOverdue />;
      case "paid":
        return <PaymentsTable status="FULLY_PAID" />;
      case "expenses":
        return <ExpensesView />;
      case "rents":
        return <RentsView />;
      case "salaries":
        return <SalariesView />;
      case "outcome":
        return <OutcomeView />;
      default:
        return null;
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        المحاسبة
      </Typography>

      <Tabs
        value={active}
        onChange={(_e, v) => selectView(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {views.map((key) => (
          <Tab key={key} value={key} label={ACCOUNTING_VIEWS[key]} />
        ))}
      </Tabs>

      <Box>{renderActive()}</Box>
    </Container>
  );
}

export default AccountingPage;
