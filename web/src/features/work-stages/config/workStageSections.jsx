"use client";
// Config-driven section registry for the WORK-STAGE (designer) preview.
//
// This mirrors the lead/deal detail registry (features/leads/config/leadSections.jsx)
// so both surfaces render through the SAME keyed workspace + grouped rail
// (LeadWorkspace) instead of two divergent tab implementations. Only the section SET
// and their bodies differ; the shell, the per-tab data layer, and the count badges are
// shared. Groups reuse LEAD_SECTION_GROUPS so LeadWorkspace needs no changes.
//
// Each entry: { key, label, group, icon, tabKey?, visible(ctx), count(ctx), render(ctx) }.
// `tabKey` links a section to its per-tab cache (LeadDetailsProvider) for live badges +
// lazy loading (notes/calls/files fetch on first open via the designer sub-resource
// routes: shared/projects/designers/:id/{notes,call-reminders,files}).
import { Button, Chip, Paper, Stack, useTheme } from "@mui/material";
import { BsFileText, BsInfoCircle, BsPersonCheckFill, BsTelephone } from "react-icons/bs";
import { GoPaperclip } from "react-icons/go";
import { MdModeEdit, MdTask, MdWork } from "react-icons/md";

import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { LeadInfo } from "@/features/leads/panels/LeadInfo.jsx";
import { LeadContactInfo } from "@/features/leads/panels/LeadContactInfo.jsx";
import { InfoCard } from "@/features/leads/core/InfoCard.jsx";
import { CallReminders } from "@/features/leads/tabs/CallReminders.jsx";
import { LeadNotes } from "@/features/leads/tabs/LeadsNotes.jsx";
import { FileList } from "@/features/leads/tabs/Files.jsx";
import { TasksList } from "@/features/tasks/TasksList.jsx";
import LeadProjects from "@/features/work-stages/projects/LeadProjects.jsx";
import { ProjectDetails } from "@/features/work-stages/projects/ProjectDetails.jsx";

// The Details ("overview") body — the always-present work-stage lead data. Ported 1:1
// from the previous inline `LeadData`, INCLUDING its role-based visibility so exactly the
// same content shows/hides per viewer (the role→profile sweep will migrate these gates).
function WorkStageOverview({ lead, canManageProjects }) {
  const theme = useTheme();
  const { user } = useAuth();
  const isStaff = ["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"].includes(user.profile);
  return (
    <Stack spacing={3}>
      {/* Lead info + related projects: hidden for STAFF (sales) viewers, as before. */}
      {!isStaff && (
        <>
          <LeadInfo lead={lead} />
          <InfoCard title="Related Projects" icon={BsPersonCheckFill} theme={theme}>
            <>
              {canManageProjects && (
                <Button
                  variant="contained"
                  color="primary"
                  component="a"
                  href={`/dashboard/projects/grouped/${lead.id}`}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                >
                  See all the projects of this lead
                </Button>
              )}
              {lead.projects?.map((project) => (
                <Paper
                  key={project.id}
                  elevation={0}
                  sx={{
                    bgcolor: "background.paper",
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 4,
                    border: (t) => `1px solid ${t.palette.divider}`,
                  }}
                >
                  <Chip
                    label={project.type.replace(/_/g, " ")}
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: 2, mb: 2 }}
                  />
                  <ProjectDetails
                    project={project}
                    isStaff={user.profile !== "ADMIN" && user.profile !== "SUPER_ADMIN"}
                    withReleventLinks={true}
                  />
                </Paper>
              ))}
            </>
          </InfoCard>
        </>
      )}
      {/* Contact info: shown to ADMIN (matches the previous surface's effective behavior). */}
      {user.profile === "ADMIN" && <LeadContactInfo lead={lead} />}
    </Stack>
  );
}

// The DESIGNER "work" body (non-managers): the consolidated project surface + open tasks.
function WorkStageWork({ lead, setLead }) {
  return (
    <>
      {lead.projects?.map((project) => (
        <ProjectDetails
          key={project.id}
          project={project}
          onUpdate={
            setLead
              ? (updated) =>
                  setLead((old) => ({
                    ...old,
                    projects: old.projects.map((p) =>
                      p.id === updated.id ? { ...p, ...updated } : p,
                    ),
                  }))
              : undefined
          }
          withReleventLinks={false}
        />
      ))}
      {lead.projects?.[0] && <TasksList projectId={lead.projects[0].id} type="PROJECT" />}
    </>
  );
}

// Groups are shared with the lead registry (LeadWorkspace iterates LEAD_SECTION_GROUPS).
// Work-stage uses overview / activity / commercial / delivery.
export const WORK_STAGE_SECTIONS = [
  {
    key: "details",
    label: "Details",
    group: "overview",
    icon: <BsInfoCircle size={18} />,
    visible: () => true,
    render: (ctx) => (
      <WorkStageOverview lead={ctx.lead} canManageProjects={ctx.canManageProjects} />
    ),
  },
  {
    key: "calls",
    label: "Calls",
    group: "activity",
    icon: <BsTelephone size={18} />,
    tabKey: "calls",
    count: (ctx) => ctx.lead.callReminders?.length,
    visible: () => true,
    render: (ctx) => (
      <CallReminders
        admin={ctx.admin}
        lead={ctx.lead}
        setleads={ctx.setleads}
        notUser={ctx.notUser}
      />
    ),
  },
  {
    key: "notes",
    label: "Notes",
    group: "activity",
    icon: <BsFileText size={18} />,
    tabKey: "notes",
    count: (ctx) => ctx.lead.notes?.length,
    visible: () => true,
    render: (ctx) => (
      <LeadNotes admin={ctx.admin} lead={ctx.lead} notUser={ctx.notUser} />
    ),
  },
  {
    key: "attachments",
    label: "Attachments",
    group: "commercial",
    icon: <GoPaperclip size={18} />,
    tabKey: "files",
    count: (ctx) => ctx.lead.files?.length,
    visible: () => true,
    render: (ctx) => (
      <FileList admin={ctx.admin} lead={ctx.lead} notUser={ctx.notUser} />
    ),
  },
  {
    // Designer "what do I work on" surface — shown to non-managers only.
    key: "work",
    label: "Work",
    group: "delivery",
    icon: <MdTask size={18} />,
    visible: (ctx) => !ctx.canManageProjects,
    render: (ctx) => <WorkStageWork lead={ctx.lead} setLead={ctx.setLead} />,
  },
  {
    // Manager "all projects for this lead" surface — complementary to "work".
    key: "projects",
    label: "Projects",
    group: "delivery",
    icon: <MdWork size={18} />,
    visible: (ctx) => ctx.canManageProjects,
    render: (ctx) => <LeadProjects clientLeadId={ctx.lead.id} />,
  },
  {
    key: "modifications",
    label: "Modifications",
    group: "delivery",
    icon: <MdModeEdit size={18} />,
    visible: (ctx) => ctx.showModifications,
    render: (ctx) => (
      <TasksList name="Modification" type="MODIFICATION" clientLeadId={ctx.lead.id} />
    ),
  },
];

// Visible sections for the current context, in registry order.
export function getVisibleWorkStageSections(ctx) {
  return WORK_STAGE_SECTIONS.filter((s) => s.visible(ctx));
}
