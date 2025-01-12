import prisma from "./prisma/prisma.js";
import bcrypt from 'bcrypt';



async function main() {


    const clients = await Promise.all([
        prisma.client.create({data: {name: 'Ahmed Ali', phone: '+971501234567'}}),
        prisma.client.create({data: {name: 'Sara Mohamed', phone: '+971502345678'}}),
        prisma.client.create({data: {name: 'Fatima Hassan', phone: '+971503456789'}}),
        prisma.client.create({data: {name: 'Omar Khalid', phone: '+971504567890'}}),
        prisma.client.create({data: {name: 'Layla Mahmoud', phone: '+971505678901'}}),
        prisma.client.create({data: {name: 'Youssef Adel', phone: '+971506789012'}}),
        prisma.client.create({data: {name: 'Mona Ahmed', phone: '+971507890123'}}),
        prisma.client.create({data: {name: 'Khaled Amr', phone: '+971508901234'}}),
    ]);

    // Create users
    await prisma.user.create({
        data: {
            email: 'abdotlos60@gmail.com',
            name: 'Admin User',
            password: await bcrypt.hash('01127943935ASDf', 10),
            role: 'ADMIN',
        },
    });

    await prisma.user.create({
        data: {
            email: 'abdalle.webdev@gmail.com',
            name: 'Staff User',
            password: await bcrypt.hash('01127943935ASDf', 10),
            role: 'STAFF',
        },
    });
    await prisma.user.create({
        data: {
            email: 'abdalla.webdev@gmail.com',
            name: 'Staff User',
            password: await bcrypt.hash('01127943935ASDf', 10),
            role: 'STAFF',
        },
    });

    // Create clientLeads
    await prisma.clientLead.create({
        data: {
            client: {connect: {id: clients[0].id}},
            selectedCategory: 'CONSULTATION',
            consultationType: 'ROOM',
            price: "100",
            averagePrice:100,
            status: 'NEW',
        },
    });

    await prisma.clientLead.create({
        data: {
            client: {connect: {id: clients[1].id}},
            selectedCategory: 'DESIGN',
            designType: 'RESIDENTIAL',
            designItemType: 'UNDER_CONSTRUCTION',
            emirate: 'DUBAI',
            price: "3000 - 4000",
            averagePrice:3500,
            status: 'IN_PROGRESS',
        },
    });

    await prisma.clientLead.create({
        data: {
            client: {connect: {id: clients[2].id}},
            selectedCategory: 'DESIGN',
            designType: 'COMMERCIAL',
            designItemType: 'RETAIL_SPACE',
            emirate: 'ABU_DHABI',
            price: "4500 - 7500",
            averagePrice:6000,
            status: 'NEW',
        },
    });
    await Promise.all([
        prisma.clientLead.create({
            data: {
                client: {connect: {id: clients[0].id}},
                selectedCategory: 'CONSULTATION',
                consultationType: 'ROOM',
                price: '1000',
                status: 'NEW',
                averagePrice:1000,

                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                client: {connect: {id: clients[1].id}},
                selectedCategory: 'DESIGN',
                designType: 'RESIDENTIAL',
                designItemType: 'UNDER_CONSTRUCTION',
                emirate: 'DUBAI',
                price: '3000 - 4000',
                averagePrice:3500,
                status: 'IN_PROGRESS',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                client: {connect: {id: clients[2].id}},
                selectedCategory: 'DESIGN',
                designType: 'COMMERCIAL',
                designItemType: 'RETAIL_SPACE',
                emirate: 'ABU_DHABI',
                price: '4500 - 7500',
                averagePrice:6000,
                status: 'NEW',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                client: {connect: {id: clients[3].id}},
                selectedCategory: 'CONSULTATION',
                consultationType: 'CITY_VISIT',
                price: '2000',
                averagePrice:2000,
                status: 'NEW',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                client: {connect: {id: clients[4].id}},
                selectedCategory: 'DESIGN',
                designType: 'RESIDENTIAL',
                designItemType: 'OCCUPIED_VILLA',
                emirate: 'SHARJAH',
                price: '5000 - 6000',
                averagePrice:5500,
                status: 'IN_PROGRESS',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                client: {connect: {id: clients[5].id}},
                selectedCategory: 'DESIGN',
                designType: 'COMMERCIAL',
                designItemType: 'HOTEL',
                emirate: 'FUJAIRAH',
                price: '8000 - 10000',
                averagePrice:9000,
                status: 'NEGOTIATING',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                client: {connect: {id: clients[6].id}},
                selectedCategory: 'CONSULTATION',
                consultationType: 'BLUEPRINT',
                price: '1500',
                averagePrice:1500,
                status: 'IN_PROGRESS',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                client: {connect: {id: clients[7].id}},
                selectedCategory: 'DESIGN',
                designType: 'COMMERCIAL',
                designItemType: 'MIXED_USE',
                emirate: 'RAS_AL_KHAIMAH',
                price: '7000 - 9000',
                averagePrice:8000,
                status: 'NEW',
                assignedAt: new Date(),
            },
        }),
    ])
}


main()
      .catch((e) => {
          console.error(e);
          process.exit(1);
      })
      .finally(async () => {
          await prisma.$disconnect();
      });