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
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay.jsx";
import UserLogs from "@/features/users/UserLogs.jsx";
import LastSeen from "@/shared/components/buttons/LastSeen.jsx";
import EditModal from "@/shared/components/models/EditModal.jsx";
import UserRestrictedCountries from "@/features/users/UserRestrictedCountries.jsx";
import Commission from "@/features/accountant/Commission.jsx";

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
              {user?.name ? user.name[0]?.toUpperCase() : "?"}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {user?.name || "N/A"}
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                color="text.secondary"
              >
                <FiMail size={14} />
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                  {user?.email || "N/A"}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Typography variant="overline" fontWeight={700} color="text.secondary">
            Actions
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
                      View user current deals
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
        editButtonText={"Edit max leads counts" + " " + user.maxLeadsCounts}
        item={user}
        inputs={[
          {
            data: {
              id: "maxLeadsCounts",
              label: "Enter a number",
              type: "text",
            },
            pattern: {
              required: {
                value: true,
                message: "Please enter a number",
              },
            },
          },
        ]}
        isObject={true}
        href={`admin/users/max-leads`}
        setData={setUser}
        extraProps={{
          formTitle: "Change max leads count",
          btnText: "Change",
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
          "Edit leads counts per day" + " " + user.maxLeadCountPerDay
        }
        item={user}
        inputs={[
          {
            data: {
              id: "maxLeadCountPerDay",
              label: "Enter a number",
              type: "text",
            },
            pattern: {
              required: {
                value: true,
                message: "Please enter a number",
              },
            },
          },
        ]}
        isObject={true}
        href={`admin/users/max-leads-per-day`}
        setData={setUser}
        extraProps={{
          formTitle: "Change max leads count",
          btnText: "Change",
          variant: "outlined",
        }}
      />
    </Box>
  );
}
