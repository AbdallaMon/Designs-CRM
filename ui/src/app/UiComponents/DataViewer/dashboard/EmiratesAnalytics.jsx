import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import React, {useEffect, useState} from "react";
import {useAuth} from "@/app/providers/AuthProvider.jsx";
import {getData} from "@/app/helpers/functions/getData.js";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";

const EmiratesAnalytics = ({staff,staffId}) => {
    // Simulated data for leads and performance from the last month until today
    const dateRange = "December 2024 - January 2025";

    const emiratesData = [
        {
            emirate: 'DUBAI',
            leads: 50,
            totalPrice: 1000000,
            averageLeadPrice: 20000,
            growthRate: 10.0,
            selectedCategory: 'Commercial',
            successRate: 40, // 20 finalized out of 50 total
        },
        {
            emirate: 'ABU_DHABI',
            leads: 30,
            totalPrice: 600000,
            averageLeadPrice: 20000,
            growthRate: 12.5,
            selectedCategory: 'Residential',
            successRate: 33, // 10 finalized out of 30 total
        },
        {
            emirate: 'SHARJAH',
            leads: 25,
            totalPrice: 400000,
            averageLeadPrice: 16000,
            growthRate: 15.0,
            selectedCategory: 'Residential',
            successRate: 20, // 5 finalized out of 25 total
        },
        {
            emirate: 'AJMAN',
            leads: 15,
            totalPrice: 200000,
            averageLeadPrice: 13333,
            growthRate: 8.0,
            selectedCategory: 'Residential',
            successRate: 30, // 4 finalized out of 15 total
        },
        {
            emirate: 'RAS_AL_KHAIMAH',
            leads: 10,
            totalPrice: 150000,
            averageLeadPrice: 15000,
            growthRate: 5.0,
            selectedCategory: 'Mixed Use',
            successRate: 50, // 5 finalized out of 10 total
        },
    ];
    const [data,setData]=useState({
        analytics:emiratesData,
        dateRange
    })
    const [loading,setLoading]=useState(true)
    const {user}=useAuth()
    useEffect(()=>{
        async function fetchData(){
            const extra=staffId?"staffId="+staffId:staff?"staffId="+user.id:""
            const request=await getData({url:`shared/dashboard/emirates-analytics?${extra}&`,setLoading})
            if(request)setData(request.data)
        }
        fetchData()
    },[])
    return (
          <Card sx={{ height: '100%', boxShadow: 3,position:"relative" }}>
              {loading&&<LoadingOverlay/>}
              <CardContent>
                  <Typography variant="h6" gutterBottom>
                      Regional Performance Analysis ({data?.dateRange})
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                      This analysis includes leads and performance data from the last month until today, comparing the performance of different emirates.
                  </Typography>
                  <Box sx={{ overflowX: "auto" ,height:"360px"}}>
                      <ResponsiveContainer width="100%" height={350} minWidth={"700px"}>
                          <ComposedChart data={data?.analytics}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="emirate" />
                              <YAxis
                                    yAxisId="left"
                                    label={{ value: 'Total Value (AED)', angle: -90, position: 'insideLeft' }}
                              />
                              <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight' }}
                              />
                              <Tooltip />
                              <Legend verticalAlign="top" height={36} />
                              <Bar
                                    yAxisId="left"
                                    dataKey="totalPrice"
                                    fill="#8884d8"
                                    name="Total Value (AED)"
                              />
                              <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="successRate"
                                    stroke="#82ca9d"
                                    name="Success Rate (%)"
                              />
                              <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="growthRate"
                                    stroke="#ff7300"
                                    name="Growth Rate (%)"
                              />
                          </ComposedChart>
                      </ResponsiveContainer>
                  </Box>

                  <Box mt={4}>
                      <Typography variant="h6" gutterBottom>
                          Detailed Metrics
                      </Typography>
                      <Grid container spacing={2}>
                          {data?.analytics?.map((emirate) => (
                                <Grid item xs={12} md={4} key={emirate.emirate}>
                                    <Box
                                          sx={{
                                              p: 2,
                                              borderRadius: 2,
                                              backgroundColor: '#f5f5f5',
                                              boxShadow: 1,
                                          }}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {emirate.emirate.replace(/_/g, ' ')}
                                            </Typography>
                                            <Chip
                                                  label={`+${emirate.growthRate}%`}
                                                  size="small"
                                                  sx={{
                                                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                                      color: '#4caf50',
                                                  }}
                                            />
                                        </Box>
                                        <Box mt={1}>
                                            <Typography variant="body2" color="textSecondary">
                                                Leads: {emirate.leads}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Avg. Value: AED {emirate.averageLeadPrice.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Top Category: {emirate.selectedCategory}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Success Rate: {emirate.successRate}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                          ))}
                      </Grid>
                  </Box>
              </CardContent>
          </Card>
    );
};

export default EmiratesAnalytics;
