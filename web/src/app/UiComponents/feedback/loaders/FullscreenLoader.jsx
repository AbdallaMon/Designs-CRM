import React from 'react';
import {Box, CircularProgress} from '@mui/material';

const FullScreenLoader = () => {
    return (
          <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 99969,
                }}
          >
              <CircularProgress/>
          </Box>
    );
};

export default FullScreenLoader;
