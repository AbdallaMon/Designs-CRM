import jwt from "jsonwebtoken";
import multer from "multer";
import { fileURLToPath } from "url";
import { Client } from "basic-ftp";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import * as fs from "node:fs";
import * as path from "node:path";
import { getIo } from "../socket.js";
import { sendEmail } from "../sendMail.js";
import dayjs from "dayjs";
import prisma from "../../prisma/prisma.js";
import axios from "axios";
import FormData from "form-data";
const SECRET_KEY = process.env.SECRET_KEY;

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
  if (error.name === "PrismaClientValidationError") {
    return res.status(400).json({
      message:
        "هناك خطأ في البيانات المرسلة. يرجى التحقق من البيانات وإعادة المحاولة.",
    });
  }

  let response;
  switch (error.code) {
    case "P2002":
      if (
        error.meta &&
        error.meta.target &&
        error.meta.target.includes("email")
      ) {
        response = { status: 409, message: "البريد الإلكتروني مسجل بالفعل" };
      } else {
        response = {
          status: 409,
          message: `فشل القيد الفريد في الحقل: ${error.meta.target}`,
        };
      }
      break;

    case "P2003":
      response = {
        status: 400,
        message: `فشل القيد المرجعي في الحقل: ${error.meta.field_name}`,
      };
      break;

    case "P2004":
      response = {
        status: 400,
        message: `فشل قيد على قاعدة البيانات: ${error.meta.constraint}`,
      };
      break;

    case "P2025":
      response = {
        status: 404,
        message: `لم يتم العثور على السجل: ${error.meta.cause}`,
      };
      break;

    case "P2016":
      response = {
        status: 400,
        message: `خطأ في تفسير الاستعلام: ${error.meta.details}`,
      };
      break;

    case "P2000":
      response = {
        status: 400,
        message: `القيمة خارج النطاق للعمود: ${error.meta.column}`,
      };
      break;

    case "P2017":
      response = {
        status: 400,
        message: `انتهاك العلاقة: ${error.meta.relation_name}`,
      };
      break;

    case "P2014":
      response = {
        status: 400,
        message: `التغيير الذي تحاول إجراؤه سينتهك العلاقة المطلوبة: ${error.meta.relation_name}`,
      };
      break;

    case "P2026":
      response = {
        status: 500,
        message: `خطأ في مهلة قاعدة البيانات: ${error.meta.details}`,
      };
      break;

    default:
      response = {
        status: 500,
        message: `حدث خطأ غير متوقع: ${error.message}`,
      };
  }

  // Send response to the client
  return res.status(response.status).json({ message: response.message });
}

export const getPagination = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const verifyTokenAndHandleAuthorization = async (
  req,
  res,
  next,
  role
) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "You have to login first" });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await prisma.user.findUnique({
      where: {
        id: Number(decoded.id),
      },
      select: {
        role: true,
        subRoles: {
          select: {
            subRole: true,
          },
        },
      },
    });

    const isAdmin =
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      user.subRoles.some(
        (r) => r.subRole === "ADMIN" || r.subRole === "SUPER_ADMIN"
      );

    if (role === "ADMIN" && isAdmin) {
      req.user = decoded;
      return next();
    }
    if (role === "SHARED") {
      if (
        decoded.role !== "ADMIN" &&
        decoded.role !== "STAFF" &&
        decoded.role !== "THREE_D_DESIGNER" &&
        decoded.role !== "TWO_D_DESIGNER" &&
        decoded.role !== "ACCOUNTANT" &&
        decoded.role !== "SUPER_ADMIN" &&
        decoded.role !== "TWO_D_EXECUTOR"
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }
    } else {
      if (role === "ADMIN" && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      } else if (role === "STAFF") {
        if (
          decoded.role !== "STAFF" &&
          decoded.role !== "THREE_D_DESIGNER" &&
          decoded.role !== "TWO_D_DESIGNER" &&
          decoded.role !== "ACCOUNTANT" &&
          decoded.role !== "TWO_D_EXECUTOR"
        ) {
          return res.status(403).json({ message: "Not authorized" });
        }
      } else if (decoded.role !== role) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Your are not allowed or session ended" });
  }
};

export const verifyTokenUsingReq = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(403).json({ message: "تم رفض صلاحيتك" });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
const modelMap = {
  user: prisma.user,
  client: prisma.client,
  clientLead: prisma.clientLead,
};

export async function getCurrentUser(req) {
  const token = req.cookies.token;

  const decoded = jwt.verify(token, SECRET_KEY);
  return decoded;
}

export async function searchData(body) {
  const { model, query, filters } = body;
  const prismaModel = modelMap[model] || modelMap["user"];
  let where = {};
  if (query) {
    if (model === "user") {
      where.OR = [
        { email: { contains: query } },
        { name: { contains: query } },
      ];
      where.role = "STAFF";
    } else if (model === "all-users") {
    } else if (model === "client") {
      where.OR = [
        { email: { contains: query } },
        { name: { contains: query } },
        { phone: { contains: query } },
      ];
    } else if (model === "clientLead") {
      where.OR = [
        {
          client: {
            OR: [
              { email: { contains: query } },
              { name: { contains: query } },
              { phone: { contains: query } },
            ],
          },
        },
      ];
      if (!isNaN(query)) {
        where.OR.push({ id: { equals: Number(query) } });
      }
    } else {
      where.OR = [
        { email: { contains: query } },
        { name: { contains: query } },
      ];
      where.role = model.toUpperCase();
    }
  }
  if (filters && filters !== "undefined") {
    const parsedFilters = JSON.parse(filters);
    if (parsedFilters.role) {
      where.role = parsedFilters.role;
    }
    if (parsedFilters.OR) {
      where.OR = parsedFilters.OR;
    }
    if (parsedFilters.userId) {
      where.clientLeads = {
        some: {
          userId: Number(parsedFilters.userId),
        },
      };
    }
    if (
      parsedFilters.userRole === "STAFF" &&
      parsedFilters.staffId &&
      model === "clientLead"
    ) {
      where.userId = Number(parsedFilters.staffId);
    }
    if (
      (parsedFilters.userRole === "THREE_D_DESIGNER" ||
        parsedFilters.userRole === "TWO_D_DESIGNER") &&
      parsedFilters.staffId &&
      model === "clientLead"
    ) {
      where.projects = {
        some: {
          role: parsedFilters.userRole,
          assignments: {
            some: {
              userId: Number(parsedFilters.staffId),
            },
          },
        },
      };
    }
  }
  if (where && where.role?.startsWith("3D")) {
    where.role = "THREE_D_DESIGNER";
  } else if (where && where.role?.startsWith("2D")) {
    where.role = "TWO_D_DESIGNER";
  }
  if (where.role) {
    const role = where.role;
    delete where.role;

    const roleOrSubRole = [
      { role: role },
      { subRoles: { some: { subRole: role } } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: roleOrSubRole }];
      delete where.OR;
    } else {
      where.OR = roleOrSubRole;
    }
  }
  const selectFields = {
    user: {
      id: true,
      email: true,
      name: true,
    },
    client: {
      id: true,
      name: true,
      email: where.userId ? false : true,
      phone: where.userId ? false : true,
    },
    clientLead: {
      id: true,
      client: {
        select: {
          name: true,
          email: where.userId ? false : true,
          phone: where.userId ? false : true,
        },
      },
    },
  };
  const data = await prismaModel.findMany({
    where,
    select: selectFields[model] || selectFields["user"],
  });
  return data;
}

// FTP Configuration
const ftpConfig = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  secure: false, // Set to true if using FTPS
};

const tmpFolder = path.resolve(__dirname, "tmp");
if (!fs.existsSync(tmpFolder)) {
  fs.mkdirSync(tmpFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpFolder); // Save files to the tmp directory
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).any();

// FTP Upload Function
async function uploadToFTP(localFilePath, remotePath) {
  const client = new Client();
  try {
    await client.access(ftpConfig);
    await client.uploadFrom(localFilePath, remotePath);
  } catch (err) {
    console.error(`Failed to upload ${localFilePath}:`, err.message);
  } finally {
    client.close();
  }
}

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Error deleting file: ${filePath}`, err.message);
  }
}

// Upload API
export const uploadFiles = async (req, res) => {
  try {
    const fileUrls = {}; // Object to store URLs of uploaded files
    await new Promise((resolve, reject) => {
      upload(req, res, async (err) => {
        if (err) {
          reject(err); // Reject on upload error
        } else if (!req.files || req.files.length === 0) {
          reject(new Error("No files uploaded."));
        } else {
          try {
            for (const file of req.files) {
              const uniqueFilename = `${uuidv4()}${path.extname(
                file.originalname
              )}`;
              const remotePath = `public_html/uploads/${uniqueFilename}`;

              // Upload file buffer to FTP server
              await uploadToFTP(file.path, remotePath);

              const fileUrl = `http://panel.dreamstudiio.com/uploads/${uniqueFilename}`;
              const fieldName = file.fieldname;

              // Group file URLs by field name
              if (!fileUrls[fieldName]) fileUrls[fieldName] = [];
              fileUrls[fieldName].push(fileUrl);
              deleteFile(file.path);
            }
            resolve(); // Resolve the promise once all files are uploaded
          } catch (uploadErr) {
            reject(uploadErr);
          }
        }
      });
    });

    // Respond with the URLs of uploaded files
    res.status(200).json({ message: "Files uploaded successfully.", fileUrls });
  } catch (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size exceeds the 50MB limit." });
    }
    console.error("Error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

export async function uploadAsHttp(req, res) {
  try {
    const filename = req.file.originalname;
    const fileBuffer = req.file.buffer;

    const uploadDir = "/home/panel.dreamstudiio.com/public_html/uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const savePath = path.join(uploadDir, filename);

    fs.writeFileSync(savePath, fileBuffer);

    res.status(200).json({ message: "✅ Upload successful." });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
export async function uploadToFTPHttpAsBuffer(
  source,
  remoteFilename,
  isBuffer = false
) {
  try {
    let buffer;

    if (isBuffer) {
      if (Buffer.isBuffer(source)) {
        buffer = source;
      } else if (source instanceof Uint8Array) {
        buffer = Buffer.from(source.buffer);
      } else {
        throw new Error("Invalid buffer source type.");
      }
    } else {
      throw new Error("HTTP upload expects a buffer.");
    }

    const form = new FormData();
    form.append("file", buffer, remoteFilename);

    console.log("PDF size in KB:", (buffer.length / 1024).toFixed(2));

    await axios.post(`${process.env.SERVER}/client/api/upload`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 10 * 60 * 1000, // 10 minutes
    });

    console.log(`✅ Uploaded via HTTP: ${remoteFilename}`);
  } catch (err) {
    console.error(`❌ Failed to upload ${remoteFilename}:`, err.message);
    throw err;
  }
}

export async function uploadToFTPAsBuffer(
  source,
  remotePath,
  isBuffer = false
) {
  const client = new Client();
  try {
    await client.access({
      ...ftpConfig,
      timeout: 120 * 1000, // 2 minutes for initial control connection
    });

    client.ftp.verbose = true; // Optional: helps with debugging
    client.trackProgress((info) => {
      console.log(`Transferred ${info.bytes} bytes`);
    });

    let dataToUpload = source;
    if (isBuffer) {
      if (Buffer.isBuffer(source)) {
        dataToUpload = source;
      } else if (source instanceof Uint8Array) {
        dataToUpload = Buffer.from(source.buffer);
      } else {
        throw new Error("Invalid buffer source type.");
      }
    }

    console.log("PDF size in KB:", (dataToUpload.length / 1024).toFixed(2));

    const bufferStream = Readable.from(dataToUpload); // ✅ Stream-safe
    client.ftp.socket.setTimeout(10 * 60 * 1000);
    await client.uploadFrom(bufferStream, remotePath);

    console.log(`✅ Uploaded to FTP: ${remotePath}`);
  } catch (err) {
    client.trackProgress((info) => {
      console.log(`Transferred ${info.bytes} bytes in error`);
    });
    console.error(`❌ Failed to upload ${remotePath}:`, err.message);
    throw err;
  } finally {
    client.close();
  }
}

export async function getNotifications(
  searchParams,
  limit,
  skip,
  unread = true
) {
  const where = {};
  const filters = searchParams.filters && JSON.parse(searchParams.filters);
  if (filters?.staffId) {
    where.staffId = Number(filters.staffId);
  }
  if (searchParams.staffId) {
    where.staffId = Number(searchParams.staffId);
  }
  if (filters?.range) {
    const { startDate, endDate } = filters.range;
    const now = dayjs();
    let start = startDate ? dayjs(startDate) : now.subtract(30, "days"); // Default to last 30 days
    let end = endDate ? dayjs(endDate).endOf("day") : now;
    where.createdAt = {
      gte: start.toDate(),
      lte: end.toDate(),
    };
  } else {
    where.createdAt = {
      gte: dayjs().subtract(30, "days").toDate(),
      lte: dayjs().toDate(),
    };
  }

  where.userId = Number(searchParams.userId);

  const notifications = await prisma.notification.findMany({
    where: where,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      staff: {
        select: {
          name: true,
        },
      },
      clientLead: {
        select: {
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
  const total = await prisma.notification.count({ where: where });
  return { notifications, total };
}

export async function markLatestNotificationsAsRead(userId) {
  const where = { isRead: false, userId: Number(userId) };
  const notifications = await prisma.notification.updateMany({
    where,
    data: { isRead: true },
  });
  return notifications;
}

export async function createNotification(
  userId,
  isAdmin,
  content,
  href,
  type,
  emailSubject,
  withEmail,
  contentType = "TEXT",
  clientLeadId,
  staffId,
  role = ["STAFF"],
  specifiRole
) {
  let subAdmins = [];
  const forAll = !userId && !isAdmin && !staffId;
  if (specifiRole) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { role: { in: role } }, // Search in the main role
          { subRoles: { some: { subRole: { in: role } } } }, // Search in subRoles
        ],
      },
      select: {
        id: true,
      },
    });
    users?.map(async (user) => {
      await sendNotification(
        user.id,
        content,
        href,
        type,
        emailSubject,
        withEmail,
        contentType,
        clientLeadId
      );
    });
  } else if (forAll) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
      },
      select: {
        id: true,
      },
    });
    users?.map(async (user) => {
      await sendNotification(
        user.id,
        content,
        href,
        type,
        emailSubject,
        withEmail,
        contentType,
        clientLeadId
      );
    });
  } else {
    if (isAdmin) {
      const admin = await prisma.user.findFirst({
        where: {
          role: "ADMIN",
        },
        select: {
          id: true,
        },
      });
      subAdmins = await prisma.user.findMany({
        where: {
          role: "SUPER_ADMIN",
        },
        select: {
          id: true,
        },
      });

      userId = admin.id;
    }

    await sendNotification(
      userId,
      content,
      href,
      type,
      emailSubject,
      withEmail,
      contentType,
      clientLeadId,
      staffId
    );
    if (subAdmins?.length > 0) {
      subAdmins.forEach(async (admin) => {
        await sendNotification(
          admin.id,
          content,
          href,
          type,
          emailSubject,
          withEmail,
          contentType,
          clientLeadId,
          staffId
        );
      });
    }
  }
}

async function sendNotification(
  userId,
  content,
  href,
  type,
  emailSubject,
  withEmail,
  contentType = "TEXT",
  clientLeadId,
  staffId
) {
  const link = href
    ? `<a href="${process.env.OLDORIGIN}${href}" style="color: #1a73e8; text-decoration: none;">See details from here</a>`
    : "";
  const emailContent = `
        <div style=" color: #333; direction: ltr; text-align: left;">
            <h2 style="color: #444; margin-bottom: 16px;">${emailSubject}</h2>
            <p style="font-size: 16px; line-height: 1.5;">${content}</p>
            ${link ? `<p>${link}</p>` : ""}
        </div>
    `;
  let notification = await prisma.notification.create({
    data: {
      userId: userId,
      content: content,
      type,
      link: href,
      contentType,
      clientLeadId: clientLeadId && Number(clientLeadId),
      staffId: staffId && Number(staffId),
    },
  });

  const io = getIo();
  io.to(userId.toString()).emit("notification", notification);
  if (withEmail) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { email: true },
    });
    if (user && user.email) {
      const email = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
    <div>
        ${emailContent}
    </div>
    <div style="margin-top: 10px;">
        <a href="${process.env.OLDORIGIN}/dashboard/notifications" style="color: #007bff; text-decoration: none;">
            Go to notifications?
        </a>
    </div>
</div>
`;

      setImmediate(() => {
        sendEmail(user.email, emailSubject, email).catch((error) => {
          console.error(`Failed to send email to user ${userId}:`, error);
        });
      });
    }
  }
}

export async function getUserDetailsWithSpecificFields(
  id,
  fields = { id: true, name: true, email: true }
) {
  return await prisma.user.findUnique({
    where: { id: Number(id) },
    select: fields,
  });
}

export async function updateLead(clientLeadId) {
  await prisma.clientLead.update({
    where: { id: Number(clientLeadId) },
    data: {},
  });
}

export const getTokenData = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "You have to login first" });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded; // Return token data
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export async function getAndThrowError(e, res) {
  console.log(e, "e");
  return res.status(500).json({ message: e.message });
}
