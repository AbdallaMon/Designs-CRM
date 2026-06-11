"use client";

// Files tab — splits the lead's files into two sections like legacy: "ملفات النظام"
// (staff/system uploads, file.isUserFile !== false) and "ملفات العميل" (client uploads,
// file.isUserFile === false), each its own LeadRecordList with a count. The Add-file dialog
// (gated on canAddFile) lives on the system section. The filename is a MuiLink opening in a
// new tab; the icon adapts to the file type. Graceful when isUserFile is missing (→ system).

import { Stack, Link as MuiLink, Typography } from "@mui/material";
import { MdInsertDriveFile, MdImage, MdPictureAsPdf, MdAttachFile, MdPerson } from "react-icons/md";
import dayjs from "dayjs";
import { useT } from "@/app/v2/lib/i18n";
import { LeadRecordList } from "../LeadRecordList.jsx";
import { AddFileDialog } from "../dialogs/AddFileDialog.jsx";

// Pick a glyph from the filename / url extension. Falls back to a generic file icon.
function fileIconFor(file) {
  const src = (file?.name || file?.url || "").toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/.test(src)) return <MdImage />;
  if (/\.pdf$/.test(src)) return <MdPictureAsPdf />;
  if (src) return <MdInsertDriveFile />;
  return <MdAttachFile />;
}

// A file is a "client" file only when isUserFile is explicitly false. Missing/undefined →
// treat as a system file (graceful default, matches legacy where staff files are the norm).
const isClientFile = (f) => f?.isUserFile === false;

function renderPrimary(f) {
  const label = f.name || f.url || "—";
  return f.url ? (
    <MuiLink
      href={f.url}
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      sx={{ fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 0.5 }}
    >
      <span style={{ display: "inline-flex", fontSize: 18 }}>{fileIconFor(f)}</span>
      {label}
    </MuiLink>
  ) : (
    <Typography variant="body1" sx={{ fontWeight: 500 }}>
      {label}
    </Typography>
  );
}

function renderSecondary(f) {
  return (
    <Typography variant="body2" color="text.secondary" component="span">
      {f.description ? `${f.description} · ` : ""}
      {f.createdAt ? dayjs(f.createdAt).format("YYYY-MM-DD") : ""}
    </Typography>
  );
}

export function FilesTab({ lead, onChanged }) {
  const { t } = useT();
  const caps = lead?.capabilities ?? {};
  const files = Array.isArray(lead?.files) ? lead.files : [];

  const clientFiles = files.filter(isClientFile);
  const systemFiles = files.filter((f) => !isClientFile(f));

  return (
    <Stack spacing={3}>
      <LeadRecordList
        title={t("leadsDetails.files.system.title").replace("{count}", systemFiles.length)}
        icon={<MdAttachFile />}
        items={systemFiles}
        headerAction={
          <AddFileDialog lead={lead} canAdd={caps.canAddFile} onCreated={onChanged} />
        }
        renderPrimary={renderPrimary}
        renderSecondary={renderSecondary}
        emptyTitle={t("leadsDetails.files.system.empty.title")}
        emptyDescription={
          caps.canAddFile
            ? t("leadsDetails.files.system.empty.canAdd")
            : t("leadsDetails.files.system.empty.readonly")
        }
      />

      <LeadRecordList
        title={t("leadsDetails.files.client.title").replace("{count}", clientFiles.length)}
        icon={<MdPerson />}
        items={clientFiles}
        renderPrimary={renderPrimary}
        renderSecondary={renderSecondary}
        emptyTitle={t("leadsDetails.files.client.empty.title")}
        emptyDescription={t("leadsDetails.files.client.empty.description")}
      />
    </Stack>
  );
}
