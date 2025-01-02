import React, {useState} from "react";
import {calculateTimeLeft} from "@/app/helpers/functions/utility.js";

export function useCallTimer(call){
    const [timeLeft,setTimeLeft]=useState()
    React.useEffect(() => {
        if (!call?.time) return;
        calculateTimeLeft(setTimeLeft,call);
        const timer = setInterval(()=>calculateTimeLeft(setTimeLeft,call), 1000);
        return () => clearInterval(timer);
    }, [call]);
    return {timeLeft}
}