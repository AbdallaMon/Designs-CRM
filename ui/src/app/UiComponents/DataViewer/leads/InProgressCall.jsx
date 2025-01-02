import {useCallTimer} from "@/app/helpers/hooks/useCallTimer.js";
import {alpha, Box, Typography, useTheme} from "@mui/material";
import {RiTimeLine} from "react-icons/ri";
import React from "react";

export function InProgressCall({call,simple}){
    const {timeLeft}=useCallTimer(call)
    const theme=useTheme()
    return(
          <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    color: theme.palette.primary.main,
                    p: simple?1:2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    mb:simple&&1
                }}
          >
              <RiTimeLine size={20} style={{ marginRight: theme.spacing(1) }} />
              <Typography variant="subtitle2" fontWeight="600">
                  Call in {timeLeft}
              </Typography>
          </Box>

    )
}
