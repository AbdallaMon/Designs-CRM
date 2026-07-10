import {
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Skeleton,
} from "@mui/material";

export function ClientSessionSubmittedSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Skeleton
          variant="circular"
          width={48}
          height={48}
          sx={{ mx: "auto", mb: 2 }}
        />
        <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={40} />
      </Paper>
      <Grid container spacing={3}>
        {[...Array(4)].map((_, index) => (
          <Grid size={{ xs: 12, md: 6 }} key={index}>
            <Card>
              <CardContent>
                <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={60} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
