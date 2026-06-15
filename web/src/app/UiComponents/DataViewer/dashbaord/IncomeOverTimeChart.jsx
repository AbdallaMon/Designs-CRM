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
import { COLORS } from "@/app/helpers/colors.js";

const IncomeOverTimeChart = ({staff,staffId}) => {
    const [loading,setLoading]=useState(true)
    const {user}=useAuth()
    const [data,setData]=useState([])
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
                  <Typography variant="h6" gutterBottom sx={{ color: "text.primary" }}>
                      Monthly Performance
                  </Typography>
                  <ResponsiveContainer minWidth="800px" width="100%" height={300}>
                      <BarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" orientation="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="leads" fill={COLORS[0]} name="Total Leads" />
                          <Bar yAxisId="left" dataKey="finalized" fill={COLORS[1]} name="Successful Leads" />
                          <Bar yAxisId="left" dataKey="nonSuccess" fill={COLORS[3]} name="Non-Successful Leads" />
                          <Bar yAxisId="right" dataKey="revenue" fill={COLORS[2]} name="Revenue (AED)" />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
    );
};

export default IncomeOverTimeChart;
