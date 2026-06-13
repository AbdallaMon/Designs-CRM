import { Box } from "@mui/material";

/**
 * TabPanel component for rendering tab content
 * @param {Object} props
 * @param {React.ReactNode} props.children - Tab content
 * @param {number} props.value - Current active tab index
 * @param {number} props.index - This tab's index
 */
export const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ py: 2 }}>
    {value === index && children}
  </Box>
);
