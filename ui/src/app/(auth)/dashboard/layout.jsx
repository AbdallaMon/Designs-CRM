import {Box} from "@mui/material";

export default function AuthLayout({children}) {
    return (
          <>
              <Box sx={{
                  width: "100%",
                  height: "100%",
                  minHeight: "100vh"
              }}>
                  {children}
              </Box>
          </>
    );
}
