import React, { useState } from 'react';
import {
    Card,
    CardContent,
    List,
    ListItem,
    Typography,
    Box,
    Grid2 as Grid,
    IconButton,
    Chip,
    Tooltip,
    useTheme, Link
} from '@mui/material';
import {
    FaMoneyBillWave,
    FaUserAlt,
    FaCalendarAlt,

} from 'react-icons/fa';
import dayjs from 'dayjs';
import {AddPriceOffers} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";

const PriceOffersList = ({ admin, lead ,notUser}) => {
    const [offers, setOffers] = useState(lead.priceOffers);
    const theme = useTheme();

    const cardStyles = {
        height: '100%',
        boxShadow: theme.shadows[1],
        position: 'relative',
        p:2,

    };

    const listItemStyles = {
        borderRadius: 1,
        mb: 2,
        bgcolor: 'background.paper',
        '&:hover': {
            bgcolor: theme.palette.grey[50],
            transition: 'background-color 0.2s ease-in-out'
        }
    };

    const iconStyles = {
        color: theme.palette.primary.main,
        marginRight: theme.spacing(1),
        fontSize: '1.2rem'
    };

    return (
          <Card sx={cardStyles}>
              {!admin&&!notUser&& <AddPriceOffers lead={lead} setPriceOffers={setOffers} />}

              <CardContent>
                  <Box display="flex" alignItems="center" mb={3}>
                      <FaMoneyBillWave style={{ ...iconStyles, fontSize: '1.5rem' }} />
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

                  <List>
                      {offers?.map((offer) => (
                            <ListItem
                                  key={offer.id}
                                  sx={listItemStyles}
                                  disablePadding
                            >
                                <Box sx={{ width: '100%', p: 2 }}>
                                    {offer.url&&<Box sx={{display:"flex",justifyContent:"flex-end"}}><Link href={offer.url} target="_blank" >Preview attachment</Link></Box>}
                                    <Grid container spacing={3}>
                                        <Grid size={{xs:12,md:4}}>
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

                                        {/* Price Range */}
                                        <Grid size={{xs:12,md:4}}>
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
                                                        {offer.minPrice.toLocaleString()} - {offer.maxPrice.toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        {/* Created At */}
                                        <Grid size={{xs:12,md:4}}>
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
                                    </Grid>
                                </Box>
                            </ListItem>
                      ))}
                  </List>
              </CardContent>
          </Card>
    );
};

export default PriceOffersList;