"use client";

// Grouped projects for a single lead — migrated from the legacy LeadProjects.jsx. Renders
// the group tabs, the project chips within the active group, and the selected project's
// work-surface (ProjectDetails). On the designer board the grouped projects are supplied
// as `initialProjects` (the BE designer board already groups them); otherwise it loads via
// GET /v2/projects/?clientLeadId= . Each project carries its own capabilities.* (the BE
// dto decorates nested projects[] too), so ProjectDetails gates its actions per-project.

import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  Divider,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { MdFolder } from "react-icons/md";
import { SectionCard, EmptyState, LoadingState } from "@/app/v2/shared/components";
import { projectsService } from "../projects.service.js";
import { ProjectDetails } from "./ProjectDetails.jsx";

export function LeadProjects({ clientLeadId, initialProjects, noInitialLoad = false }) {
  const [groupedProjects, setGroupedProjects] = useState(initialProjects || []);
  const [loading, setLoading] = useState(!noInitialLoad);
  const [activeProject, setActiveProject] = useState(null);
  const [activeGroupTab, setActiveGroupTab] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectsService.listByLead(clientLeadId);
      const items = Array.isArray(res?.data?.items) ? res.data.items : [];
      setGroupedProjects(items);
      if (items.length > 0 && items[0].projects?.length > 0) {
        setActiveProject(items[0].projects[0]);
      }
    } catch {
      setGroupedProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noInitialLoad) {
      setGroupedProjects(initialProjects || []);
      if (initialProjects?.[0]?.projects?.length > 0) {
        setActiveProject(initialProjects[0].projects[0]);
      }
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientLeadId]);

  const handleProjectUpdate = (updatedProject) => {
    if (!updatedProject?.id) return;
    setGroupedProjects((groups) =>
      groups.map((g) => ({
        ...g,
        projects: g.projects?.map((p) => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p)),
      })),
    );
    if (activeProject?.id === updatedProject.id) setActiveProject((p) => ({ ...p, ...updatedProject }));
  };

  if (loading) {
    return (
      <SectionCard title="المشاريع">
        <LoadingState variant="cards" count={3} columns={3} height={200} />
      </SectionCard>
    );
  }

  if (groupedProjects.length === 0) {
    return (
      <SectionCard title="المشاريع">
        <EmptyState
          icon={<MdFolder />}
          title="لا توجد مشاريع"
          description="لم يتم إنشاء أي مشروع لهذا العميل بعد."
        />
      </SectionCard>
    );
  }

  const currentGroup = groupedProjects[activeGroupTab] || {};

  return (
    <SectionCard title="المشاريع" noPadding>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeGroupTab}
          onChange={(_e, v) => {
            setActiveGroupTab(v);
            const g = groupedProjects[v];
            setActiveProject(g?.projects?.length ? g.projects[0] : null);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          {groupedProjects.map((group) => (
            <Tab
              key={group.groupId}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <MdFolder size={16} />
                  <Typography variant="body2">{group.groupTitle}</Typography>
                  <Chip label={group.projects?.length ?? 0} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                </Box>
              }
              sx={{ textTransform: "none", minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ p: 2.5 }}>
        <Box display="flex" gap={1.5} flexWrap="wrap" mb={3}>
          {currentGroup.projects?.map((project) => (
            <Chip
              key={project.id}
              label={project.type?.replace(/_/g, " ")}
              onClick={() => setActiveProject(project)}
              color={activeProject?.id === project.id ? "primary" : "default"}
              variant={activeProject?.id === project.id ? "filled" : "outlined"}
              sx={{ px: 1, py: 2.5 }}
            />
          ))}
          {(!currentGroup.projects || currentGroup.projects.length === 0) && (
            <Typography variant="body2" color="text.secondary">
              لا توجد مشاريع في هذه المجموعة
            </Typography>
          )}
        </Box>

        {activeProject ? (
          <>
            <Divider sx={{ my: 2 }} />
            <ProjectDetails project={activeProject} onUpdate={handleProjectUpdate} />
          </>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <Typography variant="h6" color="text.secondary">
              لم يتم اختيار مشروع
            </Typography>
          </Box>
        )}
      </Box>
    </SectionCard>
  );
}

export default LeadProjects;
