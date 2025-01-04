import {Card, CardContent, Chip, List, ListItem, ListItemText, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {getData} from "@/app/helpers/functions/getData.js";
import {useAuth} from "@/app/providers/AuthProvider.jsx";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import dayjs from "dayjs";
import Link from "next/link";

const CallRemindersCard = () => {
    const {user}=useAuth()
const [callReminders,setCallReminders]=useState([])
    const [loading,setLoading]=useState(true)
    useEffect(()=>{
        async function fetchData(){
            const request=await getData({url:`staff/dashboard/latest-calls?staffId=${user.id}&`,setLoading})
            if(request)setCallReminders(request.data)
        }
        fetchData()
    },[])
    return (
          <Card sx={{ height: '100%', boxShadow: 3,position:"relative" }}>
              {loading&&<LoadingOverlay/>}
              <CardContent>
                  <Typography variant="h6" gutterBottom>
                      Upcoming Call Reminders
                  </Typography>
                  <List sx={{
                      maxHeight:"400px",
                      overflow:"auto"
                  }}>
                      {(!loading&&(!callReminders||callReminders?.length===0))&&
                      <Typography>
                          No Upcoming calls
                      </Typography>
                      }
                      {callReminders?.map((reminder) => (
                            <ListItem key={reminder.id} divider>
                                <ListItemText
                                      primary={
                                          <Link href={`/dashboard/deals/${reminder.clientLeadId}`} underline="hover">
                                              {reminder.clientLead.client.name}
                                          </Link>
                                      }
                                      secondary={
                                          <>
                                              <Typography component="span" variant="body2" color="textPrimary">
                                                  {dayjs(reminder.time).format("DD/MM/YYYY")}
                                              </Typography>
                                              <br />
                                              <Typography component="span" variant="body2" color="textSecondary">
                                                  {reminder.reminderReason}
                                              </Typography>
                                          </>
                                      }
                                />
                                <Chip
                                      label={reminder.status.replace('_', ' ')}
                                      color="primary"
                                      size="small"
                                />
                            </ListItem>
                      ))}
                  </List>
              </CardContent>
          </Card>
    );
};

export default CallRemindersCard