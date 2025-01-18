import {Router} from "express";
import {getCurrentUser, verifyTokenAndHandleAuthorization} from "../services/utility.js";
import {
    createCallReminder, createFile,
    createNote, createPriceOffer, getCallReminders,
    updateCallReminderStatus,
} from "../services/staffServices.js";

const router = Router();

router.use((req, res, next) => {
    verifyTokenAndHandleAuthorization(req, res, next, "STAFF");
});

router.post('/client-leads/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const note = await createNote({ clientLeadId:Number(id), ...req.body });
        res.status(200).json({data:note,message:"Note added successfully"});
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Failed to create note.' });
    }
});
router.post('/client-leads/:id/call-reminders', async (req, res) => {
    try {
        const { id } = req.params;
        const callReminder = await createCallReminder({clientLeadId:Number(id),...req.body})
        res.status(200).json({data:callReminder,message:"Call reminder created successfully"});
    } catch (error) {
        console.error('Error createCallReminder:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while creating call reminder.',
        });
    }
});
router.post('/client-leads/:id/price-offers', async (req, res) => {
    try {
        const { id } = req.params;
        const priceOffers = await createPriceOffer({clientLeadId:Number(id),...req.body})
        res.status(200).json({data:priceOffers,message:"Price offer added successfully"});
    } catch (error) {
        console.error('Error Creating new price offer:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while creating call reminder.',
        });
    }
});
router.put('/client-leads/call-reminders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user=await getCurrentUser(req)

        const callReminder = await updateCallReminderStatus({reminderId:Number(id),currentUser:user,...req.body})
        res.status(200).json({data:callReminder,message:"Call reminder created successfully"});
    } catch (error) {
        res.status(500).json({
            message: error.message || 'An error occurred while updating call reminder.',
        });
    }
});

router.post('/client-leads/:id/files', async (req, res) => {
    try {
        const { id } = req.params;
const file=        await createFile({
            clientLeadId: Number(id),
            ...req.body
        });
        res.status(200).json({data:file,message:"File Saved successfully"})
    } catch (error) {
        console.error('Error updating client lead status:', error);
        res.status(500).json({ message: 'Failed to save the file.' });
    }
});
router.get('/dashboard/latest-calls', async (req, res) => {
    try {
        const searchParams = req.query;

        const data = await getCallReminders(searchParams);
        res.status(200).json({data});
    } catch (error) {
        console.error('Error fetching client lead details:', error);
        res.status(500).json({
            message: error.message || 'An error occurred while fetching client lead details.',
        });
    }
});



export default router