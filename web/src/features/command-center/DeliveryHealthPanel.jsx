"use client";
// DeliveryHealthPanel — late / at-risk deliveries (deadline passed, stage not completed),
// straight from the overview endpoint. Header carries the total late count; each row links
// to the owning project and shows how many days it is overdue. Empty state celebrates a
// clean board.
import NextLink from "next/link";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { FiChevronRight } from "react-icons/fi";
import { MdCheckCircleOutline } from "react-icons/md";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay.jsx";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function DeliveryHealthPanel({ delivery, loading }) {
  const items = Array.isArray(delivery?.items) ? delivery.items : [];
  const lateCount = delivery?.lateCount ?? items.length;

  return (
    <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 2, position: "relative" }}>
      {loading && <LoadingOverlay />}
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "text.primary" }}>
            Delivery Health
          </Typography>
          {lateCount > 0 && (
            <Chip
              size="small"
              color="error"
              label={`${lateCount} late`}
              sx={{ fontWeight: 700, borderRadius: 1.5 }}
            />
          )}
        </Stack>

        {items.length === 0 ? (
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              p: 1.5,
              mt: 1,
              borderRadius: 2,
              border: (t) => `1px solid ${t.palette.success.main}55`,
              bgcolor: (t) => `${t.palette.success.main}14`,
            }}
          >
            <MdCheckCircleOutline size={20} color="#6b8c5a" />
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {loading ? "Loading deliveries…" : "No late deliveries."}
            </Typography>
          </Stack>
        ) : (
          <Stack sx={{ mt: 0.5 }}>
            {items.map((item) => (
              <Box
                key={item.projectId}
                component={NextLink}
                href={`/dashboard/projects/${item.projectId}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 1,
                  borderRadius: 1.5,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "background-color .15s ease",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
                    {item.title || `Project #${item.projectId}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Due {formatDate(item.deliveryAt)}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  variant="outlined"
                  color="error"
                  label={`${item.overdueDays}d overdue`}
                  sx={{ fontWeight: 700, borderRadius: 1.5, flexShrink: 0 }}
                />
                <FiChevronRight size={16} style={{ flexShrink: 0, opacity: 0.5 }} />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
