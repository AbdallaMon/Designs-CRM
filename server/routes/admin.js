import { Router } from "express";
import { getPagination, handlePrismaError, verifyTokenAndHandleAuthorization } from "../services/utility.js";
import { changeUserStatus, createStaffUser, editStaffUser, getUser } from "../services/adminServices.js";

const router = Router();

router.use((req, res, next) => {
    verifyTokenAndHandleAuthorization(req, res, next, "ADMIN");
});

router.get('/users', async (req, res) => {
    const searchParams = req.query;
    const { limit, skip } = getPagination(req);

    try {
        const { users, total } = await getUser(searchParams, limit, skip);
        const totalPages = Math.ceil(total / limit);

        if (!users) {
            return res.status(404).json({ message: 'No users found' });
        }
        res.status(200).json({ data: users, totalPages, total });
    } catch (error) {
        console.error('Error fetching supervisors:', error);
        res.status(500).json({ message: 'An error occurred while fetching supervisors' });
    }
});

router.post('/users', async (req, res) => {
    const user = req.body;
    try {
        if (!user) {
            return res.status(404).json({ message: 'No data was sent' });
        }
        const newUser = await createStaffUser(user);
        res.status(200).json({ data: newUser, message: "Account created successfully" });
    } catch (error) {
        console.error('Error fetching personal info:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            res.status(400).json({ status: 400, message: "This email is already registered" });
        } else {
            handlePrismaError(res, error);
        }
    }
});

router.put('/users/:userId', async (req, res) => {
    const user = req.body;
    const { userId } = req.params;

    try {
        if (!user || !userId) {
            return res.status(404).json({ message: 'No supervisor found with this ID' });
        }
        const updatedUser = await editStaffUser(user, userId);
        res.status(200).json({ data: updatedUser, message: "Account updated successfully" });
    } catch (error) {
        console.error('Error fetching personal info:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            res.status(400).json({ status: 400, message: "This email is already registered" });
        } else {
            handlePrismaError(res, error);
        }
    }
});

router.patch('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const { user } = req.body;

    try {
        if (!userId || !user) {
            return res.status(404).json({ message: 'No user found with this ID' });
        }
        const studentPersonalInfo = await changeUserStatus(user, userId);
        res.status(200).json({ data: studentPersonalInfo, message: "Operation completed successfully" });
    } catch (error) {
        console.error('Error fetching personal info:', error);
        res.status(500).json({ message: 'An error occurred while updating user data' });
    }
});


export default router;
