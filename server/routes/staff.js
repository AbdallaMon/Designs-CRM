import {Router} from "express";
import {verifyTokenAndHandleAuthorization} from "../services/utility.js";
import {
    createCallReminder,
    createNote,
    updateCallReminderStatus,
    updateClientLeadStatus
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
router.put('/client-leads/call-reminders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const callReminder = await updateCallReminderStatus({reminderId:Number(id),...req.body})
        res.status(200).json({data:callReminder,message:"Call reminder created successfully"});
    } catch (error) {
        res.status(500).json({
            message: error.message || 'An error occurred while updating call reminder.',
        });
    }
});
router.put('/client-leads/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await updateClientLeadStatus({
            clientLeadId: Number(id),
            status,
        });

        res.status(200).json({message:"Status changed successfully"})
    } catch (error) {
        console.error('Error updating client lead status:', error);
        res.status(500).json({ message: 'Failed to update client lead status.' });
    }
});
export default router