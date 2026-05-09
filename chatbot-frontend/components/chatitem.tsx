import { ChatContext } from "@/helpers/contexts/chatContext";
import { Button } from "@heroui/react";
import { useContext } from "react";
export default function ChatItem({id, title, date, botName, disabled} : {id:number,title : string | null, date: string, botName: string, disabled: boolean}){
    const [_chatState , chatDispatch] = useContext(ChatContext);
    const chatSelected = () => {
        chatDispatch({
            type: 'SET',
            payload: {
                chatId : id
            }
        })
    }
    return (
        <div className="w-full flex justify-end mt-2" >
            <Button isDisabled={disabled} disabled={disabled} variant="flat" className="w-full flex justify-end p-2 h-[80px]" onPress={chatSelected}>
                <div>
                    <h6 className="text-right">{title ? title : ")بدون عنوان("}</h6>
                    <p className="text-right">مدل زبانی: {botName}</p>
                    <p style={{fontSize: 10}} className="text-right">آخرین به روز رسانی: {date}</p>
                </div>
            </Button>
        </div>
    )
}

