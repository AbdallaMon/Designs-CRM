import { Avatar, Box } from "@mui/material";
import SimpleFileInput from "./SimpleFileInput";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

export default function UploadImageWithAvatarPreview({
  value,
  onChange,
  keyId,
  label,
  hide,
}) {
  const { setProgress, setOverlay } = useUploadContext();
  const handleUpload = async (file) => {
    if (!file) return;
    const res = await uploadInChunks(file, setProgress, setOverlay);
    if (res?.status === 200 && res?.url) onChange(keyId, res.url);
  };
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "center",
      }}
    >
      {!hide && (
        <Avatar src={value} alt="Group Icon" sx={{ width: 56, height: 56 }} />
      )}
      <SimpleFileInput
        label={label}
        id={keyId}
        variant="outlined"
        handleUpload={handleUpload}
        input={{ accept: "image/*" }}
      />
    </Box>
  );
}
