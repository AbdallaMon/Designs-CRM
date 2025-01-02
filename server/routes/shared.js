import {Router} from "express";
import {getCurrentUser, getPagination, verifyTokenAndHandleAuthorization} from "../services/utility.js";
import {
    assignLeadToAUser,
    getClientLeadDetails,
    getClientLeads,
    getClientLeadsByDateRange,
    getDashboardLeadStatusData,
    getEmiratesAnalytics,
    getKeyMetrics, getLatestNewLeads,
    getMonthlyPerformanceData, getPerformanceMetrics, getRecentActivities,
    markClientLeadAsConverted
} from "../services/sharedServices.js";

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
router.get('/client-leads/deals', async (req, res) => {
    try {
        const searchParams = req.query;

        const clientLeads = await getClientLeadsByDateRange({ searchParams });
        res.status(200).json({data:clientLeads});
    } catch (error) {
        console.error('Error fetching client leads:', error);
        res.status(500).json({ message: 'An error occurred while fetching client leads' });
    }
});
router.get('/client-leads/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const clientLeadDetails = await getClientLeadDetails(Number(id));
        res.status(200).json({data:clientLeadDetails});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});

router.put('/client-leads', async (req, res) => {
    try {
        const clientLead=req.body
        const currentUser=await  getCurrentUser(req)
        console.log(currentUser,"currentUser")
        console.log(clientLead,"clienmt")
        const result = await assignLeadToAUser(Number(clientLead.id),Number(currentUser.id),clientLead.overdue);
        res.status(200).json({data:result,message:"Deal assigned to you successfully"});
    } catch (error) {
        console.error('Error assigning client leads:', error);
        res.status(500).json({ message: 'An error occurred while assigning client leads' });
    }
});
router.put('/client-leads/convert', async (req, res) => {
    try {
        const body=req.body
        const result = await markClientLeadAsConverted(Number(body.id),body.reasonToConvert,"ON_HOLD");
        res.status(200).json({data:result,message:"Deal are now in the converted list"});
    } catch (error) {
        console.error('Error assigning client leads:', error);
        res.status(500).json({ message: 'An error occurred while assigning client leads' });
    }
});


/* dashboard */
router.get('/dashboard/key-metrics', async (req, res) => {
    try {
        const searchParams = req.query;

        const data = await getKeyMetrics(searchParams);
        res.status(200).json({data});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});

router.get('/dashboard/leads-status', async (req, res) => {
    try {
        const searchParams = req.query;

        const data = await getDashboardLeadStatusData(searchParams);
        res.status(200).json({data});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});

router.get('/dashboard/monthly-performance', async (req, res) => {
    try {
        const searchParams = req.query;

        const data = await getMonthlyPerformanceData(searchParams);
        res.status(200).json({data});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});
router.get('/dashboard/emirates-analytics', async (req, res) => {
    try {
        const searchParams = req.query;

        const data = await getEmiratesAnalytics(searchParams);
        res.status(200).json({data});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});
router.get('/dashboard/week-performance', async (req, res) => {
    try {
        const searchParams = req.query;

        const data = await getPerformanceMetrics(searchParams);
        res.status(200).json({data});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});
router.get('/dashboard/latest-leads', async (req, res) => {
    try {

        const data = await getLatestNewLeads();
        res.status(200).json({data});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});

router.get('/dashboard/recent-activities', async (req, res) => {
    try {

        const data = await getRecentActivities();
        res.status(200).json({data});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});

export default router;
