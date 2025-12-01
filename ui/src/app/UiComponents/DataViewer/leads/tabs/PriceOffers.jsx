import React, { useEffect, useState, useMemo } from "react";
import {
  Alert,
  alpha,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
  useTheme,
} from "@mui/material";

import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";

import {
  Card,
  CardContent,
  List,
  ListItem,
  IconButton,
  Tooltip,
} from "@mui/material";

import { Grid, Button } from "@mui/material";
import { FaMoneyBillWave, FaUserAlt, FaCalendarAlt } from "react-icons/fa";
import { AddPriceOffers } from "@/app/UiComponents/DataViewer/leads/dialogs/PriceOffersDialog.jsx";
import { MdAttachFile, MdQuestionAnswer, MdTouchApp } from "react-icons/md";
import SimpleFileInput from "../../../formComponents/SimpleFileInput";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import DeleteModelButton from "../../../inline-actions/DeleteModelButton";
import { SPAINQuestionsDialog } from "../../meeting/SPAIN/SPAINQuestionDialog";
import { personalityEnum } from "@/app/helpers/constants";
import VersaObjectionSystem from "../../meeting/VERSA/VERSADialog";

import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import LeadContractList from "../../contracts/ContractsList";
import { AddExtraService } from "../dialogs/AddExtraService";

export function PriceOffersList({ admin, lead, notUser }) {
  const [offers, setOffers] = useState(lead.priceOffers);
  const theme = useTheme();

  const cardStyles = {
    height: "100%",
    boxShadow: theme.shadows[1],
    position: "relative",
    p: 0,
  };

  const listItemStyles = {
    borderRadius: 1,
    mb: 2,
    bgcolor: "background.paper",
    "&:hover": {
      bgcolor: theme.palette.grey[50],
      transition: "background-color 0.2s ease-in-out",
    },
  };

  const iconStyles = {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1),
    fontSize: "1.2rem",
  };
  return (
    <Card sx={cardStyles}>
      <CardContent
        sx={{
          pt: 0,
        }}
      >
        <Box
          sx={{
            height: "350px",
            overflowY: "auto",
          }}
        >
          <LeadContractList leadId={lead.id} lead={lead} />
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
          mt={3}
        >
          <Box>
            <FaMoneyBillWave style={{ ...iconStyles, fontSize: "1.5rem" }} />
            <Typography variant="h5" component="h2" color="primary">
              Price Offers
            </Typography>
            <Chip
              label={`${offers?.length || 0} offers`}
              size="small"
              sx={{ ml: 2 }}
              color="primary"
            />
          </Box>
          {!notUser && (
            <AddPriceOffers lead={lead} setPriceOffers={setOffers} />
          )}
        </Box>
        <List>
          {offers?.map((offer) => (
            <ListItem key={offer.id} sx={listItemStyles} disablePadding>
              <Box sx={{ width: "100%", p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <DeleteModelButton
                    item={offer}
                    model={"PriceOffers"}
                    contentKey={offer.note ? "note" : "url"}
                    onDelete={() => {
                      setOffers((oldOffers) =>
                        oldOffers.filter((o) => o.id !== offer.id)
                      );
                    }}
                  />
                  <PriceOfferSwitch
                    priceOffer={offer}
                    setPriceOffers={setOffers}
                  />
                  {offer.url && (
                    <Button
                      variant="outlined"
                      component="a"
                      href={offer.url}
                      target="_blank"
                    >
                      Preview attachment
                    </Button>
                  )}
                </Box>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box display="flex" alignItems="center">
                      <Tooltip title="Added By">
                        <IconButton size="small">
                          <FaUserAlt style={iconStyles} />
                        </IconButton>
                      </Tooltip>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Added By
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {offer.user.name}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box display="flex" alignItems="center">
                      <Tooltip title="Created Date">
                        <IconButton size="small">
                          <FaCalendarAlt style={iconStyles} />
                        </IconButton>
                      </Tooltip>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Created At
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dayjs(offer.createdAt).format("YYYY-MM-DD HH:mm")}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  {offer.minPrice && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box display="flex" alignItems="center">
                        <Tooltip title="Price Range">
                          <IconButton size="small">
                            <FaMoneyBillWave style={iconStyles} />
                          </IconButton>
                        </Tooltip>
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Price Range (AED)
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {offer.minPrice.toLocaleString()} -{" "}
                            {offer.maxPrice.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {offer.note && (
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Box display="flex" alignItems="center">
                        <Tooltip title="Note">
                          <IconButton size="small">
                            <FaMoneyBillWave style={iconStyles} />
                          </IconButton>
                        </Tooltip>
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Note
                          </Typography>
                          <Typography component="pre" textWrap="wrap">
                            {offer.note}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
function PriceOfferSwitch({ priceOffer, setPriceOffers }) {
  const [checked, setChecked] = React.useState(priceOffer.isAccepted);
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const handleChange = async (event) => {
    const request = await handleRequestSubmit(
      { priceOfferId: priceOffer.id, isAccepted: event.target.checked },
      setLoading,
      `shared/client-lead/price-offers/change-status`,
      false,
      "Updating"
    );
    if (request.status === 200) {
      setChecked(request.data.isAccepted);
      if (setPriceOffers) {
        setPriceOffers((oldPrices) =>
          oldPrices.map((offer) => {
            if (offer.id === priceOffer.id) {
              offer.isAccepted = checked;
            }
            return offer;
          })
        );
      }
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body1" color="textPrimary">
        {checked ? "Offer Accepted" : "Accept Offer"}
      </Typography>
      <Tooltip title="Toggle to accept or reject the price offer">
        <Switch
          checked={checked}
          onChange={handleChange}
          inputProps={{ "aria-label": "Accept Price Offer" }}
          disabled={
            user.role !== "STAFF" &&
            user.role !== "ADMIN" &&
            user.role !== "SUPER_ADMIN" &&
            user.role !== "SUPER_SALES"
          }
        />
      </Tooltip>
    </Box>
  );
}
