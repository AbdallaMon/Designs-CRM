import { Grid, Typography } from "@mui/material";

export function FinalPriceCalc({ lead }) {
  const calculateExtraServicesPrice = (extraServices) => {
    if (!extraServices || !Object.keys(extraServices).length) return 0;

    // You can customize this calculation based on your specific extra services
    let extraServicesTotal = 0;

    extraServices.forEach((service) => {
      extraServicesTotal += parseInt(service.price);
    });

    return extraServicesTotal;
  };
  // Inside your component
  const extraServicesPrice = lead.extraServices
    ? calculateExtraServicesPrice(lead.extraServices)
    : 0;
  const totalPrice = parseInt(lead.averagePrice) + extraServicesPrice;
  return (
    <>
      {lead.status === "FINALIZED" && (
        <>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography color="text.secondary" variant="caption">
              Base price
            </Typography>
            <Typography variant="body1">AED {lead.averagePrice}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            {extraServicesPrice > 0 && (
              <>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{ mt: 1 }}
                >
                  Extra services
                </Typography>
                <Typography variant="body1">
                  AED {extraServicesPrice}
                </Typography>
              </>
            )}

            <Typography color="text.secondary" variant="caption" sx={{ mt: 1 }}>
              Final price
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              AED {totalPrice}
            </Typography>
          </Grid>
        </>
      )}
    </>
  );
}
