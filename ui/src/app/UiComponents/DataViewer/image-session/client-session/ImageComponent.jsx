import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardMedia,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  MdAdd,
  MdCheck,
  MdCheckCircle,
  MdDelete,
  MdFullscreen,
} from "react-icons/md";
import { NotesComponent } from "../../utility/Notes";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { ensureHttps } from "@/app/helpers/functions/utility";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

export function ImageComponent({
  handleImageClick,
  handleImageSelect = () => {},
  type,
  image,
  isSelected,
  canDelete,
  setImages,
}) {
  const theme = useTheme();
  const { setLoading } = useToastContext();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const photo = type === "SELECT" ? image : image.designImage;

  const { lng } = useLanguageSwitcherContext();
  async function handleImageDelete(image) {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `client/image-session/images/${image.id}`,
      false,
      "Deleting",
      false,
      "DELETE"
    );
    if (req.status === 200) {
      setImages((old) => old.filter((i) => i.id !== image.id));
    }
  }
  return (
    <>
      <Card
        sx={{
          position: "relative",
          borderRadius: 0,
          overflow: "hidden",
          boxShadow: isSelected ? 3 : 1,
          border: 1,
          borderColor: isSelected ? "success.main" : "white",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: 4,
          },
        }}
      >
        <CardMedia
          component="img"
          height={isMobile ? 280 : 300}
          image={ensureHttps(photo.imageUrl)}
          alt={`Image ${image.id}`}
          sx={{
            cursor: "pointer",
            transition: "transform 0.3s ease",
          }}
          k
        />

        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: isSelected ? "rgba(25, 118, 210, 0.15)" : "transparent",
            transition: "all 0.3s ease",
          }}
        />

        {/* Action buttons container */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {/* Preview button - Always visible */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleImageClick(image);
            }}
            sx={{
              bgcolor: "rgba(0,0,0,0.7)",
              color: "white",
              width: 36,
              height: 36,
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.9)",
                transform: "scale(1.1)",
              },
            }}
            size="small"
          >
            <MdFullscreen size={18} />
          </IconButton>
          {type === "SELECT" ? (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleImageSelect(image, isSelected);
              }}
              sx={{
                bgcolor: isSelected
                  ? "rgba(76, 175, 80, 0.9)"
                  : "rgba(255,255,255,0.9)",
                color: isSelected ? "white" : "rgba(0,0,0,0.7)",
                width: 36,
                height: 36,
                border: isSelected
                  ? "2px solid #4caf50"
                  : "2px solid rgba(0,0,0,0.2)",
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: isSelected
                    ? "rgba(76, 175, 80, 1)"
                    : "rgba(255,255,255,1)",
                  transform: "scale(1.1)",
                  boxShadow: 3,
                },
              }}
              size="small"
            >
              {isSelected ? <MdCheck size={18} /> : <MdAdd size={18} />}
            </IconButton>
          ) : (
            <>
              {canDelete && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageDelete(image);
                  }}
                  sx={{
                    bgcolor: theme.palette.error.main,
                    color: "white",
                    width: 36,
                    height: 36,
                    transition: "all 0.3s ease",
                  }}
                  size="small"
                >
                  {<MdDelete />}
                </IconButton>
              )}
            </>
          )}
        </Box>
        {type === "SELECT" ? (
          <>
            {isSelected && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 8,
                  left: 8,
                  bgcolor: "success.main",
                  color: "white",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  boxShadow: 2,
                }}
              >
                <MdCheckCircle size={14} />
                {lng === "ar" ? "تم التحديد" : "Selected"}
              </Box>
            )}
          </>
        ) : (
          <CardActions>
            <CardActionArea>
              <NotesComponent
                id={image.id}
                idKey="selectedImageId"
                slug="client"
                text={lng === "ar" ? "اضف ملاحظة للتصميم" : "Add note for this"}
              />
            </CardActionArea>
          </CardActions>
        )}
      </Card>
    </>
  );
}
