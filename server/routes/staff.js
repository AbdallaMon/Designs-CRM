import {Router} from "express";
import {verifyTokenAndHandleAuthorization} from "../services/utility.js";
import {
    createCallReminder, createFile,
    createNote, createPriceOffer, getCallReminders,
    updateCallReminderStatus,
    updateClientLeadStatus
} from "../services/staffServices.js";
import { Readable } from 'stream';
import FormData from 'form-data';

import axios from "axios";
import multer from "multer";

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
        const callReminder = await createPriceOffer({clientLeadId:Number(id),...req.body})
        res.status(200).json({data:callReminder,message:"Price offer added successfully"});
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
        const { status,price,updatePrice } = req.body;
        await updateClientLeadStatus({
            clientLeadId: Number(id),
            status,
            price
        });

        res.status(200).json({message:updatePrice?"Price updated successfully":"Status changed successfully"})
    } catch (error) {
        console.error('Error updating client lead status:', error);
        res.status(500).json({ message: 'Failed to update client lead status.' });
    }
});
router.post('/client-leads/:id/files', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(req.body,"req.body")
        await createFile({
            clientLeadId: Number(id),
            ...req.body
        });
        res.status(200).json({message:"File Saved successfully"})
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