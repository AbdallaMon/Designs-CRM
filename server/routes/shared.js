import {Router} from "express";
import {getCurrentUser, getPagination, verifyTokenAndHandleAuthorization} from "../services/utility.js";
import {assignLeadToAUser, getClientLeads} from "../services/sharedServices.js";

const router = Router();

router.use((req, res, next) => {
    verifyTokenAndHandleAuthorization(req, res, next, "SHARED");
});
router.get('/client-leads', async (req, res) => {
    try {
        const searchParams= req.query;
        const {limit, skip} = getPagination(req);
        const result = await getClientLeads({
            limit: Number(limit),
            skip: Number(skip),
            searchParams
        });
        res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching client leads:', error);
        res.status(500).json({ message: 'An error occurred while fetching client leads' });
    }
});
router.put('/client-leads', async (req, res) => {
    try {
        const clientLead=req.body
        const currentUser=await  getCurrentUser(req)

        const result = await assignLeadToAUser(Number(clientLead.id),Number(currentUser.id));
        res.status(200).json({data:result,message:"Deal assigned to you successfully"});
    } catch (error) {
        console.error('Error assigning client leads:', error);
        res.status(500).json({ message: 'An error occurred while assigning client leads' });
    }
});
export default router;
