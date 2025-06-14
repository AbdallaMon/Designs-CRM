import {Box, Button, Card, CardContent, Chip, Link, List, ListItem, ListItemText, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {getData} from "@/app/helpers/functions/getData.js";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";

const NewLeadsList = () => {


    const [newLeads,setNewLeads]=useState([])
    const [loading,setLoading]=useState(true)
    useEffect(()=>{
        async function fetchData(){
            const request=await getData({url:`shared/dashboard/latest-leads?`,setLoading})
            if(request)setNewLeads(request.data)
        }
        fetchData()
    },[])
    return (
          <Card sx={{ height: '100%', boxShadow: 3,position:"relative" }}>
              {loading&&<LoadingOverlay/>}
              <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">New Leads</Typography>
                      <Button variant="contained" color="primary" component={Link} href="/dashboard/leads">
                          View All New Leads
                      </Button>
                  </Box>
                  <List>
                      {newLeads?.map((lead) => (
                            <ListItem key={lead.id} divider>
                                <ListItemText
                                      primary={
                                          <Link href={`/dashboard/leads?clientId=${lead.client.id}`} underline="hover">
                                              Lead ID: {lead.id}
                                          </Link>
                                      }
                                      secondary={
                                          <>
                                              <Typography component="span" variant="body2" color="textPrimary">
                                                  Client: {lead.client.name}
                                              </Typography>
                                              <br />
                                              <Typography component="span" variant="body2" color="textSecondary">
                                                  Created At: {new Date(lead.createdAt).toLocaleString()}
                                              </Typography>
                                          </>
                                      }
                                />
                                <Chip
                                      label={lead.status}
                                      color="secondary"
                                      size="small"
                                      sx={{color:"white"}}
                                />
                            </ListItem>
                      ))}
                  </List>
              </CardContent>
          </Card>
    );
};

export default NewLeadsList