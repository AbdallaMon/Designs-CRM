import {useEffect, useState} from "react";
import {getData} from "@/app/helpers/functions/getData.js";
import {Box, Card, CardContent, Typography} from "@mui/material";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";

export default function UserProfile({id}){
    const [user,setUser]=useState(null)
    const [loading,setLoading]=useState(true)
    async function getUser(){
        const user=await getData({url:`admin/users/${id}/profile`,setLoading})
    setUser(user.data)
    }
    useEffect(()=>{
        getUser()
    },[id
    ])



    return (
          <Box mb={2}>
              {loading&&<LoadingOverlay/>}
              <Card >
                  <CardContent>
                      <Typography variant="body1">
                          <strong>Name:</strong> {user?.name || "N/A"}
                      </Typography>
                      <Typography variant="body1">
                          <strong>Email:</strong> {user?.email || "N/A"}
                      </Typography>
                  </CardContent>
              </Card>
          </Box>
    );
}