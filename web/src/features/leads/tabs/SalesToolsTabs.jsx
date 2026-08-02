import React, { useState } from "react";
import {
  alpha,
  Box,
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

import {
  MdAnalytics,
  MdLock,
  MdQuestionAnswer,
  MdTouchApp,
} from "react-icons/md";
import { TabSection, RecordCard } from "@/features/leads/shared/tabKit.jsx";
import { EmptyState } from "@/features/leads/shared/EmptyState.jsx";

import { useToastContext } from "@/app/providers/ToastLoadingProvider";

import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

import { SPAINQuestionsDialog } from "@/features/meeting/SPAIN/SPAINQuestionDialog.jsx";
import { personalityEnum } from "@/app/helpers/constants";
import VersaObjectionSystem from "@/features/meeting/VERSA/VERSADialog.jsx";

import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { FaUser } from "react-icons/fa";

// Thin wrapper over the shared RecordCard so the tool cards match every other card:
// an accent rail + a centered icon header, then the tool's own control in the body.
function ToolCard({ icon, title, subtitle, children }) {
  const theme = useTheme();
  return (
    <RecordCard sx={{ height: "100%" }}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.main,
            fontSize: 28,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        <Box sx={{ width: "100%", pt: 0.5 }}>{children}</Box>
      </Stack>
    </RecordCard>
  );
}

export function SalesToolsTabs({ lead, setLead, setleads }) {
  const { user } = useAuth();
  const [personality, setPersonality] = useState(lead.personality);
  const { setLoading } = useToastContext();
  const isAdmin = checkIfAdmin(user);

  const handleChange = async (event) => {
    const prev = personality;
    const next = event.target.value;
    setPersonality(next);
    const ok = await handleChangePersonality(next);
    if (!ok) setPersonality(prev); // revert optimistic change if the update failed
  };
  async function handleChangePersonality(personality) {
    const request = await handleRequestSubmit(
      { personality, field: "personality", inputType: "text" },
      setLoading,
      `leads/update/${lead.id}`,
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
    return request.status === 200;
  }

  // Defense-in-depth: the section is hidden via leadSections `visible()` when not allowed,
  // so this branch should not normally render — kept as a guard, now a calm empty state.
  if (!isAdmin && !["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"].includes(user.profile)) {
    return (
      <TabSection icon={<MdAnalytics />} title="Client Analysis">
        <EmptyState
          icon={<MdLock />}
          title="You are not allowed to access this tab"
        />
      </TabSection>
    );
  }
  return (
    <TabSection
      icon={<MdAnalytics />}
      title="Client Analysis"
      description="Sales tools — SPIN questions, VERSA objections, and client personality."
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ToolCard
            icon={<MdQuestionAnswer />}
            title="SPIN Questions"
            subtitle="سؤال اسبين"
          >
            <SPAINQuestionsDialog clientLeadId={lead.id} />
          </ToolCard>
        </Grid>

        {["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"].includes(user.profile) &&
        user.profile !== "PRIMARY_SALES" &&
        user.profile !== "SUPER_SALES" ? null : (
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
