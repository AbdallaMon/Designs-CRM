import prisma from "./prisma/prisma.js";
import bcrypt from 'bcrypt';
const emirates = ['DUBAI', 'ABU_DHABI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH'];

async function createPriceRangesForAllEmirates(designId, baseMin, baseMax) {
    for (let i = 0; i < emirates.length; i++) {
        await prisma.designPriceRange.create({
            data: {
                designId,
                emirate: emirates[i],
                minPrice: baseMin - i * 100,
                maxPrice: baseMax - i * 200,
            },
        });
    }
}

async function main() {
    // Create leads
    const consultationLead = await prisma.lead.create({
        data: {
            category: 'CONSULTATION',
            consultations: {
                create: [
                    {type: 'ROOM', price: 100},
                    {type: 'BLUEPRINT', price: 1500},
                    {type: 'CITY_VISIT', price: 1500},
                ],
            },
            media: {
                create: [
                    {type: 'VIDEO', url: 'https://example.com/consultation-video.mp4'},
                ],
            },
        },
    });

    const residentialDesignLead = await prisma.lead.create({
        data: {
            category: 'DESIGN',
            designs: {
                create: [
                    {type: 'RESIDENTIAL', itemType: 'UNDER_CONSTRUCTION'},
                    {type: 'RESIDENTIAL', itemType: 'OCCUPIED_VILLA'},
                    {type: 'RESIDENTIAL', itemType: 'MASTER_SECTION'},
                ],
            },
        },
    });

    const commercialDesignLead = await prisma.lead.create({
        data: {
            category: 'DESIGN',
            designs: {
                create: [
                    {type: 'COMMERCIAL', itemType: 'RETAIL_SPACE'},
                    {type: 'COMMERCIAL', itemType: 'OFFICE_BUILDING'},
                    {type: 'COMMERCIAL', itemType: 'RESTAURANT'},
                    {type: 'COMMERCIAL', itemType: 'HOTEL'},
                    {type: 'COMMERCIAL', itemType: 'MIXED_USE'},
                ],
            },
        },
    });

    // Create price ranges for all designs and emirates
    const designs = await prisma.design.findMany();
    for (const design of designs) {
        let baseMin, baseMax;
        if (design.type === 'RESIDENTIAL') {
            baseMin = 2000;
            baseMax = 4000;
        } else {
            baseMin = 5000;
            baseMax = 10000;
        }
        await createPriceRangesForAllEmirates(design.id, baseMin, baseMax);
    }

    // Create clients
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
            email: 'abdotlos60@gmal.com',
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
            lead: {connect: {id: consultationLead.id}},
            client: {connect: {id: clients[0].id}},
            selectedCategory: 'CONSULTATION',
            consultationType: 'ROOM',
            price: "100",
            status: 'NEW',
        },
    });

    await prisma.clientLead.create({
        data: {
            lead: {connect: {id: residentialDesignLead.id}},
            client: {connect: {id: clients[1].id}},
            selectedCategory: 'DESIGN',
            designType: 'RESIDENTIAL',
            designItemType: 'UNDER_CONSTRUCTION',
            emirate: 'DUBAI',
            price: "3000 - 4000",
            status: 'IN_PROGRESS',
        },
    });

    await prisma.clientLead.create({
        data: {
            lead: {connect: {id: commercialDesignLead.id}},
            client: {connect: {id: clients[2].id}},
            selectedCategory: 'DESIGN',
            designType: 'COMMERCIAL',
            designItemType: 'RETAIL_SPACE',
            emirate: 'ABU_DHABI',
            price: "4500 - 7500",
            status: 'NEW',
        },
    });
    await Promise.all([
        prisma.clientLead.create({
            data: {
                lead: {connect: {id: consultationLead.id}},
                client: {connect: {id: clients[0].id}},
                selectedCategory: 'CONSULTATION',
                consultationType: 'ROOM',
                price: '1000',
                status: 'NEW',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                lead: {connect: {id: commercialDesignLead.id}},
                client: {connect: {id: clients[1].id}},
                selectedCategory: 'DESIGN',
                designType: 'RESIDENTIAL',
                designItemType: 'UNDER_CONSTRUCTION',
                emirate: 'DUBAI',
                price: '3000 - 4000',
                status: 'IN_PROGRESS',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                lead: {connect: {id: commercialDesignLead.id}},
                client: {connect: {id: clients[2].id}},
                selectedCategory: 'DESIGN',
                designType: 'COMMERCIAL',
                designItemType: 'RETAIL_SPACE',
                emirate: 'ABU_DHABI',
                price: '4500 - 7500',
                status: 'NEW',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                lead: {connect: {id: consultationLead.id}},
                client: {connect: {id: clients[3].id}},
                selectedCategory: 'CONSULTATION',
                consultationType: 'CITY_VISIT',
                price: '2000',
                status: 'NEW',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                lead: {connect: {id: commercialDesignLead.id}},
                client: {connect: {id: clients[4].id}},
                selectedCategory: 'DESIGN',
                designType: 'RESIDENTIAL',
                designItemType: 'OCCUPIED_VILLA',
                emirate: 'SHARJAH',
                price: '5000 - 6000',
                status: 'IN_PROGRESS',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                lead: {connect: {id: commercialDesignLead.id}},
                client: {connect: {id: clients[5].id}},
                selectedCategory: 'DESIGN',
                designType: 'COMMERCIAL',
                designItemType: 'HOTEL',
                emirate: 'FUJAIRAH',
                price: '8000 - 10000',
                status: 'NEGOTIATING',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                lead: {connect: {id: consultationLead.id}},
                client: {connect: {id: clients[6].id}},
                selectedCategory: 'CONSULTATION',
                consultationType: 'BLUEPRINT',
                price: '1500',
                status: 'IN_PROGRESS',
                assignedAt: new Date(),
            },
        }),
        prisma.clientLead.create({
            data: {
                lead: {connect: {id: commercialDesignLead.id}},
                client: {connect: {id: clients[7].id}},
                selectedCategory: 'DESIGN',
                designType: 'COMMERCIAL',
                designItemType: 'MIXED_USE',
                emirate: 'RAS_AL_KHAIMAH',
                price: '7000 - 9000',
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