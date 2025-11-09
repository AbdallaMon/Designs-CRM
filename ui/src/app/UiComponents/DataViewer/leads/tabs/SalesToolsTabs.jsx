import React, { useState } from "react";
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import { useAuth } from "@/app/providers/AuthProvider";

import { Card, CardContent } from "@mui/material";

import { Grid } from "@mui/material";

import { MdQuestionAnswer, MdTouchApp } from "react-icons/md";

import { useToastContext } from "@/app/providers/ToastLoadingProvider";

import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

import { SPAINQuestionsDialog } from "../../meeting/SPAIN/SPAINQuestionDialog";
import { personalityEnum } from "@/app/helpers/constants";
import VersaObjectionSystem from "../../meeting/VERSA/VERSADialog";

import { checkIfAdmin } from "@/app/helpers/functions/utility";

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
      `shared/lead/update/${lead.id}`,
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
    <Box sx={{ width: "100%", maxWidth: 1200, margin: "0 auto", p: 2 }}>
      <Grid container spacing={3}>
        <Grid size={{ md: 6 }}>
          <Card
            sx={{
              height: "100%",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <MdQuestionAnswer size={48} style={{ marginBottom: 16 }} />
              <Typography
                variant="h5"
                component="h3"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                SPIN Questions
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, fontSize: "0.9rem" }}
              >
                سؤال اسبين
              </Typography>
              <SPAINQuestionsDialog clientLeadId={lead.id} />
            </CardContent>
          </Card>
        </Grid>
        {user.role === "STAFF" && !user.isPrimary ? null : (
          <Grid size={{ md: 6 }}>
            <Card
              sx={{
                height: "100%",
                transition: "transform 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 2 }}>
                <MdTouchApp size={48} style={{ marginBottom: 16 }} />
                <Typography
                  variant="h5"
                  component="h3"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  VERSA Objections
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3, fontSize: "0.9rem" }}
                >
                  نموذج الاعتراضات
                </Typography>
                <VersaObjectionSystem clientLeadId={lead.id} />
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ md: 6 }}>
          <Card
            sx={{
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <FaUser size={48} style={{ marginBottom: 16 }} />
              <Typography
                variant="h5"
                component="h3"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                Client Personality
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 3, fontSize: "0.9rem", opacity: 0.9 }}
              >
                شخصية العميل
              </Typography>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="personality-select-label">
                  {personality ? "Change" : "Select"} Personality
                </InputLabel>
                <Select
                  labelId="personality-select-label"
                  value={personality}
                  label="Select Personality"
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
