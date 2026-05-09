import { Button, Card, CardFooter, useDisclosure } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {GetChats} from "@/requests/queries/getChats"
import ChatItem from "./chatitem";
import CreateChatModal from "./createchatmodal";
import {christianToPersianDateTime, convertBotName} from "@/helpers/helpers";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function ChatList({isReceiving , setIsReceiving}: {isReceiving: boolean, setIsReceiving: Dispatch<SetStateAction<boolean>>}){
  const {theme , setTheme} = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
const query = useQuery({
    queryKey: [
      'chat'
    ],
    queryFn: async () =>
      await GetChats(),
  });
  const items = query.data?.chats;
const {isOpen, onOpen, onOpenChange} = useDisclosure();
const createChat = () => {
  onOpen();
}
return (
  <>
    <Card isBlurred radius="lg" className="border-none w-full h-[92vh] my-2">
      <div className="chat-header flex items-center py-2">
        <h1 className="text-center" style={{ width: "100%" }}>
          لیست گفت و گو ها
        </h1>
      </div>

      <section
        className="h-[calc(100%_-_100px)] mx-5 no-scrollbar rounded-lg"
        style={{ overflowY: "scroll", backgroundColor: "transparent" }}
      >
        {items?.map((chat: any) => (
          <ChatItem
            id={chat?.id}
            title={chat?.title}
            date={christianToPersianDateTime(chat?.updatedAt)}
            botName={convertBotName(chat?.botName)}
            key={chat.id}
            disabled={isReceiving}
          />
        ))}
      </section>
      <CardFooter className="flex flex-col items-center py-2 z-10 h-[300px]">
        <div className="w-full flex justify-center items-center">
          {!mounted ? null : theme == "light" ? (
            <Image
              src={"/images/logo-black.png"}
              height={100}
              width={100}
              alt="logo"
            />
          ) : (
            <Image
              src={"/images/logo-white.png"}
              height={100}
              width={100}
              alt="logo"
            />
          )}
        </div>
        <Button
          color="primary"
          className="mt-2 p-4"
          radius="lg"
          size="sm"
          isDisabled={isReceiving}
          disabled={isReceiving}
          onPress={createChat}
        >
          ساخت گفت و گوی جدید
        </Button>
      </CardFooter>
    </Card>
    <CreateChatModal
      isOpen={isOpen}
      onOpen={onOpen}
      onOpenChange={onOpenChange}
    />
  </>
);
}