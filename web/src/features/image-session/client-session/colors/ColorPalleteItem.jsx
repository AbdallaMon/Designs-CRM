import { Card, CardContent, Typography } from "@mui/material";

export function ColorPalleteItem({ color, isFullWidth }) {
  const [word1, word2] = color.title[0].text.split(" ");
  return (
    <Card
      sx={{
        backgroundColor: color.background,
        maxHeight: "400px",
        minHeight: "300px",
        height: "100%",
        position: "relative",
        display: "flex",
        justifyContent: isFullWidth ? "center" : "flex-end",
        alignItems: isFullWidth ? "center" : "flex-end",
        px: 2,
        pb: 2,
        borderRadius: 0,
      }}
    >
      <CardContent
        sx={{
          position: "absolute",
          bottom: isFullWidth ? "50%" : 16,
          left: isFullWidth ? "50%" : 16,
          transform: isFullWidth ? "translate(-50%, 50%)" : "none",
          textAlign: isFullWidth ? "center" : "right",
        }}
      >
        {isFullWidth ? (
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: "#fff",
              fontSize: "1.6rem",
              lineHeight: 1.3,
            }}
          >
            {word1} {word2}
          </Typography>
        ) : (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                fontSize: "1.6rem",
                lineHeight: 1.3,
              }}
            >
              {word1}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                fontSize: "1.6rem",
                lineHeight: 1.3,
              }}
            >
              {word2}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
