"use client";

// RecenteActivity — binds to GET /v2/dashboard/recent-activities.
// Response .data shape (dashboard.repository.recentActivities → prisma.notification.findMany):
//   an ARRAY of the latest 5 notification rows { id, content, type, createdAt, userId, staffId, ... }.
// The BE self-scopes by token (admin-tier may pass staffId; others are bound to their own
// userId), so the widget sends NO scope param. Mirrors the legacy RecentActivities widget
// (colored type dot + parsed HTML content + type/time secondary line), Arabic.

import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import Link from "next/link";
import dayjs from "dayjs";
import parse from "html-react-parser";
import { NotificationColors } from "@/app/helpers/colors.js";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { RECENT_ACTIVITIES_URL } from "../config/constant.js";
import { WidgetCard } from "./WidgetCard.jsx";

// notification type enum → Arabic label.
const TYPE_AR = {
  NEW_LEAD: "عميل جديد",
  LEAD_ASSIGNED: "تخصيص عميل",
  LEAD_STATUS_CHANGE: "تغيير حالة عميل",
  LEAD_TRANSFERRED: "تحويل عميل",
  LEAD_UPDATED: "تحديث عميل",
  LEAD_CONTACT: "تواصل مع عميل",
  NOTE_ADDED: "إضافة ملاحظة",
  NEW_NOTE: "ملاحظة جديدة",
  NEW_FILE: "ملف جديد",
  CALL_REMINDER_CREATED: "تذكير اتصال",
  CALL_REMINDER_STATUS: "حالة تذكير اتصال",
  PRICE_OFFER_SUBMITTED: "عرض سعر مُقدّم",
  PRICE_OFFER_UPDATED: "تحديث عرض سعر",
  FINAL_PRICE_ADDED: "إضافة سعر نهائي",
  FINAL_PRICE_CHANGED: "تغيير سعر نهائي",
  OTHER: "أخرى",
};

const arType = (t) => TYPE_AR[t] || String(t || "").replace(/_/g, " ");

export function RecenteActivity({ enabled = true }) {
  const { data, isLoading } = useRequest({
    url: RECENT_ACTIVITIES_URL,
    method: "get",
    autoFetch: enabled,
  });

  const activities = Array.isArray(data) ? data : [];

  return (
    <WidgetCard
      title="آخر الأنشطة"
      loading={isLoading}
      isEmpty={activities.length === 0}
      emptyText="لا توجد أنشطة حديثة"
      minHeight={160}
      action={
        <Button size="small" component={Link} href="/v2/notifications">
          عرض كل الأنشطة
        </Button>
      }
    >
      <List>
        {activities.map((activity) => (
          <ListItem key={activity.id} divider>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: NotificationColors[activity.type] || NotificationColors.OTHER,
                }}
              />
              <ListItemText
                primary={activity.content ? parse(String(activity.content)) : null}
                secondary={`النوع: ${arType(activity.type)} | الوقت: ${dayjs(activity.createdAt).format("YYYY-MM-DD HH:mm")}`}
              />
            </Box>
          </ListItem>
        ))}
      </List>
    </WidgetCard>
  );
}

export default RecenteActivity;
