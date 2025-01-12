"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { serviceCategories } from "@/app/helpers/constants.js";
import {
    Button,
    Typography,
    Box,
    Card,
    TextField,
    Container,
    Paper,
    Breadcrumbs,
    Stack,
    IconButton,
     Grid2 as Grid, useTheme, useMediaQuery,
} from "@mui/material";
import { IoArrowBack as ArrowBackIcon } from "react-icons/io5"; // ArrowBackIcon
import { MdNavigateNext as NavigateNextIcon} from "react-icons/md";
import colors from "@/app/helpers/colors.js"; // NavigateNextIcon

const animations = {
    container: {
        initial: { opacity: 1 },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1,
                when: "afterChildren",
            },
        },
    },
    item: {
        initial: { opacity: 0, y: 50 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24,
                duration: 0.5,
            }
        },
        exit: (isSelected) => ({
            x: isSelected ? 0 : -100,
            opacity: 0,
            transition: {
                duration: 0.3,
                ease: "easeInOut",
            },
        }),
    },
    selectedItemText: {
        initial: { y: 0 },
        exit: {
            y: -150,
            transition: {
                duration: 0.5,
                ease: "easeInOut",
            }
        },
    },
};
const sectionTitles = {
    default: "How can we serve you?",
    CONSULTATION: "Choose Your Consultation Type",
    DESIGN: "Pick a Design Category",
    RESIDENTIAL: "Residential Options",
    COMMERCIAL: "Commercial Options",
    EMIRATES: "Select an Emirate",
    EMIRATE:"Select price range",
    PRICE_RANGE: "Selected Range",
    FINAL: "Complete Your Selection",
    ITEM:"Select from, current options"
};

const AnimatedTitle = ({ path ,close}) => {
    // Function to determine the current title
    const getCurrentTitle = () => {
        if (path.length === 0) return sectionTitles.default;

        const lastItem = path[path.length - 1];

        // If selecting a price range
        if (lastItem.value === "PRICE_RANGE") {
            return `Selected Range: ${lastItem.name}`;
        }

        // If choosing an Emirate
        if (lastItem.value === "EMIRATE") {
            return `Choose a Price Range for ${lastItem.name}`;
        }

        // Default for other sections
        return sectionTitles[lastItem.value] ||sectionTitles[lastItem.type] || sectionTitles.default;
    };

    const title = getCurrentTitle();
    const theme = useTheme();

    if(close)return
    return (
          <motion.div
                key={title}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                }}
          >
              <Typography
                    variant="h4"
                    sx={{
                        textAlign: "center",
                        fontWeight: 700,
                        color:theme.palette.primary.main,
                        mb: 4,
                    }}
              >
                  {title}
              </Typography>
          </motion.div>
    );
};

const CategoryComponent = ({ current, onSelect, selectedItem }) => {
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleItemClick = async (item) => {
        setIsTransitioning(true);
        onSelect(item);
        setIsTransitioning(false);
    };
    const theme=useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    return (

          <motion.div
                variants={animations.container}
                initial="initial"
                exit="exit"
          >
                  <AnimatePresence mode="wait">
                      <Grid container spacing={2}>

                      {current.map((item) => (
                            <Grid key={item.value}  size={{xs:12,md:6}}>

                            <motion.div
                                  key={item.value}
                                  variants={animations.item}
                                  initial="initial"
                                  animate="animate"
                                  exit="exit"
                                  custom={item === selectedItem}
                                  layout
                            >
                                <Card
                                      elevation={3}
                                      onClick={() => !isTransitioning && handleItemClick(item)}
                                      sx={{
                                          position: "relative",
                                          minHeight:isMobile?"180px": "200px",
                                          borderRadius: "20px",
                                          cursor: "pointer",
                                          overflow: "hidden",
                                          transition: "all 0.3s ease-in-out",
                                          backgroundImage: `url(${item.image || "/design.jpg"})`,
                                          backgroundSize: "cover",
                                          backgroundPosition: "center",
                                          filter: "brightness(0.9)",
                                          "&:hover": {
                                              filter: "brightness(0.7)",
                                          },
                                      }}
                                >
                                    <Box
                                          sx={{
                                              position: "absolute",
                                              top:0,
                                              left:0,
                                              height: "100%",
                                              width:"100%",
                                              zIndex:10,
                                              display: "flex",
                                              flexDirection: "column",
                                              justifyContent: "center",
                                              alignItems: "center",
                                              background: "linear-gradient(169deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)",
                                              "&:hover": {
                                                  background: "linear-gradient(169deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)",
                                              },
                                          }}
                                    >
                                        <motion.div
                                              variants={selectedItem === item ? animations.selectedItemText : {}}
                                        >
                                            <Typography
                                                  variant="h4"
                                                  sx={{
                                                      color: "white",
                                                      fontWeight: 700,
                                                      textAlign: "center",
                                                      textShadow: "2px 2px 4px rgba(0,0,0,0.4)",
                                                      letterSpacing: "0.5px",
                                                  }}
                                            >
                                                {item.name}
                                            </Typography>
                                            {item.subtext && (
                                                  <Typography
                                                        variant="h6"
                                                        sx={{
                                                            color: "white",
                                                            opacity: 0.9,
                                                            textAlign: "center",
                                                            maxWidth: "90%",
                                                            mt:1.5,
                                                            margin: "0 auto",
                                                            textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                                                            fontWeight: 400,
                                                        }}
                                                  >
                                                      {item.subtext}
                                                  </Typography>
                                            )}
                                        </motion.div>
                                    </Box>
                                </Card>
                            </motion.div>
                            </Grid>
                      ))}
                      </Grid>

                  </AnimatePresence>
          </motion.div>

    );
};
const FinalSelectionForm = ({ state, onSubmit }) => {
    const [formData, setFormData] = useState({ name: "", phone: "" });
const theme=useTheme()
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        const selectedData = { ...state, userData: formData };
        onSubmit(formData);
    };

    return (
          <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                }}
          >
              <Paper
                    elevation={4}
                    sx={{
                        padding: 4,
                        borderRadius: 3,
                        background: "linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)",
                    }}
              >
                  <Typography
                        variant="h4"
                        sx={{
                            marginBottom: 4,
                            textAlign: "center",
                            fontWeight: 700,
                            color:theme.palette.primary.main,

                        }}
                  >
                      Complete Your Request
                  </Typography>
                  <Stack spacing={3}>
                      <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            variant="outlined"
                            value={formData.name}
                            onChange={handleChange}
                            InputProps={{
                                sx: {
                                    borderRadius: 2,
                                    "&:hover": {
                                        "& fieldset": {
                                            borderColor: "primary.main",
                                        },
                                    },
                                }
                            }}
                      />
                      <TextField
                            fullWidth
                            label="Phone"
                            name="phone"
                            variant="outlined"
                            value={formData.phone}
                            onChange={handleChange}
                            InputProps={{
                                sx: {
                                    borderRadius: 2,
                                    "&:hover": {
                                        "& fieldset": {
                                            borderColor: "primary.main",
                                        },
                                    },
                                }
                            }}
                      />
                      <Button
                            variant="contained"
                            onClick={handleSubmit}
                            size="large"
                            sx={{
                                borderRadius: 2,
                                padding: "16px",
                                fontSize: "1.2rem",
                                fontWeight: 600,
                                textTransform: "none",
                                boxShadow: "0 4px 20px 0 rgba(61, 71, 82, 0.1), 0 0 0 0 rgba(0, 127, 255, 0)",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 8px 25px 0 rgba(61, 71, 82, 0.15), 0 0 0 0 rgba(0, 127, 255, 0)",
                                },
                            }}
                      >
                          Complete Selection
                      </Button>
                  </Stack>
              </Paper>
          </motion.div>
    );
};

export default function Home() {
    const [state, setState] = useState({
        history: [],
        current: serviceCategories.categories,
        path: [],
        selection: null,
    });

    const handleSelect = (item) => {
        setState(prev => ({
            ...prev,
            selectedItem: item,
        }));

            if (item.type === "FINAL") {
                setState(prev => ({
                    ...prev,
                    history: [...prev.history, prev.current],
                    path: [...prev.path, item],
                    selection: item,
                    current: [],
                    selectedItem: null,
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    history: [...prev.history, prev.current],
                    path: [...prev.path, item],
                    current: item.subItems || item.priceRanges || [],
                    selection: null,
                    selectedItem: null,
                }));
            }
    };


    const handleBack = () => {
        if (state.history.length > 0) {
            const newHistory = [...state.history];
            const previous = newHistory.pop();
            const newPath = [...state.path];
            newPath.pop();

            setState({
                history: newHistory,
                current: previous,
                path: newPath,
                selection: null,
            });
        }
    };

    const handleSubmit = (formData) => {
        alert(`Name: ${formData.name}, Phone: ${formData.phone}`);
    };
console.log(state,"state")
    return (
          <Container maxWidth="md" sx={{ py: 4 }}>
              <Paper
                    elevation={2}
                    sx={{
                        padding: 3,
                        borderRadius: 3,
                        mb: 4,
                        background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
                    }}
              >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <IconButton
                            onClick={handleBack}
                            disabled={state.history.length === 0 && !state.selection}
                            sx={{
                                bgcolor: "action.hover",
                                "&:hover": {
                                    bgcolor: "action.selected",
                                },
                            }}
                      >
                          <ArrowBackIcon />
                      </IconButton>
                      <Breadcrumbs
                            separator={<NavigateNextIcon style={{ fontSize: "1.2rem" }} />}
                            sx={{ flex: 1 }}
                      >
                          {state.path.map((p, index) => (
                                <motion.div
                                      key={index}
                                      initial={{ opacity: 0, y: -20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                >
                                    <Typography
                                          color={index === state.path.length - 1 ? "primary.main" : "text.secondary"}
                                          sx={{
                                              fontWeight: index === state.path.length - 1 ? 600 : 400,
                                              fontSize: "1rem",
                                          }}
                                    >
                                        {p.name}
                                    </Typography>
                                </motion.div>
                          ))}
                      </Breadcrumbs>
                  </Box>
              </Paper>
              <Paper
                    elevation={2}
                    sx={{
    p:{xs:2,md:3},
    borderRadius:"12px",
    backgroundColor:colors.bgPrimary,
}}
              >
              <AnimatePresence mode="wait">
                  <AnimatedTitle  path={state.path} close={state.current.length===0&&state.path.length>0} />

                  {state.current.length === 0 ? (
                        <FinalSelectionForm state={state} onSubmit={handleSubmit} />
                  ) : (

                        <CategoryComponent
                              current={state.current}
                              onSelect={handleSelect}
                              selectedItem={state.selectedItem}
                        />
                  )}
              </AnimatePresence>
</Paper>
          </Container>
    );
}