"use client"
import {useAuth} from "@/app/providers/AuthProvider.jsx";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher.js";
import LeadsSlider from "@/app/UiComponents/DataViewer/slider/LeadsSlider.jsx";
import React from "react";
import {Box, Button, Card, CardActions, CardContent, Chip, Typography} from "@mui/material";
import {InProgressCall} from "@/app/UiComponents/DataViewer/leads/InProgressCall.jsx";
import Link from "next/link.js";
import {hideMoreData} from "@/app/helpers/functions/utility.js";

export default function NextCalls({staff}){
    const {user} = useAuth()

    const {
        data,
        loading,
        setData,
        page,
        setPage,
        limit,
        setLimit,
        total,
        setTotal, totalPages, setFilters
    } = useDataFetcher("shared/client-leads/calls"+`?staffId=${staff&&user.id}&`, false);

return(
      <LeadsSlider title="Upcomming calls" loading={loading} total={total} limit={limit} page={page} setLimit={setLimit}
                   setPage={setPage}
                   totalPages={totalPages}  NextCalls={true}>
          {data?.map((lead)=><NextCall lead={lead} key={lead.id}/> )}
      </LeadsSlider>
)
}
function NextCall({lead}){
    return(
          <Card >
              <CardContent>
                  <Box>
                      <Typography variant="h6" component="div">
                          {lead.client.name}
                      </Typography>
                  </Box>
                  <Typography variant="body2">
                      Reason: {hideMoreData(lead.callReminders[0].reminderReason) || "N/A"}
                  </Typography>
                  <InProgressCall call={lead.callReminders[0]} simple={true}/>
                  <CardActions>
                  <Button component={Link} href={`/dashboard/deals/${lead.id}`} variant="contained" size="small" color="primary" fullWidth >
                      Preview
                  </Button>
                  </CardActions>
              </CardContent>
          </Card>
    )
}