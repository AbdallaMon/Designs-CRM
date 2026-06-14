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
import { TabSection, RecordCard } from "../shared/tabKit";
import { EmptyState } from "../shared/EmptyState";

import { useToastContext } from "@/app/providers/ToastLoadingProvider";

import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

import { SPAINQuestionsDialog } from "../../meeting/SPAIN/SPAINQuestionDialog";
import { personalityEnum } from "@/app/helpers/constants";
import VersaObjectionSystem from "../../meeting/VERSA/VERSADialog";

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

  // Defense-in-depth: the section is hidden via leadSections `visible()` when not allowed,
  // so this branch should not normally render — kept as a guard, now a calm empty state.
  if (!isAdmin && user.role !== "STAFF") {
    return (
      <TabSection icon={<MdAnalytics />} title="تحليل العميل">
        <EmptyState
          icon={<MdLock />}
          title="لا تملك صلاحية الوصول لهذا التبويب"
        />
      </TabSection>
    );
  }
  return (
    <TabSection
      icon={<MdAnalytics />}
      title="تحليل العميل"
      description="أدوات المبيعات — أسئلة سبين، اعتراضات فيرسا، وشخصية العميل."
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ToolCard
            icon={<MdQuestionAnswer />}
            title="أسئلة سبين"
            subtitle="SPIN Questions"
          >
            <SPAINQuestionsDialog clientLeadId={lead.id} />
          </ToolCard>
        </Grid>

        {user.role === "STAFF" && !user.isPrimary ? null : (
          <Grid size={{ xs: 12, md: 6 }}>
            <ToolCard
              icon={<MdTouchApp />}
              title="اعتراضات فيرسا"
              subtitle="VERSA Objections"
            >
              <VersaObjectionSystem clientLeadId={lead.id} />
            </ToolCard>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <ToolCard
            icon={<FaUser />}
            title="شخصية العميل"
            subtitle="Client Personality"
          >
            <FormControl sx={{ minWidth: 200 }} fullWidth>
              <InputLabel id="personality-select-label">
                {personality ? "تغيير" : "اختيار"} الشخصية
              </InputLabel>
              <Select
                labelId="personality-select-label"
                value={personality}
                label={`${personality ? "تغيير" : "اختيار"} الشخصية`}
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
