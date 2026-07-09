"use client";
import { Grid } from "@mui/material";
import DesignerMetricsCard from "./DesignerMatricsCard";
import { usePermission } from "@/app/hooks/usePermission";
import { PROJECT_CODES } from "@/app/helpers/permissionCodes";
import { ProjectsList } from "./ProjectList";

const DesignerDashboard = ({ staff, staffId }) => {
  // Approved normalization (profiles sweep): admin viewing a designer's projects moved off
  // checkIfAdmin (ADMIN/SUPER_ADMIN/CONTACT_INITIATOR) to the project.manage code — drops
  // CONTACT_INITIATOR, adds isSuperSales (matches the proper admin-tier grant).
  const { hasPermission } = usePermission();
  const isAdmin = hasPermission(PROJECT_CODES.MANAGE);
  return (
    <>
      <Grid container spacing={4}>
        <Grid size={12}>
          <DesignerMetricsCard staff={staff} staffId={staffId} />
        </Grid>
        {isAdmin && (
          <Grid size={12}>
            <ProjectsList userId={staffId} />
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default DesignerDashboard;
