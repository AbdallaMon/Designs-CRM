import { Box, Fade } from "@mui/material";

/**
 * TabPanel component for rendering tab content
 * @param {Object} props
 * @param {React.ReactNode} props.children - Tab content
 * @param {string} props.value - Current active tab key
 * @param {string} props.index - This tab's key
 */
export const TabPanel = ({ children, value, index }) => {
  const active = value === index;
  return (
    <Box role="tabpanel" hidden={!active} sx={{ py: 1 }}>
      {active && (
        <Fade in={active} timeout={250}>
          <Box>{children}</Box>
        </Fade>
      )}
    </Box>
  );
};
