"use client";
import React, { useMemo, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import { Grid } from "@mui/material";

import { CHAT_ROOM_TYPES } from "../../utils";
import { PROJECT_TYPES } from "@/app/helpers/constants";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { MdClose } from "react-icons/md";
import ProjectGroupMultiSelect from "../../../work-stages/projects/ProjectGroupMultiSelector";

export default function CreateLeadChatGroup({
  open,
  onClose,
  clientLeadId,
  onCreate,
  isAdmin,
}) {
  const { user } = useAuth();
  if (!isAdmin) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          pr: 6,
          py: 2.2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Create New Client Lead Group Chat
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
            Choose the chat type, then configure members/projects.
          </Typography>
        </Box>

        <IconButton onClick={onClose} aria-label="close">
          <MdClose />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }} dividers>
        <LeadChatGroupForm
          clientLeadId={clientLeadId}
          onCreate={onCreate}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function LeadChatGroupForm({ clientLeadId, onCreate, onClose }) {
  const [step, setStep] = useState(0);

  const [data, setData] = useState({
    groupType: null, // CHAT_ROOM_TYPES.CLIENT_TO_STAFF || CHAT_ROOM_TYPES.MULTI_PROJECT

    // ✅ multi-select group ids
    projectGroupIds: [],
    selectedProjectsTypes: [],

    // Step 2 (CLIENT_TO_STAFF questions)
    addClient: false,
    addRelatedSalesStaff: false,
    addRelatedDesigners: false,

    // required only if addClient = true
  });

  const { setAlertError } = useAlertContext();

  const steps = useMemo(() => ["Chat type", "Configure"], []);

  const isClientToStaff = data.groupType === CHAT_ROOM_TYPES.CLIENT_TO_STAFF;
  const isMultiProject = data.groupType === CHAT_ROOM_TYPES.MULTI_PROJECT;

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function validateCurrentStep() {
    // Step 1 validations
    if (step === 0) {
      if (!data.groupType)
        return "Please select a chat type before continuing.";
      return null;
    }

    // Step 2 validations
    if (step === 1) {
      if (isClientToStaff) {
        const hasAny =
          data.addClient ||
          data.addRelatedSalesStaff ||
          data.addRelatedDesigners;
        if (!hasAny) {
          return "Please choose at least one option (client / sales staff / designers).";
        }
      }

      if (isMultiProject) {
        if (!data.projectGroupIds?.length)
          return "Please select at least one Project Group.";
        if (!data.selectedProjectsTypes?.length) {
          return "Please select at least one Project Type.";
        }
      }

      return null;
    }

    return null;
  }

  function handleNext() {
    const err = validateCurrentStep();
    if (err) {
      setAlertError(err);
      return;
    }

    if (step === steps.length - 1) {
      // final step
      onCreate({ ...data, clientLeadId }, onClose); // ✅ now sends projectGroupIds: number[]
      return;
    }

    setStep((prev) => prev + 1);
  }

  function handleBack() {
    setStep((prev) => Math.max(0, prev - 1));
  }

  return (
    <Box>
      <Stepper activeStep={step} sx={{ mb: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mb: 2 }}>
        {step === 0 && (
          <LeadGroupTypeSelect
            value={data.groupType}
            onChange={(val) => {
              // reset step-2 fields when changing type
              setData((prev) => ({
                ...prev,
                groupType: val,
                projectGroupIds: [],
                selectedProjectsTypes: [],
                addClient: false,
                addRelatedSalesStaff: false,
                addRelatedDesigners: false,
              }));
            }}
          />
        )}

        {step === 1 && (
          <Box>
            {isClientToStaff ? (
              <ClientToStaffQuestions data={data} onChange={update} />
            ) : (
              <ProjectsSelectionStep
                data={data}
                clientLeadId={clientLeadId}
                onSelect={update}
              />
            )}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button variant="outlined" onClick={handleBack} disabled={step === 0}>
          Back
        </Button>

        <Stack direction="row" spacing={1.2} alignItems="center">
          {data.groupType && (
            <Chip
              size="small"
              label={
                data.groupType === CHAT_ROOM_TYPES.CLIENT_TO_STAFF
                  ? "Client ↔ Staff"
                  : "Multi Project"
              }
              sx={{ fontWeight: 700 }}
            />
          )}

          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ px: 3, fontWeight: 800 }}
          >
            {step === steps.length - 1 ? "Create" : "Next"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function LeadGroupTypeSelect({ value, onChange }) {
  const options = [
    {
      type: CHAT_ROOM_TYPES.CLIENT_TO_STAFF,
      title: "Client ↔ Staff Chat",
      desc: "Private chat between client and internal team.",
    },
    {
      type: CHAT_ROOM_TYPES.MULTI_PROJECT,
      title: "Multi Project Chat",
      desc: "Group chat linked to project group + project types.",
    },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
        Select Chat Type
      </Typography>

      <Grid Grid spacing={1.5}>
        {options.map((opt) => {
          const selected = value === opt.type;
          return (
            <Grid size={6} key={opt.type}>
              <Box
                onClick={() => onChange(opt.type)}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: selected ? "primary.main" : "divider",
                  cursor: "pointer",
                  transition: "0.15s",
                  backgroundColor: selected
                    ? "action.selected"
                    : "background.paper",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>{opt.title}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
                  {opt.desc}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

function ClientToStaffQuestions({ data, onChange }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
        Who should be added to this chat?
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.75, mb: 2 }}>
        Answer these questions to build the members list.
      </Typography>

      <Stack spacing={1.2}>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={data.addClient}
                onChange={(e) => onChange("addClient", e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 800 }}>Add client</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Client will join this chat from their side.
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={data.addRelatedSalesStaff}
                onChange={(e) =>
                  onChange("addRelatedSalesStaff", e.target.checked)
                }
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 800 }}>
                  Add related sales staff
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Auto-include assigned/related sales members for this lead.
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={data.addRelatedDesigners}
                onChange={(e) =>
                  onChange("addRelatedDesigners", e.target.checked)
                }
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 800 }}>
                  Add related designers
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Auto-include designers linked to the lead/projects.
                </Typography>
              </Box>
            }
          />
        </Box>
      </Stack>
    </Box>
  );
}

function ProjectsSelectionStep({ clientLeadId, onSelect, data }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
        Select Projects
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.75, mb: 2 }}>
        Pick one or more project groups, then choose the project types for the
        chat.
      </Typography>

      <ProjectGroups
        value={data.projectGroupIds}
        onChange={(value) => onSelect("projectGroupIds", value)}
        clientLeadId={clientLeadId}
      />

      {data.projectGroupIds?.length > 0 && (
        <ProjectTypesSelection
          selectedTypes={data.selectedProjectsTypes}
          onChange={(types) => onSelect("selectedProjectsTypes", types)}
        />
      )}
    </Box>
  );
}

function ProjectGroups({ clientLeadId, value, onChange }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        Project Groups
      </Typography>

      <ProjectGroupMultiSelect
        value={value}
        onChange={onChange}
        clientLeadId={clientLeadId}
      />
    </Box>
  );
}

function ProjectTypesSelection({ selectedTypes, onChange }) {
  return (
    <Box mt={2}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        Project Types
      </Typography>

      <Grid container spacing={1.2}>
        {PROJECT_TYPES.map((type) => {
          const selected = selectedTypes.includes(type);
          return (
            <Grid size={6} key={type}>
              <Box
                onClick={() => {
                  if (selected) {
                    onChange(
                      selectedTypes.filter(
                        (selectedType) => selectedType !== type
                      )
                    );
                  } else {
                    onChange([...(selectedTypes || []), type]);
                  }
                }}
                sx={{
                  p: 1.6,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: selected ? "primary.main" : "divider",
                  backgroundColor: selected
                    ? "action.selected"
                    : "background.paper",
                  cursor: "pointer",
                  transition: "0.15s",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Typography sx={{ fontWeight: selected ? 900 : 600 }}>
                  {type}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
