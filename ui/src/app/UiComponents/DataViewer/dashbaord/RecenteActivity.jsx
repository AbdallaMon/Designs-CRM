import { Card, CardContent, List, ListItem, ListItemText, Typography, Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import parse from "html-react-parser"; // Import the parser
import dayjs from "dayjs";
import { LogColors } from "@/app/helpers/colors.js";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import {getData} from "@/app/helpers/functions/getData.js"; // Replace with your actual colors helper

const RecentActivities = ( ) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivities() {
            try {
                const response = await getData({
                    url: `shared/dashboard/recent-activities?`,
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
                  <Typography variant="h6" gutterBottom>
                      Recent Activities
                  </Typography>
                  <List>
                      {activities?.map((activity) => (
                            <ListItem key={activity.id} divider>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                          sx={{
                                              width: 10,
                                              height: 10,
                                              borderRadius: "50%",
                                              backgroundColor: LogColors[activity.type],
                                          }}
                                    />
                                    {/* Render HTML safely using html-react-parser */}
                                    <ListItemText
                                          primary={parse(activity.text)} // Parse and render the HTML
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
