"use client"
import React from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    List,
    ListItem,
    Avatar,
    Grid2 as Grid,
    Container, Divider, CardHeader,
} from "@mui/material";
import parse from "html-react-parser";
import dayjs from "dayjs";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher.js";
import PaginationWithLimit from "@/app/UiComponents/DataViewer/PaginationWithLimit.jsx";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader.jsx";
import DateRangeFilter from "@/app/UiComponents/formComponents/DateRangeFilter.jsx";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import {notificationIcons} from "@/app/helpers/constants.js";
import colors, {NotificationColors} from "@/app/helpers/colors.js";
import {useAuth} from "@/app/providers/AuthProvider.jsx";


const NotificationPage = ({searchParams}) => {
    const staffId=searchParams?.staffId
    const {user}=useAuth()
    const {
        data:notifications,
        loading,
        page,
        setPage,
        limit,
        setLimit,
        total,
         totalPages, setFilters
    } = useDataFetcher("shared/notifications?userId="+user.id+"&"+(staffId&&`staffId=${staffId}&`) , false);
    return (

          <Container maxWidth="xl" sx={{ marginY: 4 ,position:"relative"}}>
              {loading&&<FullScreenLoader/>}
              <Card sx={{ boxShadow: 3, padding: 2 }}>
<CardHeader    title="Notifications Page" subheader=" View the latest activity notifications across the system.">
</CardHeader>
                  <CardContent sx={{px:{xs:0,md:2}}}>
                      <Box sx={{display:"flex",gap:2,flexWrap:"wrap"}}>
                          {user.role==="ADMIN"&&
                          <Box sx={{width: {xs: "100%", md: "fit-content"}}}>
                              <SearchComponent
                                    apiEndpoint="search?model=user"
                                    setFilters={setFilters}
                                    inputLabel="Search staff by name or email"
                                    renderKeys={["name", "email"]}
                                    mainKey="name"
                                    searchKey={"staffId"}
                                    withParamsChange={true}
                              />
                          </Box>
                          }
                      <DateRangeFilter setFilters={setFilters}/>

                      </Box>
                      <List className="notifications">
                          {notifications.map((notification) => (
                                <>
                                <ListItem key={notification.id}  sx={{
                                    borderLeft:`2px solid ${NotificationColors[notification.type]}`,
                                    my:1.5,
                                    background:colors.bgSecondary,
                                    py:2
                                }}>
                                    <Grid container spacing={2} alignItems="center" justifyContent="center">
                                        <Grid >
                                            <Avatar
                                                  sx={{
                                                      bgcolor: NotificationColors[notification.type] || "#607d8b",
                                                      width: 40,
                                                      height: 40,
                                                  }}
                                            >
                                                {notificationIcons[notification.type]}
                                            </Avatar>
                                        </Grid>

                                        <Grid >
                                            <Typography
                                                  variant="body1"
                                            >
                                                {parse(notification.content)}
                                            </Typography>
                                            <Typography
                                                  variant="body2"
                                                  color="textSecondary"
                                            >
                                                By
                                                {user.role==="ADMIN"?
                                                      notification.staff?
                                                      <a href={"/dashboard/users/"+notification.staffId}> {notification.staff?.name}</a>:notification.client?.name
                                                      :notification.client?.name||"Admin"
                                                }
                                                {` at ${dayjs(notification.createdAt).format(
                                                      "YYYY-MM-DD HH:mm:ss"
                                                )}`}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </ListItem>
                                    <Divider/>
                                </>
                          ))}
                      </List>
                  </CardContent>
                  <PaginationWithLimit total={total} limit={limit} page={page} setLimit={setLimit}
                                       setPage={setPage}
                                       totalPages={totalPages}/>
              </Card>

          </Container>
    );
};

export default NotificationPage;
