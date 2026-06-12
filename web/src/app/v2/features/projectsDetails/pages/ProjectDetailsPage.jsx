"use client";

// Single-project detail page (was the legacy ProjectPage → ProjectDetails for the
// @{admin,super_admin,super_sales,threeD,twoD}/projects/[id] role slots — collapsed into
// ONE permission-gated route). GET /v2/projects/:id returns the project + capabilities.*;
// the work-surface (ProjectDetails) gates each action on those caps × the permission code.
//
// Tabs live in the URL (?tab=): "overview" (the work-surface: progress, status, edit,
// designers, delivery, tasks) and "updates" (the lead's updates/approvals surface). The
// updates tab is shown only when the caller has UPDATE.LIST. The tab content is lazy: the
// updates list only fetches when its tab is opened.

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Alert, Box, Button, CircularProgress, Container, Tab, Tabs } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import { PageHeader } from "@/app/v2/shared/components";
import { projectsService } from "../../projects/projects.service.js";
import { PROJECT_TYPE_LABELS } from "../../projects/config/projectsConstants.js";
import { ProjectDetails } from "../../projects/components/ProjectDetails.jsx";
import { UpdatesList } from "../../projects/components/updates/UpdatesList.jsx";

export function ProjectDetailsPage({ projectId }) {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const canView = hasPermission(PERMISSIONS.PROJECT.VIEW);
  const canViewUpdates = hasPermission(PERMISSIONS.UPDATE.LIST);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const sp = useSearchParams();

  const validTabs = useMemo(
    () => ["overview", ...(canViewUpdates ? ["updates"] : [])],
    [canViewUpdates],
  );
  const active = validTabs.includes(sp.get("tab")) ? sp.get("tab") : "overview";
  const hrefForTab = useCallback(
    (k) => {
      const p = new URLSearchParams(sp.toString());
      p.set("tab", k);
      return `${pathname}?${p.toString()}`;
    },
    [pathname, sp],
  );

  useEffect(() => {
    if (!projectId || !canView) {
      setLoading(false);
      return;
    }
    let active2 = true;
    (async () => {
      setLoading(true);
      try {
        const res = await projectsService.getProject(projectId);
        if (active2) setProject(res?.data ?? null);
      } catch {
        if (active2) setProject(null);
      } finally {
        if (active2) setLoading(false);
      }
    })();
    return () => {
      active2 = false;
    };
  }, [projectId, canView]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("projectsDetails.notFound")}
        </Alert>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button variant="outlined" onClick={() => window.history.back()}>
            {t("projectsDetails.back")}
          </Button>
        </Box>
      </Box>
    );
  }

  // Parent-lead breadcrumb (الإنتاج ‹ المشاريع ‹ {lead client} #leadId (link) ‹ {project} #id).
  // clientLeadId is always in the project payload; the client name is shown when present. The
  // lead crumb links back to the lead hub so the project is never a dead-end. No extra fetch.
  const leadId = project.clientLeadId;
  const leadName = project.clientLead?.client?.name;
  const projectLabel = PROJECT_TYPE_LABELS[project.type] || t("projectsDetails.label.project");
  const breadcrumbs = [
    { label: t("projectsDetails.label.production") },
    { label: t("projectsDetails.label.projects"), href: "/v2/projects" },
    ...(leadId != null
      ? [{ label: `${leadName || t("projectsDetails.label.client")} #${leadId}`, href: `/v2/leads/${leadId}` }]
      : []),
    { label: `${projectLabel} #${project.id}` },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title={`${projectLabel} #${project.id}`}
        roleChip={false}
        breadcrumbs={breadcrumbs}
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={active}>
          <Tab value="overview" label={t("projectsDetails.tab.overview")} component={Link} href={hrefForTab("overview")} scroll={false} />
          {canViewUpdates && (
            <Tab value="updates" label={t("projectsDetails.tab.updates")} component={Link} href={hrefForTab("updates")} scroll={false} />
          )}
        </Tabs>
      </Box>

      {active === "overview" && (
        <ProjectDetails project={project} onUpdate={(updated) => setProject((p) => ({ ...p, ...updated }))} />
      )}
      {active === "updates" && canViewUpdates && (
        <UpdatesList clientLeadId={project.clientLeadId} />
      )}
    </Container>
  );
}

export default ProjectDetailsPage;
