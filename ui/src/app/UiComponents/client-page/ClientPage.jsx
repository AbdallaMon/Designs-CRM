"use client"
import React, {useEffect, useState} from "react";
import {
    AppBar,
    Autocomplete,
    Box,
    Button,
    Container, MenuItem,
    Paper, Select,
    Stack,
    TextField, Toolbar,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import colors from "@/app/helpers/colors.js";
import { Emirate, LeadCategory, LeadType} from "@/app/helpers/constants.js";
import {gsap} from "gsap";
import {IoArrowBackOutline} from "react-icons/io5";
import {useAlertContext} from "@/app/providers/MuiAlert.jsx";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput.jsx";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit.js";
import {useToastContext} from "@/app/providers/ToastLoadingProvider.js";
import {useLanguageContext} from "@/app/providers/LanguageProvider.jsx";
import {FaPercentage} from "react-icons/fa";

const consultationLead = [{name: "Room", value: "ROOM", subtext: "200"},
    {value: "BLUEPRINT", subtext: "400"},
    {value: "CITY_VISIT", subtext: "600"},
]
const designLead = [
    {
        value: "APARTMENT",
    },
    {
        value: "OCCUPIED_VILLA",
    },
    {
        value: "UNDER_CONSTRUCTION_VILLA",
    },
    {
        value: "PART_OF_HOME",
    },
    {
        value: "COMMERCIAL",
    },
]
const leads = [
    {
        title: "Consultation",
        value: "CONSULTATION",
        image: "/consultation.jpg"
    },
    {
        title: "Design",
        value: "DESIGN",
        image: "/design.jpg"
    }
]
const questions = {
    category: "How can we serve you?"
    ,
    type: "Choose from options"
}

export default function ClientPage() {
    const [leadCategory, setLeadCategory] = useState()
    const [animateLeadType, setAnimateLeadType] = useState("")
    const [isCatAnimated, setIsCatAnimated] = useState(false)
    const [leadItem, setLeadItem] = useState("")
    const [animateLeadItem, setAnimateLeadItem] = useState("")
    const [isItemAnimated, setIsItemAnimated] = useState(false)
    const [isReversing,setIsReversing]=useState(false)
    const [isAnimating,setIsAnimating]=useState(false)

    function animateLeadCategory(value) {
        if (isCatAnimated||isAnimating||isReversing) return
        setLeadCategory(value)
        setAnimateLeadType("animate")
    }

    function animateLeadCategoryItems(value) {
        if (isItemAnimated||isAnimating||isReversing) return
        setLeadItem(value)
        setAnimateLeadItem("animate")
    }

    useEffect(() => {
        if (typeof window !== "undefined") {
            const leadElements = document.querySelectorAll(".lead-card ")
            if (leadElements) {
                setIsAnimating(true)
                const reversedLeadElements = Array.from(leadElements).reverse();
                reversedLeadElements.forEach((leadElement,index) => {
                    window.setTimeout(() => {
                        const isDownMd = () => window.matchMedia(`(max-width: ${900- 1}px)`).matches;
                        console.log(isDownMd())
                        const isMobile=isDownMd()
                        const {top, left, height, width} = leadElement.getBoundingClientRect();
                        leadElement.setAttribute("h", height)
                        leadElement.setAttribute("w", width)
                        leadElement.setAttribute("l", left)
                        leadElement.setAttribute("t", isMobile&&index===0?top:top)
                        const actualLeft=isMobile?left-0:left-12
                        gsap.set(leadElement, {
                            position: "fixed",
                            top: `${isMobile&&index===0?top-6:top}px`,
                            left: `${actualLeft}px`,
                            height: `${height}px`,
                            width: `${width}px`
                        })
                        gsap.fromTo(
                              ".category-title",
                              {
                                  opacity: 0,
                                  y: 50,
                              },
                              {
                                  y: 0,
                                  opacity: 1,
                                  duration: 0.8,
                                  ease: "power3.out",
                              }
                        );

                    })
                }, 0)
                setIsAnimating(false)
            }
        }
    }, [])
    useEffect(() => {
        if (animateLeadType === "animate"&&!isCatAnimated&&!isAnimating&&!isReversing) {
            setIsAnimating(true)
            const removedElement = leadCategory === "DESIGN" ? "CONSULTATION" : "DESIGN"
            const tl = gsap.timeline();
            const leadElement = document.querySelector(`.${leadCategory} `);
            const {top, left, height, width} = leadElement.getBoundingClientRect();
            const centerX = window.innerWidth / 2 - width / 2;
            const centerY = window.innerHeight / 2 - height / 2;
            tl.set(".lead-card", {
                boxShadow: "none",
                borderRadius: "0px"
            });
            tl.fromTo(
                  `.${removedElement} `,
                  {x: 0, opacity: 1},
                  {
                      x: -100, opacity: 0, duration: 0.8, ease: "power3.inOut", // Smoother easing function
                  }
            )
            tl.fromTo(
                  leadElement,
                  {
                      top: `${top}px`,
                      left: `${left}px`,
                      height: `${height}px`,
                      width: `${width}px`,
                  },
                  {
                      top: `${centerY}px`,
                      left: `${centerX}px`,
                      height: `${height}px`,
                      width: `${width}px`,
                      duration: 0.8,
                      ease: "power3.inOut", // Enhanced easing for smoother movement
                      margin: 0
                  }
                  , "<"
            );
            const leadText = leadElement.querySelector("h4")

            tl.to(leadText, {
                top: "80px",
                left: "50%",
                transform: "translate(-50%,0%)",

            })
            tl.to(leadElement, {
                top: 0,
                left: 0,
                height: "100vh",
                width: "100vw",
                duration: 0.8,
                ease: "power3.out",
            });
            tl.fromTo(".reverse-button", {
                      x: -50
                  }
                  , {
                      display: "flex"
                      ,
                      x: 0
                  }
                  , "<"
            )
            tl.fromTo(".logo", {
                      marginLeft:0
                  }
                  , {

                      marginLeft:12
                  }
                  , "<"
            )

            tl.fromTo(
                  ".lead-item",
                  {y: 50, opacity: 0}, // Starting properties
                  {
                      y: 0,
                      opacity: 1,
                      stagger: 0.1,
                      ease: "power3.out",
                  }
            );
            tl.fromTo(
                  ".item-title",
                  {
                      opacity: 0,
                      y: -50,
                  },
                  {
                      y: 0,
                      opacity: 1,
                      duration: 1,
                      ease: "power3.out",
                  },
                  "<"
            ).then( () => {
                setIsAnimating(false);
                setIsCatAnimated(true);
            });

        }
    }, [animateLeadType])

    useEffect(() => {
        if (animateLeadItem === "animate"&&!isItemAnimated&&!isAnimating&&!isReversing) {
            setIsAnimating(true)
            const tl = gsap.timeline();
            tl.fromTo(
                  ".form-page",
                  {
                      top: "100%", // Start from off-screen
                      opacity: 0,  // Invisible initially
                  },
                  {
                      top: 0,        // Move to its final position
                      opacity: 1,    // Fade in
                      display: "block", // Ensure it becomes visible
                      duration: 0.8, // Smooth duration
                      ease: "power3.out", // Smooth easing
                  }
            );
            tl.fromTo(
                  ".final-selection-form",
                  {
                      opacity: 0,
                      scale: 0.9,
                  },
                  {
                      opacity: 1,
                      scale: 1,
                      duration: 0.6,
                      ease: "back.out(1.7)",
                  },
            ).then(() => {
                setIsAnimating(false);
                setIsItemAnimated(true);
            });

        }
    }, [animateLeadItem]);
    function reverseAnimation() {
        if (leadItem&&isItemAnimated&&!isReversing&&!isAnimating) {
            setIsReversing(true)
            const tl = gsap.timeline();
            tl.fromTo(
                  ".form-page",
                  {
                      top: 0,
                      opacity: 1,
                      display: "block",
                  },
                  {
                      top: "100%",
                      opacity: 0,
                      display: "none",
                      duration: 0.8,
                      ease: "power3.inOut",
                  }
            ).then(() => {
                setLeadItem(""); // Reset lead item
                setAnimateLeadItem(""); // Clear animation state
                setIsItemAnimated(false)
                setIsReversing(false)
            });
        } else if (leadCategory&&isCatAnimated&&!isReversing&&!isAnimating) {
            setIsReversing(true)
            const tl = gsap.timeline();
            const removedElement = leadCategory === "DESIGN" ? "CONSULTATION" : "DESIGN"
            const leadElement = document.querySelector(`.${leadCategory} `);
            tl.fromTo(".item-title", {
                opacity: 1,
                y: 0,
            }, {
                opacity: 0,
                y: 50,
                duration: 0.6,
                ease: "power3.inOut",
            })
            tl.to(".lead-item", {
                y: 50,
                opacity: 0,
                stagger: 0.1,
                duration: 0.6,
                ease: "power3.inOut",
            }).to(leadElement, {
                top: `${leadElement.getAttribute("t")}px`,
                left: `${leadElement.getAttribute("l")}px`,
                height: `${leadElement.getAttribute("h")}px`,
                width: `${leadElement.getAttribute("w")}px`,
                borderRadius: "12px",
                duration: 0.8,
                ease: "power3.inOut",
            }).fromTo(".reverse-button", {
                      x: 0                  }
                  , {
                      display: "none"
                      ,
                      x: -50
                  }
                  , "<").fromTo(".logo", {
                      marginLeft:12
                  }
                  , {
                      marginLeft:0
                  }
                  , "<"
            )
                  .to(`.${removedElement}`, {
                      x: 0,
                      borderRadius: "12px",
                      opacity: 1,
                      duration: 0.8,
                      ease: "power3.inOut",
                  })
            const leadText = leadElement.querySelector("h4")
            tl.to(leadText, {
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                  },
                  "<")
            tl.fromTo(".category-title", {
                      opacity: 0,
                      y: 50,
                      duration: 0.6,
                      ease: "power3.inOut",
                  },
                  {
                      opacity: 1,
                      y: 0,
                      duration: 0.6,
                      ease: "power3.inOut",
                  },
                  "<"
            )
                  .then(() => {
                      setLeadCategory("");
                      setAnimateLeadType("");
                      setIsCatAnimated(false)
                      setIsReversing(false)
                  });
        }
    }

    return (
          <>
              <Header reverseAnimation={reverseAnimation}/>
              <Container maxWidth="md" sx={{height: "100vh", overflow: "hidden", py: {xs: 3, md: 4}}}>
                  <Paper
                        className="page-container"
                        elevation={2}
                        sx={{
                            p: {xs: 2, md: 3},
                            borderRadius: "12px",
                            backgroundColor: colors.bgPrimary,
                            width: "100%",
                            overflow: "hidden",
                            height: "calc(100vh - 48px)",
                        }}
                  >
                      <LeadCardsContainer handleClick={animateLeadCategory}/>
                      {leadCategory &&
                            <LeadCategoryItemsContainer leadCategory={leadCategory}
                                                        animateLeadCategoryItems={animateLeadCategoryItems}/>
                      }
                  </Paper>

              </Container>
              <Box className="form-page"
                   sx={{
                       position: "fixed",
                       top: 0,
                       left: 0,
                       width: "100%",
                       height: "100vh",
                       background:colors.bgPrimary
                       ,                       zIndex: 20,
                       display: "none"

                   }}
              >
                  <Container maxWidth="md" sx={{
                      height: "100vh",
                      overflow: "hidden",
                      pb: {xs: 3, md: 4},
                      pt:10,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center"
                  }}>
                      <FinalSelectionForm category={leadCategory} item={leadItem}/>
                  </Container>
              </Box>
          </>
    )
}

function LeadCardsContainer({handleClick}) {
    const {translate}=useLanguageContext()
    return (
          <Box className="leads-cards-container">
              <Title title={translate(questions.category)} class_name={"category-title"}/>
              <Box>
                  {leads.map((lead) => {
                      return (
                            <LeadCard key={lead.value} lead={lead} handleClick={handleClick}/>
                      )
                  })}
              </Box>
          </Box>
    )
}

function Title({title, class_name}) {
    const theme = useTheme()

    return (
          <Typography
                variant="h4"
                className={class_name}
                sx={{
                    textAlign: "center",
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 4,
                    mt:5,
                    opacity: 0
                }}
          >
              {title}
          </Typography>
    )
}

function LeadCard({lead, handleClick}) {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const {translate}=useLanguageContext()
    return <Box
          className={`lead-card ${lead.value}`}
          onClick={() => handleClick(lead.value)}
          sx={{
              position: "relative",
              minHeight: isMobile ? "180px" : "200px",
              borderRadius: "12px",
              width: isMobile ? "100%" : "calc( 50% - 24px )",
              display: "inline-block",
              cursor: "pointer",
              my: isMobile?"12px":0,
              mx: isMobile?0:"12px",
              boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
              backgroundColor: "#fff",
              overflow: "hidden",

          }}
    >
        <Box
              className="lead-card-image"
              sx={{
                  position: "absolute", height: "100%", width: "100%",
                  backgroundImage: `url(${lead.image || "/design.jpg"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1,

              }}>
            <Box
                  sx={{
                      position: "absolute", height: "100%", width: "100%",
                      zIndex: 2,
                      background: "linear-gradient(169deg, rgba(45, 35, 30, 0.3) 0%, rgba(45, 35, 30, 0.85) 100%)",
                  }}>
            </Box>
        </Box>
        <Typography
              variant="h4"
              sx={{
                  color: theme.palette.secondary.main,
                  fontWeight: 700,
                  textAlign: "center",
                  letterSpacing: "0.5px",
                  position: "absolute",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "fit-content",
                  height: "fit-content",
                  zIndex: 3000,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
              }}
        >

            {translate(lead.title)}
        </Typography>
    </Box>
}


function LeadCategoryItemsContainer({leadCategory, animateLeadCategoryItems}) {
    const {translate}=useLanguageContext()
    const leadsItems = leadCategory === "DESIGN" ? designLead : consultationLead
    return (
          <>
              <Title title={translate(questions.type)} class_name={"item-title"}/>
              <Box sx={{display: "flex", flexDirection: {xs: "column"}, gap: 2}}>
                  {leadsItems.map((item) => {
                      return (
                            <LeadCategoryItem key={item.value} title={translate(LeadType[item.value])}
                                              value={item.value} animateLeadCategoryItems={animateLeadCategoryItems} subtitle={item.subtext}/>
                      )
                  })
                  }
              </Box>
          </>
    )
}

function LeadCategoryItem({title, value, animateLeadCategoryItems,subtitle}) {
    const {translate}=useLanguageContext()
    return (
          <Box
                sx={{
                    width: "100%",
                    padding: "24px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection:"column",
                    backgroundColor: colors.bgPrimary,
                    textAlign: "center",
                    fontWeight: 500,
                    opacity: 0,
                    cursor:"pointer"
                }}
                onClick={() => animateLeadCategoryItems(value)}
                className={"lead-item"}
          >
              <Typography variant="h5" sx={{fontWeight: 500}}>
                  {title}
              </Typography>
              {subtitle && (
                    <Typography
                          variant="subtitle2"
                          sx={{
                              fontWeight: 400,
                              color: "inherit"
                          }}
                    >
                        {subtitle+"AED"}
                    </Typography>
              )}
          </Box>
    );
}

function FinalSelectionForm({category, item}) {
    const {translate,lng}=useLanguageContext()
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        emirate: null,
        priceRange: [0, 0],
        file:null,
    });
    const [renderSuccess,setRenderSuccess]=useState(false)
    const {setAlertError}=useAlertContext()
    const {setLoading}=useToastContext()

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const handleChange = (e) => {
        const {name, value} = e.target;
        if (name === "phone" && !/^\d*$/.test(value)) {
            return; // Prevent setting invalid value
        }
        setFormData((prev) => ({...prev, [name]: value}));
    };
    const handleEmirateChange = (event, newValue) => {
        console.log(newValue,"new")
        setFormData((prev) => ({...prev, emirate: newValue?newValue.key:null}));
    };
    const handlePriceChange = (index, value) => {
        setFormData((prev) => {
            const newPriceRange = [...prev.priceRange];
            newPriceRange[index] = Number(value) || 0; // Parse the value to number
            return {...prev, priceRange: newPriceRange};
        });
    };
    const handleSubmit =async () => {
        const { name, phone, priceRange,file,emirate } = formData;
        console.log(formData,"formData")
        if (!name || !phone ||( !emirate && category==="DESIGN")) {
            setAlertError(translate("Please fill all the fields."));
            return;
        }
        if (priceRange[0] > priceRange[1]&&category==="DESIGN") {
            setAlertError(translate("Minimum price cannot be greater than maximum price."));
            return;
        }
        if(formData.file){
            const form = new FormData();
            form.append('file', formData.file);
            const fileUpload = await handleRequestSubmit(form, setLoading, "client/upload", true, translate("Uploading file"))
            if (fileUpload.status === 200) {
                const data={...formData,url:fileUpload.fileUrls.file[0],category,item,lng}
                const request= await handleRequestSubmit(data, setLoading, "client/new-lead", false, translate("Submitting"))
                if(request.status===200){
                    setRenderSuccess(true)
                }
            }
        }else{
            const data={...formData,category,item,lng}
            const request= await handleRequestSubmit(data, setLoading, "client/new-lead", false, translate("Submitting"))
            if(request.status===200){
                setRenderSuccess(true)
            }
        }
    };

    const emiratesOptions = Object.entries(Emirate).map(([key, value]) => ({
        key,
        label: value,
    }));
    return (
          <Box
                sx={{
                    height:"100%",
                    overflowY:"auto",
                    minWidth:isMobile?"100%":"800px",
                }}
                className="final-selection-form"
          >
              {renderSuccess?<SuccessPage formData={formData}/>:
                    <Paper
                          elevation={4}
                          sx={{
                              padding: {xs:2,md:4},
                              borderRadius: 3,
                              background: "linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)",
                              direction:lng==="ar"?"ltr":"ltr"
                          }}
                    >
                        <Typography
                              variant="h4"
                              sx={{
                                  marginBottom: 1,
                                  textAlign: "center",
                                  fontWeight: 700,
                                  color: theme.palette.primary.main,
                              }}
                        >
                            {translate("Complete Your Request")}
                        </Typography>
                        <Box sx={{ marginBottom: 3, textAlign: "center",display:"flex",gap:2,alignItems:"center",justifyContent:"center" }}>
                            <Typography variant="subtitle1">{translate(LeadCategory[category]) || ""}</Typography> -
                            <Typography variant="subtitle1">{translate(LeadType[item]) || ""}</Typography>
                        </Box>
                        <Stack spacing={3}>
                            <TextField
                                  fullWidth
                                  label={translate("Name")}
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
                                      },
                                  }}
                            />
                            <TextField
                                  fullWidth
                                  label={translate("Phone")}
                                  name="phone"
                                  type="tel"
                                  variant="outlined"
                                  value={formData.phone}
                                  onChange={handleChange}
                                  sx={{
                                      direction:lng==="ar"?"ltr":"rtl"
                                  }}
                                  InputProps={{
                                      sx: {
                                          borderRadius: 2,
                                          "&:hover": {
                                              "& fieldset": {
                                                  borderColor: "primary.main",
                                              },
                                          },
                                      },
                                  }}
                            />
                            {category!=="CONSULTATION"&&
                                  <>
                                      <Autocomplete
                                            options={emiratesOptions}
                                            getOptionLabel={(option) => translate(option.label)}
                                            onChange={handleEmirateChange}
                                            renderInput={(params) => (
                                                  <TextField {...params} label={translate("Select Location")} variant="outlined"/>
                                            )}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: 2,
                                                },
                                            }}
                                      />
                                      <Box sx={{mb:1}}>
                                          <Typography variant="subtitle1" gutterBottom sx={{mt:-1.8,mb:2}} >
                                              {translate("Price Range")}
                                          </Typography>
                                          <Stack direction="row" spacing={2} alignItems="center" sx={{mt:-1.5}}>
                                              <TextField
                                                    type="number"
                                                    label={translate("Min")}
                                                    value={formData.priceRange[0]}
                                                    onChange={(e) => handlePriceChange(0, e.target.value)}
                                                    sx={{flex: 1}}
                                                    InputProps={{
                                                        sx: {borderRadius: 2},
                                                    }}
                                              />
                                              <TextField
                                                    type="number"
                                                    label={translate("Max")}
                                                    value={formData.priceRange[1]}
                                                    onChange={(e) => handlePriceChange(1, e.target.value)}
                                                    sx={{flex: 1}}
                                                    InputProps={{
                                                        sx: {borderRadius: 2},
                                                    }}
                                              />

                                          </Stack>
                                      </Box>
                                  </>
                            }
                            <Typography>
                                {translate("Add an attachment (optional)")}
                            </Typography>
                            <SimpleFileInput label={translate("Add an attachment")} id="file"  setData={setFormData} variant="outlined" />

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
                                      boxShadow:
                                            "0 4px 20px 0 rgba(61, 71, 82, 0.1), 0 0 0 0 rgba(0, 127, 255, 0)",
                                  }}
                            >
                                {translate("Submit")}
                            </Button>
                        </Stack>
                    </Paper>
              }
          </Box>
    );
}
function SuccessPage({ formData }) {
    const isInsideEmirates = formData.emirate !== "OUTSIDE";
    const { translate } = useLanguageContext();

    useEffect(() => {
        gsap.set(".reverse-button", {
            display: "none",
        });
    }, []);

    return (
          <Paper
                elevation={4}
                sx={{
                    padding: 3,
                    borderRadius: 3,
                    backgroundColor: "#fff",
                    textAlign: "center",
                }}
          >
              {isInsideEmirates ? (
                    <>
                        <Typography
                              variant="h4"
                              sx={{
                                  color: "green",
                                  fontWeight: 700,
                                  marginBottom: 2,
                              }}
                        >
                            {translate("Success!")}
                        </Typography>
                        <Typography variant="body1">
                            {translate("Thank you for your submission. We will contact you soon.")}
                        </Typography>
                        <Box
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginTop: 2,
                              }}
                        >
                            <FaPercentage  />
                            <Typography
                                  variant="body1"
                                  sx={{
                                      fontWeight: 600,
                                      color: "green",
                                  }}
                            >
                                {translate("You got a 10% discount!")}
                            </Typography>
                        </Box>
                    </>
              ) : (
                    <>
                        <Typography
                              variant="h4"
                              sx={{
                                  color: "red",
                                  fontWeight: 700,
                                  marginBottom: 2,
                              }}
                        >
                            {translate("Sorry!")}
                        </Typography>
                        <Typography variant="body1">
                            {translate("We do not provide services outside the UAE.")}
                        </Typography>
                    </>
              )}
          </Paper>
    );
}



function Header({reverseAnimation}) {
    const theme = useTheme();
    const {lng,changeLanguage}=useLanguageContext()
    return (
          <Container
                position="fixed"
                elevation={0}
                maxWidth="md"
                sx={{
                    top: 8,
                    left: 0,
                    right: 0,
                    position:"fixed",
                    zIndex:30
                }}
          >


              <Toolbar sx={{ justifyContent: 'space-between' ,
                  background: theme.palette.background.paper,
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  margin:"0 12px"
              }}>
                  <Box sx={{display:"flex",alignItems:"center"}}>
                      <Box className="reverse-button"
                           onClick={reverseAnimation}
                           sx={{
                               display: "none",
                               zIndex: 2000,
                               backgroundColor: "primary.main",
                               color: "white",
                               alignItems: "center",
                               justifyContent: "center",
                               width: "40px",
                               height: "40px",
                               borderRadius: "50%",
                               boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                               cursor: "pointer"
                           }}>
                          <IoArrowBackOutline size={26}/>
                      </Box>
                      <Box
                            component="img"
                            src="/logo.png"
                            alt="Logo"
                            className="logo"
                            sx={{
                                height: 40,
                                width: 'auto'
                            }}
                      />
                  </Box>
                  <Select
                        value={lng}
                        onChange={(e) => changeLanguage(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{
                            minWidth: 80,
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'transparent'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'transparent'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'transparent'
                            }
                        }}
                  >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="ar">العربية</MenuItem>
                  </Select>
              </Toolbar>
          </Container>
    );
}
