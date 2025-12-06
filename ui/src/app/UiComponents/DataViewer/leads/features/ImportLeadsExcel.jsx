import React, { useState } from "react";
import { Button, Box, Typography, Input } from "@mui/material";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import {AiFillCloud} from "react-icons/ai";
import {styled} from "@mui/material/styles";
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

function ImportLeadsExcel() {
    const [file, setFile] = useState(null);
    const { setLoading } = useToastContext();

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        setFile(uploadedFile);
    };

    const handleConfirmUpload = async () => {
        const formData = new FormData();
        formData.append("file", file);

        const request = await handleRequestSubmit(
              formData,
              setLoading,
              `admin/leads/excel`,
              true,
              "Uploading"
        );
    };

    return (
          <Box sx={{ textAlign: "center" }}>
              <Button
                    component="label"
                    role={undefined}
                    variant="contained"
                    tabIndex={-1}
                    startIcon={<AiFillCloud />}
              >
                  Create leads via excel
                  <VisuallyHiddenInput
                        type="file"
                        onChange={handleFileUpload}
                  />
              </Button>
              {file && (
                    <Button
                          variant="contained"
                          color="primary"
                          onClick={handleConfirmUpload}
                          sx={{ textTransform: "none" }}
                    >
                        Upload and Process Leads
                    </Button>
              )}
          </Box>
    );
}

export default ImportLeadsExcel;
