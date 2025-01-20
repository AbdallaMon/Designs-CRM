import {useEffect, useState} from "react";
import {getData} from "@/app/helpers/functions/getData.js";
import {Box, Button, Card, CardContent, Typography} from "@mui/material";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import UserLogs from "@/app/UiComponents/DataViewer/UserLogs.jsx";
import Link from "next/link";

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
                      <Box display="flex" justifyContent="flex-end"  gap={2}>

                          {!loading&&<>
                              <Button variant="outlined" component={Link}  href={`/dashboard/deals?staffId=${user.id}`}>View user current deals</Button>
                              <UserLogs staff={user} staffId={id}/>

                          </>}
                      </Box>
                  </CardContent>
              </Card>
          </Box>
    );
}