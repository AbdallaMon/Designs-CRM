import express from "express";
const router = express.Router();

// router.get("/telegram", async (req, res) => {
//   try {
//     const data = await getLeadsWithOutChannel();
//     res.status(200).json({ data });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// router.get("/generate-leads-code", async (req, res) => {
//   try {
//     const result = await backfillLeadCodes({
//       rewriteAll: Boolean(true),
//     });
//     res.status(200).json({ data: result });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

export default router;
