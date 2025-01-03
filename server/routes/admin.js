import {Router} from "express";
import {getPagination, verifyTokenAndHandleAuthorization} from "../services/utility.js";
import {getClientLeads} from "../services/sharedServices.js";
import {getLogs} from "../services/adminServices.js";

const router = Router();

router.use((req, res, next) => {
    verifyTokenAndHandleAuthorization(req, res, next, "ADMIN");
});
router.get('/logs', async (req, res) => {
    try {
        const searchParams= req.query;
        const {limit, skip} = getPagination(req);
        const result = await getLogs({
            limit: Number(limit),
            skip: Number(skip),
            searchParams
        });
        res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'An error occurred while fetching logs ' });
    }
});
export default router;
