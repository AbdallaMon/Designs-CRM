import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.SECRET_KEY;

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
