import CircularProgress from '@mui/material/CircularProgress';
import React from 'react';

const LoadingOverlay = () => (
      <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
      >
          <CircularProgress/>
      </div>
);

export default LoadingOverlay;
