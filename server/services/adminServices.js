import bcrypt from "bcrypt";
import prisma from "../prisma/prisma.js";
import dayjs from "dayjs";

export async function createStaffUser(user) {
    const hashedPassword = bcrypt.hashSync(user.password, 8);
    const newUser = await prisma.user.create({
        data: {
            email: user.email,
            password: hashedPassword,
            role:"STAFF",
            name:user.name,
            emailConfirmed: true,
        },
        select: {
            email: true,
            isActive: true,

            name:true
        },
    });

    return newUser;
}

export async function editStaffUser(user, userId) {
    let hashedPassword = undefined
    if (user.password) {
        hashedPassword = bcrypt.hashSync(user.password, 8);
    }
    return await prisma.user.update({
        where: {id: Number(userId)},
        data: {
            email: user.email && user.email,
            password: hashedPassword && hashedPassword,
            name:user.name
        },
        select: {
            id: true,
            email: true,
            isActive: true,
            role: true,
            name:true
        },
    });
}

export async function changeUserStatus(user, studentId) {
    return prisma.user.update({
        where: {
            id: Number(studentId)
        },
        data: {
            isActive: !user.isActive
        }
        , select: {
            id: true
        }
    })
}

export async function getLogs({
                                         limit = 1,
                                         skip = 10,
                                         searchParams
                                     }) {
    let where = {};

    const filters = JSON.parse(searchParams.filters);

    if (filters?.userId) {
        where.userId =Number(filters.userId);
    }
    if (filters?.range) {
        const { startDate, endDate } = filters.range;

        const now = dayjs();
        let start = startDate ? dayjs(startDate) : now.subtract(30, 'days'); // Default to last 30 days
        let end = endDate ? dayjs(endDate).endOf('day') : now;
        where.createdAt = {
            gte: start.toDate(),
            lte: end.toDate(),
        };
    } else {
        where.createdAt = {
            gte: dayjs().subtract(30, 'days').toDate(),
            lte: dayjs().toDate(),
        };
    }
    const [logs, total] = await Promise.all([
        prisma.log.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include:{
                user:{
                    select:{
                        name:true,id:true
                    }
                }
            }
        }),
        prisma.log.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
console.log(totalPages,"totalPages")
    console.log(total,"total")
    return { data:logs, total, totalPages };
}
