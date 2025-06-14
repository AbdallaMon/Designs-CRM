import {Card, CardContent, List, ListItem, ListItemText, Typography, Box, Button} from "@mui/material";
import React, { useEffect, useState } from "react";
import parse from "html-react-parser"; // Import the parser
import dayjs from "dayjs";
import { NotificationColors} from "@/app/helpers/colors.js";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import {getData} from "@/app/helpers/functions/getData.js";
import Link from "next/link";
import {useAuth} from "@/app/providers/AuthProvider.jsx"; // Replace with your actual colors helper

const RecentActivities = ( {staffId}) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
const {user}=useAuth()
    useEffect(() => {
        async function fetchActivities() {
            try {
                const extra=staffId?"staffId="+staffId:"userId="+user.id
                const response = await getData({
                    url: `shared/dashboard/recent-activities?${extra}&`,
                    setLoading,
                });

                setActivities(response.data);
            } catch (error) {
                console.error("Error fetching recent activities:", error);
            }
        }

        fetchActivities();
    }, []);

    return (
          <Card sx={{ height: '100%', boxShadow: 3,position:"relative" }}>
              {loading && <LoadingOverlay/>}
              <CardContent>
                  <Box sx={{display:"flex" ,justifyContent:"space-between",gap:2}}>

                  <Typography variant="h6" gutterBottom>
                      Recent Activities
                  </Typography>
                  <Button component={Link} href={staffId?`/dashboard/notifications?staffId=${staffId}`:"/dashboard/notifications"}>
                      View All activities
                  </Button>
                  </Box>
                  <List>
                      {activities?.map((activity) => (
                            <ListItem key={activity.id} divider className="notifications">
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                          sx={{
                                              width: 10,
                                              height: 10,
                                              borderRadius: "50%",
                                              backgroundColor: NotificationColors[activity.type],
                                          }}
                                    />
                                    <ListItemText
                                          primary={parse(activity.content)}
                                          secondary={`Type: ${activity.type.replace(/_/g, ' ')} | Time: ${dayjs(activity.createdAt).format('YYYY-MM-DD HH:mm:ss')}`}
                                    />
                                </Box>
                            </ListItem>
                      ))}
                  </List>
              </CardContent>
          </Card>
    );
};

export default RecentActivities;
