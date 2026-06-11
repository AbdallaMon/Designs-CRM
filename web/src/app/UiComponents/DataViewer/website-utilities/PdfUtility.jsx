"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Stack, Typography, IconButton, Grid, Container } from "@mui/material";
import { FaSync } from "react-icons/fa";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

import PdfUtilityFieldCard from "./PdfUtilityFieldCard";
import LoadingOverlay from "../../feedback/loaders/LoadingOverlay";

export default function PdfUtility({
  fields = [
    {
      key: "pdfFrame",
      label: "PDF Frame",
      endpoint: "shared/site-utilities/pdf-utility",
    },
    // {
    //   key: "pdfHeader",
    //   label: "PDF Header",
    //   endpoint: "shared/site-utilities",
    // },
    {
      key: "introPage",
      label: "Intro Page",
      endpoint: "shared/site-utilities/pdf-utility",
    },
    // {
    //   key: "pageTitle",
    //   label: "Page Title",
    //   endpoint: "shared/site-utilities",
    // },
  ],
  fetchUrl = "shared/site-utilities/pdf-utility",
}) {
  const [data, setData] = useState(null);
  const [loading, setLoadingState] = useState(true);

  const fetchData = useCallback(async () => {
    await getDataAndSet({
      url: fetchUrl,
      setData,
      setLoading: setLoadingState,
    });
  }, [fetchUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  return (
    <Container maxWidth="xl" sx={{ position: "relative", py: 4 }}>
      {loading && <LoadingOverlay />}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Website Utility</Typography>
        <IconButton onClick={fetchData}>
          <FaSync />
        </IconButton>
      </Stack>

      <Grid container spacing={2}>
        {data &&
          fields?.map((f) => {
            const value = data?.[f.key] || "";
            return (
              <Grid size={{ md: 6 }} key={f.key}>
                <PdfUtilityFieldCard
                  title={f.label}
                  value={value}
                  onSubmit={fetchData}
                  itemKey={f.key}
                />
              </Grid>
            );
          })}
      </Grid>
    </Container>
  );
}
