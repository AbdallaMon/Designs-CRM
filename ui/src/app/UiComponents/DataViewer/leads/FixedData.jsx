"use client"
import React, {useState} from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,

    Box,

    useTheme
} from '@mui/material';
import DeleteModal from "@/app/UiComponents/models/DeleteModal.jsx";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher.js";
import {useAuth} from "@/app/providers/AuthProvider.jsx";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import {Swiper, SwiperSlide} from "swiper/react";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import {Navigation, Pagination, Scrollbar} from "swiper/modules";
import CreateModal from "@/app/UiComponents/models/CreateModal.jsx";
import EditModal from "@/app/UiComponents/models/EditModal.jsx";

// Sample data to render
const inputs = [
    {
        data: { id: "title", type: "text", label: "Title", key: "title" },
        pattern: {
            required: {
                value: true,
                message: "Please enter a name",
            },
        },
    },

    {
        data: { id: "description", type: "textarea", label: "Description", key: "description" },
        pattern: {
            required: {
                value: true,
                message: "Please enter a description",
            },
        },
    },
];
export function FixedData(){
    const {
        data,
        loading,
        setData,

    } = useDataFetcher("shared/fixed-data", false);
    return(
     <FixedDataSlider data={data} setData={setData} loading={loading}>
     </FixedDataSlider>
    )
}
function FixedCardData({ data, setData,admin }) {
    return (
          <Card
          sx={{
              boxShadow: 3,
              borderRadius: 2,
          }}
          >
              <CardContent sx={{
                  height:"120px",
                  overflowY:"auto"
              }}>
                  <Typography variant="h5" component="div" sx={{
                      wordBreak:"break-word"
                  }}>
                      {data.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                      wordBreak:"break-word"
                  }}>
                      {data.description || 'No description provided'}
                  </Typography>
              </CardContent>
                  {admin&&
              <CardActions>
                  <EditModal
                        editButtonText={"Edit"}
                        item={data}
                        inputs={inputs}
                        setData={setData}
                        href={"admin/fixed-data"}
                        editFormButton={"Edit"}
                  />
                  <DeleteModal
                        item={data}
                        setData={setData}
                        href={"admin/fixed-data"}
                  />
              </CardActions>
                  }
          </Card>
    );
}
function FixedDataSlider({data,loading,setData}) {
    const theme = useTheme();
    const {user} = useAuth()
    return (
          <Box
                sx={{
                    width: '100%',
                    margin: 'auto',
                    py: 1,
                    pb: 2,
                    background: theme.palette.background.default,
                    position: "relative",
                    mb:2,
                    borderRadius: 3, // Rounded corners
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', // Subtle shadow

                }}
          >
              {loading && <LoadingOverlay />}
              {user.role==="ADMIN"&&
              <Box sx={{width:"fit-content",ml:"auto"}}>

              <CreateModal
                    label={"Create new data"}
                    inputs={inputs}
                    href={"admin/fixed-data"}
                    setData={setData}
                    extraProps={{formTitle: "New data", btnText: "Create", variant: "outlined"}}
              />
              </Box>
              }
              <Swiper
                    modules={[Navigation, Pagination, Scrollbar]}
                    spaceBetween={30}
                    navigation
                    pagination={{ clickable: true }}
                    scrollbar={{ draggable: true }}
                    breakpoints={{
                        0: {
                            slidesPerView: 1,
                            spaceBetween: 10
                        },
                        320: {
                            slidesPerView: 1.2,
                            spaceBetween: 15
                        },
                        480: {
                            slidesPerView: 1.,
                            spaceBetween: 20
                        },
                        640: {
                            slidesPerView: 2,
                            spaceBetween: 25
                        },
                        768: {
                            slidesPerView: 3,
                            spaceBetween: 30
                        },
                        1024: {
                            slidesPerView: 3,
                            spaceBetween: 35
                        },
                        1280: {
                            slidesPerView: 4,
                            spaceBetween: 40
                        },
                        1600: {
                            slidesPerView: 4,
                            spaceBetween: 45
                        }
                    }}
                    style={{
                        '--swiper-navigation-color': theme.palette.primary.main,
                        '--swiper-pagination-color': theme.palette.primary.main,
                        padding:"20px 12px 50px"
                    }}
              >
                  {data?.map((item, index) => (
                        <SwiperSlide key={index} style={{ width: 'auto' }}><FixedCardData admin={user.role==="ADMIN"} data={item} setData={setData}/></SwiperSlide>
                  ))}
              </Swiper>

          </Box>
    );
}