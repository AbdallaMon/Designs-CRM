"use client";
import { PROFILES } from "@dms/shared";
import { useEffect } from "react";

import { checkIfADesigner, checkIfAdmin } from "@/app/helpers/functions/utility.jsx";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { usePermission } from "@/app/hooks/usePermission";
import { PROJECT_CODES } from "@/app/helpers/permissionCodes";
import { PreviewLead } from "@/features/leads/features/PreviewLead.jsx";
import { LeadWorkspace } from "@/features/leads/LeadWorkspace.jsx";
import { WorkStageDialogHeader } from "@/features/leads/shared/WorkStageDialogHeader.jsx";
import { WorkStageCockpit } from "@/features/leads/cockpit/WorkStageCockpit.jsx";
import { getVisibleWorkStageSections } from "@/features/work-stages/config/workStageSections.jsx";

// LeadContent — the shared body of the work-stage (designer) preview. Same shell as the
// deal detail (features/leads/PreviewLeadDialog.jsx): header + cockpit, then the config-
// driven sections rendered by the keyed workspace (no hard-coded tab indices). Sections
// come from features/work-stages/config/workStageSections.jsx.
const LeadContent = ({
  lead,
  activeTab,
  setActiveTab,
  theme,
  handleClose,
  setleads,
  setLead,
  isPage,
  type,
  dontCheckIfNotUser,
  initialTabExplicit,
}) => {
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const { hasPermission } = usePermission();
  // Approved normalization: the admin-only "Projects" tab (legacy exact-role
  // ADMIN||SUPER_ADMIN) gates on the `project.manage` code (admin-tier management set,
  // incl. isSuperSales). Exactly one of the complementary "work"/"projects" sections
  // shows, keyed off this flag.
  const canManageProjects = hasPermission(PROJECT_CODES.MANAGE);

  // notUser: the viewer is not one of this project's assignees (drives read-only affordances).
  const notUser =
    lead.projects?.length > 0 &&
    !lead.projects[0].assignments?.some(
      (assignment) => assignment.user?.id === user.id,
    );

  const showModifications =
    type === "3D_Modification" ||
    (type === "3D_Designer" && lead.projects?.[0]?.status === "Modification");

  const isDesignerView = checkIfADesigner(user) || user.profile === PROFILES.EXECUTOR_2D;

  const workStageCtx = {
    lead,
    user,
    admin: isAdmin,
    notUser: isPage && notUser,
    canManageProjects,
    showModifications,
    setLead,
    setleads,
  };
  const visibleSections = getVisibleWorkStageSections(workStageCtx);

  // Per-role opening section: designers/executors land on their WORK (or the managers'
  // PROJECTS), everyone else on Details. Only when opened without an explicit ?tab=.
  useEffect(() => {
    if (isDesignerView && activeTab === "details" && !initialTabExplicit) {
      setActiveTab(canManageProjects ? "projects" : "work");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <WorkStageDialogHeader
        lead={lead}
        theme={theme}
        handleClose={handleClose}
        isPage={isPage}
        admin={isAdmin}
        user={user}
        setLead={setLead}
        dealLink={`/dashboard/deals/${lead.id}`}
        twoDLink={lead.twoDDesignerId ? `/dashboard/work-stages/two-d/${lead.id}` : null}
      />

      {/* Designer "what do I do next" — backend-computed, assignment-scoped */}
      <WorkStageCockpit actions={lead.workStageActions} />

      {/* Workspace — config-driven sections, keyed (no index math), shared rail */}
      <LeadWorkspace
        sections={visibleSections}
        activeKey={activeTab}
        onChange={setActiveTab}
        ctx={workStageCtx}
      />
    </>
  );
};

const PreviewWorkStage = ({
  open,
  onClose,
  id,
  setleads,
  page = false,
  type,
  setRerenderColumns,
}) => {
  return (
    <PreviewLead
      leadContent={LeadContent}
      id={id}
      open={open}
      onClose={onClose}
      setleads={setleads}
      page={page}
      // Base url carries ?type= — the per-tab data layer splices sub-resources BEFORE
      // the query (LeadDetailsContext.subResourcePath), so notes/calls/files hit
      // shared/projects/designers/:id/{...}?type=... and keep the per-user narrowing.
      url={`projects/designers/${id}?type=${type}&`}
      type={type}
      dontCheckIfNotUser={true}
      setRerenderColumns={setRerenderColumns}
    />
  );
};

export default PreviewWorkStage;
