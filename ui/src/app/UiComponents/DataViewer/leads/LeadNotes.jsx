import React, {useEffect, useState} from "react";
import {Avatar, Paper, Stack, Typography, useTheme} from "@mui/material";
import {NewNoteDialog} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import dayjs from "dayjs";

export default function LeadNotes({lead ,admin}) {
    const [notes, setNotes] = useState(lead?.notes)
    const theme=useTheme()
    useEffect(() => {
        if (lead?.notes) setNotes(lead.notes)
    }, [lead])
    return (
          <Stack spacing={2}>
              {!admin&&
                    <NewNoteDialog lead={lead} setNotes={setNotes}/>
              }
              <Stack spacing={2}>
                  {notes?.map((note) => (
                        <Paper
                              key={note.id}
                              variant="outlined"
                              sx={{
                                  p: 2.5,
                                  borderRadius: 2,
                                  '&:hover': {
                                      boxShadow: theme.shadows[2],
                                      transition: 'box-shadow 0.3s ease-in-out'
                                  }
                              }}
                        >
                            <Stack spacing={1}>
                                <Typography variant="body1" sx={{
                                    wordWrap:"break-word"
                                }}>
                                    {note.content}
                                </Typography>
                                <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                >
                                    <Avatar
                                          sx={{
                                              width: 24,
                                              height: 24,
                                              bgcolor: theme.palette.primary.main,
                                              fontSize: '0.75rem'
                                          }}
                                    >
                                        {note.user.name[0]}
                                    </Avatar>
                                    <Typography variant="caption" color="text.secondary">
                                        {note.user.name} • {dayjs(note.createdAt).format('MM/DD/YYYY')}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                  ))}
              </Stack>
          </Stack>

    )
}
