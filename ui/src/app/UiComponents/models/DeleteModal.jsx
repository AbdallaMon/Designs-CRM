import React, {useState} from "react";
import {Box, Fade, Modal, Button, Typography} from "@mui/material";
import {useToastContext} from "@/app/providers/ToastLoadingProvider";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit";
import {simpleModalStyle} from "@/app/helpers/constants";

export default function DeleteModal({
                                        handleClose,
                                        item,
                                        setData,
                                        href,
                                        setTotal,
                                        archive = false
                                    }) {
    const {setLoading} = useToastContext();
    const [open, setOpen] = useState(false);
    const handleDeleteOpen = (item) => {
        setOpen(true);
    };
    const handleDeleteOrArchive = async () => {
        const url = archive ? `${href}/${item.id}` : `${href}/${item.id}`;
        const method = archive ? "PATCH" : "DELETE";
        const message = archive ? "جاري الارشفة..." : "جاري الحذف...";
        const result = await handleRequestSubmit({}, setLoading, url, false, message, null, method);
        if (result.status === 200) {
            setOpen(false)
            if (setData) {
                setData((prevData) =>
                      prevData.filter((dataItem) => dataItem.id !== item.id)
                );
            }
            if (setTotal) {
                setTotal((prev) => prev - 1);
            }
            if (handleClose) {
                handleClose();
            }
        }
    };

    if (!open) return (
          <Button
                variant="contained"
                color="secondary"
                onClick={() => handleDeleteOpen(item)}
                sx={{textTransform: 'none'}}
          >
              {!archive ? "حذف" : "ارشفة"}
          </Button>
    )
    return (
          <>
              <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    closeAfterTransition
              >
                  <Fade in={open}>
                      <Box sx={{...simpleModalStyle}}>
                          <Typography variant="h6" component="h2">
                              {archive ? "هل انت متاكد انك تريد عمل ارشفة لهذا العنصر" : "هل انت متاكد انك تريد حذف هذا العنصر"}
                          </Typography>
                          <Box sx={{display: 'flex', justifyContent: 'flex-end', marginTop: '16px'}}>
                              <Button variant="contained" color={archive ? "warning" : "secondary"}
                                      onClick={handleDeleteOrArchive}>
                                  {archive ? "ارشفه" : "حذف"}
                              </Button>
                              <Button variant="contained" onClick={() => setOpen(false)} sx={{marginLeft: '8px'}}>
                                  الغاء
                              </Button>
                          </Box>
                      </Box>
                  </Fade>
              </Modal>
          </>
    );
}
