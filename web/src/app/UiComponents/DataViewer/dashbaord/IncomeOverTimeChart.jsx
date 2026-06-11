import { Card, CardContent, Typography } from "@mui/material";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import React, {useEffect, useState} from "react";
import {useAuth} from "@/app/providers/AuthProvider.jsx";
import {getData} from "@/app/helpers/functions/getData.js";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";

const IncomeOverTimeChart = ({staff,staffId}) => {
    const incomeData = [
        { month: 'Jan', leads: 40, finalized: 10, nonSuccess: 30, revenue: 1200000 },
        { month: 'Feb', leads: 35, finalized: 12, nonSuccess: 23, revenue: 1100000 },
        { month: 'Mar', leads: 38, finalized: 15, nonSuccess: 23, revenue: 1500000 },
        { month: 'Apr', leads: 42, finalized: 18, nonSuccess: 24, revenue: 1800000 },
    ];

    const [loading,setLoading]=useState(true)
    const {user}=useAuth()
    const [data,setData]=useState(incomeData)
    useEffect(()=>{
        async function fetchData(){
            const extra=staffId?"staffId="+staffId:staff?"staffId="+user.id:""

            const request=await getData({url:`shared/dashboard/monthly-performance?${extra}&`,setLoading})
            if(request)setData(request.data)
        }
        fetchData()
    },[])
    return (
          <Card sx={{ height: '100%', boxShadow: 3,position:"relative" }}>
              {loading&&<LoadingOverlay/>}
              <CardContent sx={{
                  overflow:"auto"
              }}>
                  <Typography variant="h6" gutterBottom>
                      Monthly Performance
                  </Typography>
                  <ResponsiveContainer minWidth="800px" width="100%" height={300}>
                      <BarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="leads" fill="#8884d8" name="Total Leads" />
                          <Bar dataKey="finalized" fill="#82ca9d" name="Successful Leads" />
                          <Bar dataKey="nonSuccess" fill="#ff7f7f" name="Non-Successful Leads" />
                          <Bar dataKey="revenue" fill="#ffc658" name="Revenue (AED)" />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
    );
};

export default IncomeOverTimeChart;
