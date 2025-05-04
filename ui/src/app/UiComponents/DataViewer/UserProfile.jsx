import { useEffect, useState } from "react";
import { getData } from "@/app/helpers/functions/getData.js";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import UserLogs from "@/app/UiComponents/DataViewer/UserLogs.jsx";
import Link from "next/link";
import LastSeen from "../buttons/LastSeen";
import EditModal from "../models/EditModal";
import UserRestrictedCountries from "./UserRestrictedCountries";
import Commission from "./utility/Commission";

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
      <Card>
        <CardContent>
          <Typography variant="body1">
            <strong>Name:</strong> {user?.name || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {user?.email || "N/A"}
          </Typography>
          <Box display="flex" flexWrap="wrap" justifyContent="flex-end" gap={2}>
            {!loading && (
              <>
                <LastSeen initialLastSeen={user.lastSeenAt} userId={user.id} />
                {user.role === "STAFF" && (
                  <>
                    <UserRestrictedCountries userId={user.id} />
                    <UpdateUserMaxLeadsCounts setUser={setUser} user={user} />
                    <Commission userId={user.id} />
                    <Button
                      variant="outlined"
                      component="a"
                      target="_blank"
                      href={`/dashboard/deals?staffId=${user.id}`}
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
