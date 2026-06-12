"use client";

// NewLeadsList — binds to GET /v2/dashboard/latest-leads (no args; global new-lead pool).
// Response .data shape (getLatestNewLeads): an ARRAY of the 5 newest NEW leads
//   { id, client: { id, name }, status, createdAt }
// Mirrors the legacy NewLeadsList (Card + List + status Chip + "view all" button), Arabic.
// Links target the v2 leads route (/v2/leads) rather than the legacy /dashboard/leads.

import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import Link from "next/link";
import dayjs from "dayjs";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { LATEST_LEADS_URL } from "../config/constant.js";
import { WidgetCard } from "./WidgetCard.jsx";

export function NewLeadsList({ enabled = true }) {
  const { data, isLoading } = useRequest({
    url: LATEST_LEADS_URL,
    method: "get",
    autoFetch: enabled,
  });

  const leads = Array.isArray(data) ? data : [];

  return (
    <WidgetCard
      title="عملاء جدد"
      loading={isLoading}
      isEmpty={leads.length === 0}
      emptyText="لا يوجد عملاء جدد"
      minHeight={160}
      action={
        <Button variant="contained" color="primary" size="small" component={Link} href="/v2/leads">
          عرض كل العملاء الجدد
        </Button>
      }
    >
      <List>
        {leads.map((lead) => (
          <ListItem
            key={lead.id}
            divider
            secondaryAction={
              <Chip label={lead.status} color="secondary" size="small" sx={{ color: "#fff" }} />
            }
          >
            <ListItemText
              primary={
                <Link href={`/v2/leads/${lead.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  عميل رقم: {lead.id}
                </Link>
              }
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    الاسم: {lead.client?.name || "—"}
                  </Typography>
                  <br />
                  <Typography component="span" variant="body2" color="text.secondary">
                    أُنشئ في: {lead.createdAt ? dayjs(lead.createdAt).format("YYYY-MM-DD HH:mm") : "—"}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </WidgetCard>
  );
}

export default NewLeadsList;
