"use client";

// Files tab — lists the lead's files and exposes the Add-file dialog (header add-button; chunk
// upload + POST /:id/files). Gated on canAddFile (unchanged). Body = shared LeadRecordList; the
// filename is a MuiLink opening in a new tab; the icon adapts to the file type.

import { Link as MuiLink, Typography } from "@mui/material";
import { MdInsertDriveFile, MdImage, MdPictureAsPdf, MdAttachFile } from "react-icons/md";
import dayjs from "dayjs";
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

export function FilesTab({ lead, onChanged }) {
  const caps = lead?.capabilities ?? {};
  const files = Array.isArray(lead?.files) ? lead.files : [];

  return (
    <LeadRecordList
      title="المرفقات"
      icon={<MdAttachFile />}
      items={files}
      headerAction={
        <AddFileDialog lead={lead} canAdd={caps.canAddFile} onCreated={onChanged} />
      }
      renderPrimary={(f) => {
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
      }}
      renderSecondary={(f) => (
        <Typography variant="body2" color="text.secondary" component="span">
          {f.description ? `${f.description} · ` : ""}
          {f.createdAt ? dayjs(f.createdAt).format("YYYY-MM-DD") : ""}
        </Typography>
      )}
      emptyTitle="لا توجد مرفقات"
      emptyDescription={
        caps.canAddFile
          ? "أرفق ملفاً (صورة، PDF، مستند) متعلقاً بهذا العميل."
          : "لم يُرفق أي ملف لهذا العميل بعد."
      }
    />
  );
}
