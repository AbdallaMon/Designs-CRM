"use client";
import { Grid2 as Grid } from "@mui/material";
import DesignerMetricsCard from "./DesignerMatricsCard";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { ProjectsList } from "./ProjectList";

const DesignerDashboard = ({ staff, staffId }) => {
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
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
