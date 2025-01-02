import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.SECRET_KEY;
import multer from 'multer';
import { fileURLToPath } from 'url';

import {v4 as uuidv4} from 'uuid';
import * as fs from "node:fs";
import * as path from "node:path";
 const __filename = fileURLToPath(import.meta.url);
 const __dirname = path.dirname(__filename);
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
    } catch (error) {
        throw new Error("Invalid token");
    }
}

export function handlePrismaError(res, error) {
    console.error("Prisma error: x ", error);
    if (error.name === 'PrismaClientValidationError') {
        return res.status(400).json({message: "هناك خطأ في البيانات المرسلة. يرجى التحقق من البيانات وإعادة المحاولة."});
    }

    let response;
    switch (error.code) {
        case 'P2002':
            if (error.meta && error.meta.target && error.meta.target.includes('email')) {
                response = {status: 409, message: "البريد الإلكتروني مسجل بالفعل"};
            } else {
                response = {status: 409, message: `فشل القيد الفريد في الحقل: ${error.meta.target}`};
            }
            break;

        case 'P2003':
            response = {status: 400, message: `فشل القيد المرجعي في الحقل: ${error.meta.field_name}`};
            break;

        case 'P2004':
            response = {status: 400, message: `فشل قيد على قاعدة البيانات: ${error.meta.constraint}`};
            break;

        case 'P2025':
            response = {status: 404, message: `لم يتم العثور على السجل: ${error.meta.cause}`};
            break;

        case 'P2016':
            response = {status: 400, message: `خطأ في تفسير الاستعلام: ${error.meta.details}`};
            break;

        case 'P2000':
            response = {status: 400, message: `القيمة خارج النطاق للعمود: ${error.meta.column}`};
            break;

        case 'P2017':
            response = {status: 400, message: `انتهاك العلاقة: ${error.meta.relation_name}`};
            break;

        case 'P2014':
            response = {
                status: 400,
                message: `التغيير الذي تحاول إجراؤه سينتهك العلاقة المطلوبة: ${error.meta.relation_name}`
            };
            break;

        case 'P2026':
            response = {status: 500, message: `خطأ في مهلة قاعدة البيانات: ${error.meta.details}`};
            break;

        default:
            response = {status: 500, message: `حدث خطأ غير متوقع: ${error.message}`};
    }

    // Send response to the client
    return res.status(response.status).json({message: response.message});
}
export const getPagination = (req) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    return {page, limit, skip};
};

export const verifyTokenAndHandleAuthorization = (req, res, next, role) => {

    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({message: 'You have to login first'});
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        if (role === "SHARED") {
            if (decoded.role !== "ADMIN" && decoded.role !== "STAFF") {
                return res.status(403).json({message: 'Not authorized'});
            }
        } else {
            if (decoded.role !== role) {
                return res.status(403).json({message: 'Not authorized'});
            }
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({message: 'Your session ended'});
    }
};

export const verifyTokenUsingReq = (req, res, next) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(403).json({message: 'تم رفض صلاحيتك'});
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({message: 'Invalid token'});
    }
};
const modelMap = {
    user: prisma.user,
    client: prisma.client,
};
export async function getCurrentUser(req){
    const token = req.cookies.token

    const decoded = jwt.verify(token, SECRET_KEY);
    return  decoded
}
export async function searchData(body) {
    const {model, query, filters} = body;
    const prismaModel = modelMap[model];
    console.log(body,"body")
    let where = {};
    if (query) {
        if (model === 'user') {
            where.OR = [
                {email: {contains: query}},
                {name: { contains: query}},
            ];
        } else if (model === 'client') {
            where.OR = [
                {phone: {contains: query}},
                {name: { contains: query}},
            ];
        }
    }

    if (filters && filters !== "undefined") {
        const parsedFilters = JSON.parse(filters);
        if (parsedFilters.role) {
            where.role = parsedFilters.role;
        }
        if (parsedFilters.OR) {
            where.OR = parsedFilters.OR
        }
        if (parsedFilters.userId) {
            where.clientLeads = {
                some: {
                    userId: Number(parsedFilters.userId)
                }
            }
        }
    }

console.log(where,'where')
    const selectFields = {
        user: {
            id: true,
            email: true,
            name:true,
        },
        client: {
            id: true,
            name: true,
            phone:true
        },
    };
    const data = await prismaModel.findMany({
        where,
        select: selectFields[model],
    });
    console.log(data,"data")
    return data;
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.resolve(__dirname, '../uploads/');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueSuffix);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png','image/webp', 'application/pdf'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'));
        }
    },
}).any();

export const uploadFiles = async (req, res) => {
    try {
        const fileUrls = {};
        await new Promise((resolve, reject) => {
            upload(req, res, (err) => {
                if (err) {
                    reject(err);
                } else if (!req.files || req.files.length === 0) {
                    reject(new Error('No files uploaded.'));
                } else {
                    req.files.forEach(file => {
                        const fieldName = file.fieldname;
                        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
                        if (!fileUrls[fieldName]) fileUrls[fieldName] = [];
                        fileUrls[fieldName].push(fileUrl);
                    });
                    resolve();
                }
            });
        });
        res.status(200).json({ message: 'Files uploaded successfully.', fileUrls });
    } catch (error) {
        console.log("are we error",error.message)
        res.status(400).json({ error: error.message });
    }
};
// next cloud uploads
/* upload files
const upload = multer({storage: multer.memoryStorage()}).any();

export const uploadFiles = async (req, res) => {
    return new Promise((resolve, reject) => {
        // Use the Multer upload middleware
        upload(req, res, async (err) => {
            if (err) {
                return reject(err);
            }

            if (!req.files || req.files.length === 0) {
                return reject(new Error('No files uploaded.'));
            }

            try {
                const results = {};
                const nextcloudUrlBase = process.env.NEXTCLOUD_URL;
                const nextcloudUsername = process.env.NEXTCLOUD_USERNAME;
                const nextcloudPassword = process.env.NEXTCLOUD_PASSWORD;
                for (const file of req.files) {
                    const uniqueName = uuidv4() + '-' + file.originalname;
                    const nextcloudUrl = `${nextcloudUrlBase}/${uniqueName}`;

                    // Upload the file to Nextcloud
                    const buffer = Buffer.from(file.buffer);
                    await axios.put(nextcloudUrl, buffer, {
                        auth: {
                            username: nextcloudUsername,
                            password: nextcloudPassword,
                        },
                        headers: {
                            'Content-Type': file.mimetype,
                        },
                    });

                    // Generate a public share link for the uploaded file
                    const shareUrl = `${nextcloudUrlBase.replace('/remote.php/webdav', '')}/ocs/v2.php/apps/files_sharing/api/v1/shares`;
                    const shareResponse = await axios.post(shareUrl, `path=/${uniqueName}&shareType=3&permissions=1`, {
                        auth: {
                            username: nextcloudUsername,
                            password: nextcloudPassword,
                        },
                        headers: {
                            'OCS-APIREQUEST': 'true',
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    });
                    const publicUrl = shareResponse.data.ocs.data.url + (file.mimetype === "application/pdf" ? `?type=pdf&name=${uniqueName}` : `/preview?name=${uniqueName}`);

                    results[file.fieldname] = publicUrl.startsWith('http://') ? publicUrl.replace('http://', 'https://') : publicUrl;
                }
                resolve(results);  // <-- Resolving with the results
            } catch (error) {
                reject(new Error("حدث خطاء اثناء رفع الملفات"));
            }
        });
    });
};

*/