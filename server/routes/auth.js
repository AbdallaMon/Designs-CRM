import {Router} from 'express';
import {
    createClientWithLead,
    loginUser,
    logoutUser,
    requestPasswordReset,
    resetPassword
} from '../services/authServices.js';
import {handlePrismaError, verifyToken} from "../services/utility.js";

const router = Router();

// Login Route
router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    try {
        const {user, token} = await loginUser(email, password);
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            path: '/',
        });

        res.status(200).json({
            status: 200,
            message: "تم تسجيل الدخول بنجاح جاري اعادة التوجيه",
            user
        });
    } catch (error) {
        res.status(500).json({status: 500, message: `خطأ: ${error.message}`});
    }
});
router.post('/register', async (req, res) => {
    try {
        const user = await createClientWithLead(req.body);

        res.status(200).json({
            status: 200,
            message: "تم تسجيل الحساب بنجاح، يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك",
            user,
        });
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            res.status(400).json({status: 400, message: "هذا البريد الإلكتروني مسجل بالفعل"});
        } else {
            handlePrismaError(res, error);
        }
    }
});
// Logout Route
router.post('/logout', (req, res) => {
    try {
        const {token, options} = logoutUser();
        res.cookie('token', token, options);
        res.status(200).json({status: 200, message: "تم تسجيل الخروج بنجاح"});
    } catch (error) {
        res.status(500).json({status: 500, message: `خطأ: ${error.message}`});
    }
});

// Check Login Status Route
router.get('/status', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({auth: false, message: "أنت لست مسجلاً للدخول"});
    }
    try {
        const decoded = verifyToken(token);
        res.status(200).json({
            message: "المستخدم مصدق عليه",
            user: {
                id: decoded.id,
                role: decoded.role,
                accountStatus: decoded.accountStatus
            },
            auth: true,
        });
    } catch (error) {
        res.status(400).json({
            message: "انتهت صلاحية جلستك",
            error: error.message,
            auth: false,
        });
    }
});

router.post('/reset', async (req, res) => {
    const {email} = req.body;
    try {
        const message = await requestPasswordReset(email);
        res.status(200).json({status: 200, message});
    } catch (error) {
        res.status(500).json({status: 500, message: `خطأ: ${error.message}`});
    }
});

// Reset password route
router.post('/reset/:token', async (req, res) => {
    const {token} = req.params;
    const {password} = req.body;
    try {
        const message = await resetPassword(token, password);
        res.status(200).json({status: 200, message});
    } catch (error) {
        res.status(500).json({status: 500, message: `خطأ: ${error.message}`});
    }
});

export default router;
