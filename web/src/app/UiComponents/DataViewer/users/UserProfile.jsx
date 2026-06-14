import { useEffect, useState } from "react";
import { getData } from "@/app/helpers/functions/getData.js";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { FiMail } from "react-icons/fi";
import { MdOpenInNew } from "react-icons/md";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import UserLogs from "@/app/UiComponents/DataViewer/users/UserLogs.jsx";
import LastSeen from "../../buttons/LastSeen";
import EditModal from "../../models/EditModal";
import UserRestrictedCountries from "./UserRestrictedCountries";
import Commission from "../utility/Commission";

export default function UserProfile({ id, role }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  async function getUser() {
    const user = await getData({
      url: `admin/users/${id}/profile`,
      setLoading,
    });
    if (user) {
      setUser(user.data);
    }
  }
  useEffect(() => {
    getUser();
  }, [id]);
  if (!user) return;
  return (
    <Box mb={2}>
      {loading && <LoadingOverlay />}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Avatar
              sx={{
                width: 56,
                height: 56,
                fontSize: 24,
                fontWeight: 700,
                bgcolor: (t) => t.palette.primary.main,
                color: "#fff",
              }}
            >
              {user?.name ? user.name[0]?.toUpperCase() : "؟"}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {user?.name || "غير متوفر"}
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                color="text.secondary"
              >
                <FiMail size={14} />
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                  {user?.email || "غير متوفر"}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Typography variant="overline" fontWeight={700} color="text.secondary">
            الإجراءات
          </Typography>
          <Box
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            gap={1.5}
            sx={{ mt: 1.25 }}
          >
            {!loading && (
              <>
                <LastSeen initialLastSeen={user.lastSeenAt} userId={user.id} />
                <Box>
                  <Commission userId={user.id} />
                </Box>
                {(user.role === "STAFF" ||
                  user.subRoles?.some((r) => r.subRole === "STAFF")) && (
                  <>
                    <UserRestrictedCountries userId={user.id} />
                    <UpdateUserMaxLeadsCounts setUser={setUser} user={user} />
                    <UpdateUserMaxLeadsCountPerDay
                      setUser={setUser}
                      user={user}
                    />
                    <Button
                      variant="outlined"
                      component="a"
                      target="_blank"
                      href={`/dashboard/deals?staffId=${user.id}`}
                      startIcon={<MdOpenInNew />}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                    >
                      عرض صفقات المستخدم الحالية
                    </Button>
                  </>
                )}
                <UserLogs staff={user} staffId={id} />
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
function UpdateUserMaxLeadsCounts({ user, setUser }) {
  return (
    <Box>
      <EditModal
        editButtonText={"حد العملاء المحتملين" + " " + user.maxLeadsCounts}
        item={user}
        inputs={[
          {
            data: {
              id: "maxLeadsCounts",
              label: "أدخل رقمًا",
              type: "text",
            },
            pattern: {
              required: {
                value: true,
                message: "الرجاء إدخال رقم",
              },
            },
          },
        ]}
        isObject={true}
        href={`admin/users/max-leads`}
        setData={setUser}
        extraProps={{
          formTitle: "تغيير حد العملاء المحتملين",
          btnText: "تغيير",
          variant: "outlined",
        }}
      />
    </Box>
  );
}

function UpdateUserMaxLeadsCountPerDay({ user, setUser }) {
  return (
    <Box>
      <EditModal
        editButtonText={
          "حد العملاء المحتملين يوميًا" + " " + user.maxLeadCountPerDay
        }
        item={user}
        inputs={[
          {
            data: {
              id: "maxLeadCountPerDay",
              label: "أدخل رقمًا",
              type: "text",
            },
            pattern: {
              required: {
                value: true,
                message: "الرجاء إدخال رقم",
              },
            },
          },
        ]}
        isObject={true}
        href={`admin/users/max-leads-per-day`}
        setData={setUser}
        extraProps={{
          formTitle: "تغيير حد العملاء المحتملين",
          btnText: "تغيير",
          variant: "outlined",
        }}
      />
    </Box>
  );
}
