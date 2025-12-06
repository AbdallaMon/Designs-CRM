import { Router } from "express";
import {
  createContractLevelClause,
  createContractSpecialClause,
  createContractStageClause,
  deleteContractSpecialClause,
  deleteContractStageClause,
  getContractLevelClauses,
  getContractSpecialClauses,
  getContractStageClauses,
  getContractUtilityData,
  updateContractLevelClause,
  updateContractSpecialClause,
  updateContractStageClause,
  updateContractUtilityData,
} from "../../services/main/site-utilities/siteUtilityServices.js";
import { getAndThrowError } from "../../services/main/utility/utility.js";

// 1. API: GET "/obligations"
//    - Purpose: Fetch the obligations of both parties in Arabic and English.
//    - Expected Payload: None
//    - POST/PUT: "/obligations"
//      - Purpose: Save or update the obligations of both parties.
//      - Expected Payload:
//        {
//          obligationsPartyOneAr: string,
//          obligationsPartyOneEn: string,
//          obligationsPartyTwoAr: string,
//          obligationsPartyTwoEn: string
//        }
// 2. API: GET "/stage-clauses"
//    - Purpose: Fetch the list of stage clauses.
//    - Expected Payload: None
//    - POST: "/stage-clauses"
//      - Purpose: Add a new stage clause.
//      - Expected Payload:
//        {
//          headingAr: string,
//          headingEn: string,
//          titleAr: string,
//          titleEn: string,
//          descriptionAr: string,
//          descriptionEn: string,
//          order: number
//        }
//    - PUT: "/stage-clauses/{clauseId}"
//      - Purpose: Update an existing stage clause.
//      - Expected Payload:
//        {
//          headingAr: string,
//          headingEn: string,
//          titleAr: string,
//          titleEn: string,
//          descriptionAr: string,
//          descriptionEn: string,
//          order: number
//        }
//    - DELETE: "/stage-clauses/{clauseId}"
//      - Purpose: Delete a specific stage clause.
//      - Expected Payload: None
// 3. API: GET "/special-clauses"
//    - Purpose: Fetch the list of special clauses.
//    - Expected Payload: None
//    - POST: "/special-clauses"
//      - Purpose: Add a new special clause.
//      - Expected Payload:
//        {
//          textAr: string,
//          textEn: string,
//          order: number,
//          isActive: boolean
//        }
//    - PUT: "/special-clauses/{clauseId}"
//      - Purpose: Update an existing special clause.
//      - Expected Payload:
//        {
//          textAr: string,
//          textEn: string,
//          order: number,
//          isActive: boolean
//        }
//    - DELETE: "/special-clauses/{clauseId}"
//      - Purpose: Delete a specific special clause.
//      - Expected Payload: None
// 4. API: GET "/level-clauses"
//    - Purpose: Fetch the list of level clauses categorized by contract levels.
//    - Expected Payload: None
//    - POST: "/level-clauses"
//      - Purpose: Add a new level clause.
//      - Expected Payload:
//        {
//          level: string (e.g., "LEVEL_1"),
//          textAr: string,
//          textEn: string,
//          order: number,
//          isActive: boolean
//        }
//    - PUT: "/level-clauses/{clauseId}"
//      - Purpose: Update an existing level clause.
//      - Expected Payload:
//        {
//          level: string (e.g., "LEVEL_1"),
//          textAr: string,
//          textEn: string,
//          order: number,
//          isActive: boolean
//        }

const router = Router();
router.get("/details", async (req, res) => {
  try {
    const data = await getContractUtilityData();
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/obligations", async (req, res) => {
  try {
    const data = await getContractUtilityData();
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/obligations", async (req, res) => {
  try {
    const data = await updateContractUtilityData({ data: req.body });
    res
      .status(200)
      .json({ data, message: "Contract utility updated successfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/obligations", async (req, res) => {
  try {
    const data = await updateContractUtilityData({ data: req.body });
    res
      .status(200)
      .json({ data, message: "Contract utility updated successfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/stage-clauses", async (req, res) => {
  try {
    const data = await getContractStageClauses();
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/stage-clauses", async (req, res) => {
  try {
    const data = await createContractStageClause({ data: req.body });
    res
      .status(200)
      .json({ data, message: "Stage clause created successfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/stage-clauses/:clauseId", async (req, res) => {
  try {
    const data = await updateContractStageClause({
      id: req.params.clauseId,
      data: req.body,
    });
    res
      .status(200)
      .json({ data, message: "Stage clause updated successfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.delete("/stage-clauses/:clauseId", async (req, res) => {
  try {
    await deleteContractStageClause({ id: req.params.clauseId });
    res.status(200).json({ message: "Stage clause deleted successfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/special-clauses", async (req, res) => {
  try {
    const data = await getContractSpecialClauses();
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.post("/special-clauses", async (req, res) => {
  try {
    const data = await createContractSpecialClause({ data: req.body });
    res
      .status(200)
      .json({ data, message: "Special clause created successfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/special-clauses/:clauseId", async (req, res) => {
  try {
    const data = await updateContractSpecialClause({
      id: req.params.clauseId,
      data: req.body,
    });
    res
      .status(200)
      .json({ data, message: "Special clause updated successfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.delete("/special-clauses/:clauseId", async (req, res) => {
  try {
    await deleteContractSpecialClause({ id: req.params.clauseId });
    res.status(200).json({ message: "Special clause deleted successfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.get("/level-clauses", async (req, res) => {
  try {
    const data = await getContractLevelClauses();
    res.status(200).json({ data });
  } catch (e) {
    getAndThrowError(e, res);
  }
});
router.put("/level-clauses/:clauseId", async (req, res) => {
  try {
    const data = await updateContractLevelClause({
      id: req.params.clauseId,
      data: req.body,
    });
    res
      .status(200)
      .json({ data, message: "Level clause updated successfully" });
  } catch (e) {
    getAndThrowError(e, res);
  }
});

export default router;
