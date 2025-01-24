import {Router} from "express";
import {
    getCurrentUser,
    getNotifications,
    getPagination,
    verifyTokenAndHandleAuthorization
} from "../services/utility.js";
import {
    assignLeadToAUser, getAllFixedData,
    getClientLeadDetails,
    getClientLeads,
    getClientLeadsByDateRange,
    getDashboardLeadStatusData,
    getEmiratesAnalytics,
    getKeyMetrics, getLatestNewLeads,
    getMonthlyPerformanceData, getNextCalls, getPerformanceMetrics, getRecentActivities,
    markClientLeadAsConverted, updateClientLeadStatus
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

router.get('/client-leads/calls', async (req, res) => {
    try {
        const searchParams= req.query;
        const {limit, skip} = getPagination(req);
        const result = await getNextCalls({
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
        const searchParams=req.query
        const data = await getRecentActivities(searchParams);
        res.status(200).json({data});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});
router.get('/notifications', async (req, res) => {
    const searchParams = req.query;
    const {limit = 9, skip = 1} = getPagination(req);
    try {
        const {notifications, total} = await getNotifications(searchParams, limit, skip, false);
        const totalPages = Math.ceil(total / limit);

        if (!notifications) {
            return res.status(404).json({message: 'No new notifications'});
        }
        res.status(200).json({data: notifications, totalPages, total});
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({message: 'Error getting notification'});
    }
});
router.put('/client-leads/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { updatePrice } = req.body;

        await updateClientLeadStatus({
            clientLeadId: Number(id),
            ...req.body
        });

        res.status(200).json({message:updatePrice?"Price updated successfully":"Status changed successfully"})
    } catch (error) {
        console.error('Error updating client lead status:', error);
        res.status(500).json({ message: error.message });
    }
});
router.get('/fixed-data', async (req, res) => {
    try {
        const result = await getAllFixedData()
        res.status(200).json({data:result});
    } catch (error) {
        console.error('Error fetching client leads:', error);
        res.status(500).json({ message: 'An error occurred while fetching client leads' });
    }
});
export default router;
