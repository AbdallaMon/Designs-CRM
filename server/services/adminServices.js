import bcrypt from "bcrypt";
import prisma from "../prisma/prisma.js";
import dayjs from "dayjs";
export async function getUser(searchParams, limit, skip) {
    const filters =searchParams.filters && JSON.parse(searchParams.filters);
    const staffFilter = searchParams.staffId ? {userId: Number(searchParams.staffId)} : {};
    let where = {
        role:"STAFF",
        ...staffFilter,
    };
    if (filters.status !== undefined) {
        if (filters.status === "active") {
            where.isActive = true;
        } else if (filters.status === "banned") {
            where.isActive = false
        }
    }
    const users = await prisma.user.findMany({
        where: where,
        skip,
        take: limit,
        select: {
            id: true,
            name:true,
            email: true,
            isActive: true,
        },
    });
    const total = await prisma.user.count({where: where});

    return {users, total};
}


export async function createStaffUser(user) {
    const hashedPassword = bcrypt.hashSync(user.password, 8);
    const newUser = await prisma.user.create({
        data: {
            email: user.email,
            password: hashedPassword,
            role: "STAFF",
            name: user.name,
            emailConfirmed: true,
        },
        select: {
            id:true,
            email: true,
            isActive: true,
            name: true
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
            name: user.name
        },
        select: {
            id: true,
            email: true,
            isActive: true,
            name: true
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

