import {uploadFiles} from "../services/utility.js";
import express from "express";
const router = express.Router();
import prisma from "../prisma/prisma.js";
import {newLeadNotification} from "../services/notification.js";
const priceRangeValues = {
    "400,000 or less": 200000, // Average of 0 to 400,000
    "400,000 to 600,000": 500000, // Midpoint of 400,000 and 600,000
    "600,000 to 800,000": 700000, // Midpoint of 600,000 and 800,000
    "800,000 and above": 900000, // Arbitrarily above 800,000
    "25,000 or less": 12500, // Average of 0 to 25,000
    "25,000 to 45,000": 35000, // Midpoint of 25,000 and 45,000
    "45,000 to 65,000": 55000, // Midpoint of 45,000 and 65,000
    "65,000 to 85,000": 75000, // Midpoint of 65,000 and 85,000
    "85,000 and above": 100000 // Arbitrarily above 85,000
};


const consultationLeadPrices = {
    ROOM: "800",
    BLUEPRINT: "1200",
    CITY_VISIT: "1800"
}

router.post("/new-lead",async (req,res)=>{
    const body= req.body;

    try {
        let client=await prisma.client.findUnique({
            where:{
                email:body.email,
            }
        })
        if(!client){
         client=await prisma.client.create({
           data:{
               name:body.name,
               phone:body.phone,
               email:body.email,
           }
        })
        }

        const data={
            client: {connect: {id:client.id}},
            selectedCategory: body.category,
            type: body.item,
            status: 'NEW',
            description:`${body.category} ${body.item} ${body.category==="DESIGN"?body.emirate?body.emirate:"OUTSIDE UAE":""}`
        }
        if(body.emirate){
            data.emirate=body.emirate
        }
        if(body.location==="OUTSIDE_UAE"){
            data.emirate==="OUTSIDE"
        }
        if(body.priceRange){
            data.price=`${body.priceRange[0]} - ${body.priceRange[1]}`
        }
        if(body.priceOption){
            data.price=body.priceOption
            data.averagePrice=priceRangeValues[body.priceOption]
        }
        if(body.category==="CONSULTATION"){
            data.price=consultationLeadPrices[body.item]
            data.averagePrice=Number(consultationLeadPrices[body.item])
        }
         const clientLead= await prisma.clientLead.create({
            data
        })
        if(body.url){
        await uploadFile(body,clientLead.id)
        }
        await newLeadNotification(clientLead.id,client)
        const message = body.lng === 'ar'
              ? 'تم تسجيل بياناتك بنجاح'
              : 'Your data has been successfully submitted';
        res.status(200).json({  message });
    } catch (error) {
        console.error('Error fetching client form:', error);
        const message = body.lng === 'ar'
              ? 'حدث خطا غير متوقع حاول مره اخره لاحقا'
              : 'Some thing wrong happen try again later';
        res.status(500).json({ message});
    }
})
async function uploadFile(body,clientLeadId){
    const data = {
        name:"Client File",
        clientLeadId:Number(clientLeadId),
        url:body.url,
        isUserFile:false
    }
    const file = await prisma.file.create({
        data,
        select: {
            id: true,
        }
    });
    return file
}
router.post('/upload', async (req, res) => {
    await uploadFiles(req, res);
});

export default router;
