import prisma from '../prisma/prisma.js';
import express from 'express';
import {
    searchData, uploadFiles,

    verifyTokenUsingReq,
} from '../services/utility.js';

const router = express.Router();

// Search Route
router.get('/search', verifyTokenUsingReq, async (req, res) => {
    const searchBody = req.query;
    try {
        const data = await searchData(searchBody);
        res.status(200).json({data});
    } catch (error) {
        console.error(`Error fetching data:`, error);
        res.status(500).json({message: `حدثت مشكلة اثناء جلب البيانات: ${error.message}`});
    }
});
router.post('/upload', verifyTokenUsingReq, async (req, res) => {
 await uploadFiles(req, res);
});
export default router