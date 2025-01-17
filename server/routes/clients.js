import {uploadFiles} from "../services/utility.js";
import express from "express";
const router = express.Router();
import prisma from "../prisma/prisma.js";
import {newLeadNotification} from "../services/notification.js";

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
               dateOfBirth:body.dateOfBirth
           }
        })
        }
        const data={
            client: {connect: {id:client.id}},
            selectedCategory: body.category,
            type: body.item,
            status: 'NEW',
            description:`${body.category} ${body.item} ${body.category==="DESIGN"?body.emirate:""}`
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
