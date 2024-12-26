import bcrypt from "bcrypt";

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
