import {Box, Card, CardContent, Grid, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {useAuth} from "@/app/providers/AuthProvider.jsx";
import {getData} from "@/app/helpers/functions/getData.js";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import colors from "@/app/helpers/colors.js";

const PerformanceMetricsCard = ({staff,staffId}) => {
    const data = {
        currentWeek:"27/12 : 1/2",
        weekly: {
            newLeads: 85,
            meetings: 52,
            followUps: 95,
            success: 18
        },
    };
    const [loading,setLoading]=useState(true)
    const {user}=useAuth()
    const [metrics,setMetrics]=useState(data)
    useEffect(()=>{
        async function fetchData(){
            const extra=staffId?"staffId="+staffId:staff?"staffId="+user.id:""
            const request=await getData({url:`shared/dashboard/week-performance?${extra}&`,setLoading})
            if(request)setMetrics(request.data)
        }
        fetchData()
    },[])
    return (
          <Card sx={{ height: '100%', boxShadow: 3,position:"relative" }}>
              {loading&&<LoadingOverlay/>}
              <CardContent>
                  <Typography variant="h6" gutterBottom>
                      Activity Metrics
                  </Typography>

                  <Box
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: colors.bgSecondary,
                            boxShadow: 1
                        }}
                  >
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Week Activity {metrics.currentWeek}
                      </Typography>
                      <Grid container spacing={2}>
                          {Object.entries(metrics.weekly).map(([key, value]) => (
                                <Grid item xs={6} key={key}>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold">
                                            {value}
                                        </Typography>
                                    </Box>
                                </Grid>
                          ))}
                      </Grid>
                  </Box>

              </CardContent>
          </Card>
    );
};
export default PerformanceMetricsCard