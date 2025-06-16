import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Slide,
} from "@mui/material";
import { IoMdClose } from "react-icons/io";
import SignatureCanvas from "react-signature-canvas";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SignatureComponent = ({ session, token, onClose, onSignatureSaved }) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const sigCanvas = useRef({});
  const { setLoading: setToastLoading } = useToastContext();

  const handleClearCanvas = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleDownloadSignature = () => {
    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas();
      const dataUrl = canvas.toDataURL("image/png");

      // Create download link
      const link = document.createElement("a");
      link.download = `signature-${session || "custom"}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const getSignatureAsFile = async () => {
    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas();
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      const file = new File([blob], `signature-${token || "custom"}.png`, {
        type: "image/png",
      });
      return file;
    }
    return null;
  };

  const handleExternalUpload = async () => {
    const file = await getSignatureAsFile();
    if (file) {
      // Now you can use this file with any upload service
      console.log("File ready for upload:", file);

      // Example: Upload to a different service
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await handleRequestSubmit(
        formData,
        setToastLoading,
        "client/upload",
        true,
        "Uploading file"
      );
      const url = uploadResponse.fileUrls.file[0];
      const request = await handleRequestSubmit(
        { sessionData: session, signatureUrl: url },
        setToastLoading,
        `client/image-session/generate-pdf`,
        false,
        "Approving"
      );
      if (request.status === 200) {
        onSignatureSaved();
      }
      console.log(request, "submit");
    }
  };

  return (
    <Box>
      <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
        {previewMode ? "Preview Your Signature" : "Draw Your Signature"}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 2,
          bgcolor: "#fff",
          width: "100%",
          maxWidth: 800,
          margin: "auto",
        }}
      >
        <SignatureCanvas
          penColor="black"
          canvasProps={{
            width: window.innerWidth > 600 ? 600 : window.innerWidth - 40,
            height: 200,
            className: "sigCanvas",
            style: { border: "2px solid #000" },
          }}
          ref={sigCanvas}
          clearOnResize={false}
        />

        <Box
          sx={{
            mt: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Button
              variant="outlined"
              onClick={handleClearCanvas}
              sx={{ mr: 1 }}
            >
              Clear
            </Button>
            <Button onClick={handleExternalUpload} variant="contained">
              Approve
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignatureComponent;
