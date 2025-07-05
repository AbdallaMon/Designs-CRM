import { Router } from "express";
import { verifyTokenAndHandleAuthorization } from "../../services/main/utility.js";
import {
  createColorPallete,
  createDesignImage,
  createMaterial,
  createPageInfo,
  createProOrCon,
  createSpace,
  createStyle,
  createTemplate,
  deleteProOrCon,
  editColorPallete,
  editDesignImage,
  editMaterial,
  editPageInfo,
  editProOrCon,
  editStyle,
  getColors,
  getDesignImages,
  getMaterials,
  getPageInfos,
  getSpaces,
  getStyles,
  getTemplates,
  getTemplatesIds,
  reorderProsAndCons,
  updateSpace,
  updateTemplate,
} from "../../services/main/image-session/imageSessionSevices.js";

const router = Router();

router.use(async (req, res, next) => {
  await verifyTokenAndHandleAuthorization(req, res, next, "ADMIN");
});

router.get("/space", async (req, res) => {
  try {
    const data = await getSpaces({
      notArchived: req.query.notArchived && req.query.notArchived === "true",
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log("error in sapce", e.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", e });
  }
});
router.post("/space", async (req, res) => {
  try {
    const data = await createSpace({ data: req.body });
    res.status(200).json({ data, message: "Space created successfully" });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", e });
  }
});
router.put("/space/:spaceId", async (req, res) => {
  try {
    const data = await updateSpace({
      data: req.body,
      spaceId: req.params.spaceId,
    });
    res.status(200).json({ data, message: "Space updated" });
  } catch (e) {
    console.log(e, "e");

    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", e });
  }
});

// templates

router.get("/templates", async (req, res) => {
  try {
    const data = await getTemplates({
      type: req.query.type,
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", templates });
  }
});
router.get("/templates/ids", async (req, res) => {
  try {
    const data = await getTemplatesIds({
      type: req.query.type,
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", templates });
  }
});
router.post("/templates", async (req, res) => {
  try {
    const data = await createTemplate({ template: req.body });
    res.status(200).json({ data, message: "Template created successfully" });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while creating Template", e });
  }
});
router.put("/templates/:templateId", async (req, res) => {
  try {
    const data = await updateTemplate({
      template: req.body,
      templateId: req.params.templateId,
    });
    res.status(200).json({ data, message: "Template updated" });
  } catch (e) {
    console.log(e, "e");

    res
      .status(500)
      .json({ message: "An error occurred while creating Template", e });
  }
});

// material

router.get("/material", async (req, res) => {
  try {
    const data = await getMaterials({
      notArchived: req.query.notArchived && req.query.notArchived === "true",
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log("error in sapce", e.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching material", e });
  }
});
router.post("/material", async (req, res) => {
  try {
    const data = await createMaterial({ data: req.body });
    res.status(200).json({ data, message: "Material created successfully" });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while creating material", e });
  }
});
router.put("/material/:materialId", async (req, res) => {
  try {
    const data = await editMaterial({
      data: req.body,
      materialId: req.params.materialId,
    });
    res.status(200).json({ data, message: "material updated" });
  } catch (e) {
    console.log(e, "e");

    res
      .status(500)
      .json({ message: "An error occurred while fetching material", e });
  }
});

// style

router.get("/style", async (req, res) => {
  try {
    const data = await getStyles({
      notArchived: req.query.notArchived && req.query.notArchived === "true",
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log("error in sapce", e.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching style", e });
  }
});
router.post("/style", async (req, res) => {
  try {
    const data = await createStyle({ data: req.body });
    res.status(200).json({ data, message: "style created successfully" });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while creating material", e });
  }
});
router.put("/style/:styleId", async (req, res) => {
  try {
    const data = await editStyle({
      data: req.body,
      styleId: req.params.styleId,
    });
    res.status(200).json({ data, message: "style updated" });
  } catch (e) {
    console.log(e, "e");

    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", e });
  }
});
// color pallet

router.get("/colors", async (req, res) => {
  try {
    const data = await getColors({
      notArchived: req.query.notArchived && req.query.notArchived === "true",
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log("error in sapce", e.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching style", e });
  }
});
router.post("/colors", async (req, res) => {
  try {
    const data = await createColorPallete({ data: req.body });
    res
      .status(200)
      .json({ data, message: "Color pallete created successfully" });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while creating pallete", e });
  }
});
router.put("/colors/:colorId", async (req, res) => {
  try {
    const data = await editColorPallete({
      data: req.body,
      colorId: req.params.colorId,
    });
    res.status(200).json({ data, message: "Color pallete updated" });
  } catch (e) {
    console.log(e, "e");

    res
      .status(500)
      .json({ message: "An error occurred while fetching pallete", e });
  }
});

// Design images

router.get("/images", async (req, res) => {
  try {
    const data = await getDesignImages({
      notArchived: req.query.notArchived && req.query.notArchived === "true",
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log("error in sapce", e.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching images", e });
  }
});
router.post("/images", async (req, res) => {
  try {
    const data = await createDesignImage({ data: req.body });
    res.status(200).json({ data, message: "Image created successfully" });
  } catch (e) {
    console.log(e, "e");
    res
      .status(500)
      .json({ message: "An error occurred while creating Image", e });
  }
});
router.put("/images/:imageId", async (req, res) => {
  try {
    const data = await editDesignImage({
      data: req.body,
      imageId: req.params.imageId,
    });
    res.status(200).json({ data, message: "Image updated" });
  } catch (e) {
    console.log(e, "e");

    res
      .status(500)
      .json({ message: "An error occurred while fetching pallete", e });
  }
});

// page info
router.get("/page-info", async (req, res) => {
  try {
    const data = await getPageInfos({
      notArchived: req.query.notArchived && req.query.notArchived === "true",
    });
    res.status(200).json({ data });
  } catch (e) {
    console.log("error in sapce", e.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching style", e });
  }
});
router.post("/page-info", async (req, res) => {
  try {
    const data = await createPageInfo({ data: req.body });
    res.status(200).json({ data, message: "style created successfully" });
  } catch (e) {
    console.log(e, "e");
    if (e.code === "P2002" && e.meta?.target?.includes("unique_type")) {
      res.status(500).json({
        message:
          "This page type already exists. Please choose a different type.",
      });
      return;
    }
    res.status(500).json({ message: e.message });
  }
});
router.put("/page-info/:pageInfoId", async (req, res) => {
  try {
    const data = await editPageInfo({
      data: req.body,
      pageInfoId: req.params.pageInfoId,
    });
    res.status(200).json({ data, message: "style updated" });
  } catch (e) {
    console.log(e, "e");

    res.status(500).json({ message: e.message });
  }
});
//

router.post("/pros-and-cons", async (req, res) => {
  try {
    const data = await createProOrCon({ ...req.body });
    res.status(200).json({ data, message: "Item created successfully" });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: "An error occurred while creating", e });
  }
});
router.post("/pros-and-cons/order", async (req, res) => {
  try {
    const data = await reorderProsAndCons({
      data: req.body.data,
      itemType: req.body.itemType,
    });
    res.status(200).json({ data, message: "Items updated successfully" });
  } catch (e) {
    console.log(e, "e");
    res.status(500).json({ message: "An error occurred while creating", e });
  }
});
router.put("/pros-and-cons/:id", async (req, res) => {
  try {
    const data = await editProOrCon({
      id: Number(req.params.id),
      item: req.body.item,
      itemType: req.body.itemType,
    });
    res.status(200).json({ data, message: "Item updated" });
  } catch (e) {
    console.log(e, "e");

    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", e });
  }
});
router.delete("/pros-and-cons/:id", async (req, res) => {
  try {
    const data = await deleteProOrCon({
      id: Number(req.params.id),
      itemType: req.body.itemType,
    });
    res.status(200).json({ data, message: "Item deleted" });
  } catch (e) {
    console.log(e, "e");

    res
      .status(500)
      .json({ message: "An error occurred while fetching Spaces", e });
  }
});
export default router;
