"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import {
  MdList,
  MdArticle,
  MdFormatListBulleted,
  MdLayers,
} from "react-icons/md";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

import { ObligationsDialog } from "@/features/contracts/ContractUtilityPage/dialogs/ObligationsDialog.jsx";
import { StageClausesDialog } from "@/features/contracts/ContractUtilityPage/dialogs/StageClausesDialog.jsx";
import { SpecialClausesDialog } from "@/features/contracts/ContractUtilityPage/dialogs/SpecialClausesDialog.jsx";
import { LevelClausesDialog } from "@/features/contracts/ContractUtilityPage/dialogs/LevelClausesDialog.jsx";

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------

export default function ContractUtilityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [contractUtility, setContractUtility] = useState(null);

  const [openObligations, setOpenObligations] = useState(false);
  const [openStageClauses, setOpenStageClauses] = useState(false);
  const [openSpecialClauses, setOpenSpecialClauses] = useState(false);
  const [openLevelClauses, setOpenLevelClauses] = useState(false);

  const fetchContractUtility = async () => {
    await getDataAndSet({
      url: "shared/site-utilities/contract-utility/details",
      setData: setContractUtility,
      setLoading: setIsLoading,
    });
  };

  useEffect(() => {
    fetchContractUtility();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        إعدادات عقد التصميم (Contract Utility)
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            العناصر المتاحة للتحكم:
          </Typography>

          <List>
            <ListItemButton
              onClick={() => setOpenObligations(true)}
              disabled={isLoading}
            >
              <ListItemText
                primary="التزامات الفريقين (Obligations)"
                secondary="إدارة نص التزامات الفريق الأول والثاني - عربي / إنجليزي"
              />
              <MdArticle size={22} />
            </ListItemButton>

            <ListItemButton
              onClick={() => setOpenStageClauses(true)}
              disabled={isLoading}
            >
              <ListItemText
                primary="بنود المراحل (Stage Clauses)"
                secondary="Heading + Title + Description لكل بند - عربي / إنجليزي"
              />
              <MdList size={22} />
            </ListItemButton>

            <ListItemButton
              onClick={() => setOpenSpecialClauses(true)}
              disabled={isLoading}
            >
              <ListItemText
                primary="بنود خاصة (Special Clauses)"
                secondary="قائمة نصوص جاهزة يمكن إضافتها للعقود - عربي / إنجليزي"
              />
              <MdFormatListBulleted size={22} />
            </ListItemButton>

            <ListItemButton
              onClick={() => setOpenLevelClauses(true)}
              disabled={isLoading}
            >
              <ListItemText
                primary="بنود خاصة بكل مرحلة (Level Clauses)"
                secondary="قائمة نصوص مربوطة بـ ContractLevel (LEVEL_1..LEVEL_7)"
              />
              <MdLayers size={22} />
            </ListItemButton>
          </List>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ObligationsDialog
        open={openObligations}
        onClose={() => setOpenObligations(false)}
        onUpdated={fetchContractUtility}
      />

      <StageClausesDialog
        open={openStageClauses}
        onClose={() => setOpenStageClauses(false)}
        onUpdated={fetchContractUtility}
      />

      <SpecialClausesDialog
        open={openSpecialClauses}
        onClose={() => setOpenSpecialClauses(false)}
        onUpdated={fetchContractUtility}
      />

      <LevelClausesDialog
        open={openLevelClauses}
        onClose={() => setOpenLevelClauses(false)}
        onUpdated={fetchContractUtility}
      />
    </Box>
  );
}
