import { Card, Spinner } from "@heroui/react";
import { useTheme } from "next-themes";
export default function SentMessage({text} : {text : string}){
    const {theme , setTheme} = useTheme();
    return (
        <div className="w-full flex justify-end mt-2">
            <Card dir="rtl" className=" max-w-96" style={{backgroundColor : theme == 'dark' ? "#c031e2" : '#bfe6ff',borderRadius : 10 , borderBottomRightRadius : 0,padding : 10,maxWidth : 600,textAlign: 'right',direction: 'rtl'}}><p className="w-full text-sm">{text}</p></Card>
        </div>
    )
}

