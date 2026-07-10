import { Button } from "@mui/material";

export function OpenButton({ handleOpen, children }) {
  return (
    <>
      <Button
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "flex-start",
          width: "100%",
        }}
        variant={"text"}
        onClick={handleOpen}
      >
        {children}
      </Button>
    </>
  );
}
