import React, { useState } from "react";
import {
  alpha,
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import { useAuth } from "@/app/providers/AuthProvider";

import { MdAnalytics, MdQuestionAnswer, MdTouchApp } from "react-icons/md";
import { TabSection } from "../shared/tabKit";

import { useToastContext } from "@/app/providers/ToastLoadingProvider";

import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

import { SPAINQuestionsDialog } from "../../meeting/SPAIN/SPAINQuestionDialog";
import { personalityEnum } from "@/app/helpers/constants";
import VersaObjectionSystem from "../../meeting/VERSA/VERSADialog";

import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { FaUser } from "react-icons/fa";

function ToolCard({ icon, title, subtitle, children }) {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        transition: "all 0.25s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[6],
          borderColor: alpha(theme.palette.primary.main, 0.4),
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontSize: 30,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Box sx={{ width: "100%", pt: 1 }}>{children}</Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SalesToolsTabs({ lead, setLead, setleads }) {
  const { user } = useAuth();
  const [personality, setPersonality] = useState(lead.personality);
  const { setLoading } = useToastContext();
  const isAdmin = checkIfAdmin(user);

  const handleChange = async (event) => {
    setPersonality(event.target.value);
    await handleChangePersonality(event.target.value);
  };
  async function handleChangePersonality(personality) {
    const request = await handleRequestSubmit(
      { personality },
      setLoading,
      `shared/client-leads/update/${lead.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (request.status === 200) {
      if (setleads) {
        setleads((oldleads) =>
          oldleads.map((l) => {
            if (l.id === lead.id) {
              return { ...l, personality };
            }
            return l;
          })
        );
      }
      if (setLead) {
        setLead({ ...lead, personality });
      }
    }
  }
  if (!isAdmin && user.role !== "STAFF") {
    return (
      <Alert severity="error">You are not allowed to access this tab </Alert>
    );
  }
  return (
    <TabSection
      icon={<MdAnalytics />}
      title="Client analysis"
      description="Sales tools — SPIN questions, VERSA objections and client personality."
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ToolCard
            icon={<MdQuestionAnswer />}
            title="SPIN Questions"
            subtitle="سؤال اسبين"
          >
            <SPAINQuestionsDialog clientLeadId={lead.id} />
          </ToolCard>
        </Grid>

        {user.role === "STAFF" && !user.isPrimary ? null : (
          <Grid size={{ xs: 12, md: 6 }}>
            <ToolCard
              icon={<MdTouchApp />}
              title="VERSA Objections"
              subtitle="نموذج الاعتراضات"
            >
              <VersaObjectionSystem clientLeadId={lead.id} />
            </ToolCard>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <ToolCard
            icon={<FaUser />}
            title="Client Personality"
            subtitle="شخصية العميل"
          >
            <FormControl sx={{ minWidth: 200 }} fullWidth>
              <InputLabel id="personality-select-label">
                {personality ? "Change" : "Select"} Personality
              </InputLabel>
              <Select
                labelId="personality-select-label"
                value={personality}
                label={`${personality ? "Change" : "Select"} Personality`}
                onChange={async (e) => await handleChange(e)}
                displayEmpty
              >
                {Object.entries(personalityEnum).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </ToolCard>
        </Grid>
      </Grid>
    </TabSection>
  );
}
