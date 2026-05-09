import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
  Input,
  Kbd,
  Switch,
  useDisclosure,
} from "@heroui/react";
import SentMessage from "./sentmessage";
import RecMessage from "./recmessage";
import { Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";
import chatRequest from "@/requests/chatRequest";
import { useTheme } from "next-themes";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import axios, { CancelTokenSource } from "axios";
import { ChatContext } from "@/helpers/contexts/chatContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetMessages } from "@/requests/queries/getMessages";
import NoMessage from "./nomessage";
import saveSendMessage from "@/requests/saveSendMessage";
import updateReceiveMessageContent from "@/requests/updateRecieveMessageContent";
import createReceiveMessage from "@/requests/createReceiveMessage";
import { IoSettings } from "react-icons/io5";
import SourcesModal from "./sources-modal";
import { Message, Source } from "@/types";
import FeedbackModal from "./feedback-modal";

export default function ChatPage({isReceiving , setIsReceiving}: {isReceiving: boolean, setIsReceiving: Dispatch<SetStateAction<boolean>>}) {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isFeedBackOpen,
    onOpen: onFeedBackOpen,
    onClose: onFeedBackClose,
  } = useDisclosure();
  const [selectedMessageSources, setSelectedMessageSources] = useState<
    Source[]
  >([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [page, setPage] = useState<number>(1);
  const [chatState, _chatDispatch] = useContext(ChatContext);
  const [message, setMessage] = useState("");
  const [doRetrieval, setDoRetrieval] = useState(true);
  const [doMetadata, setDoMetadata] = useState(true);
  
  const [receivingMessage, setReceivingMessage] = useState("");
  const [messages, setMessages] = useState<ReactElement[]>([]);
  const [axiosSource, setAxoisSource] = useState<
    CancelTokenSource | null | undefined
  >(null);
  const [key, setKey] = useState(0);
  const sendMessage = async () => {
    if (!chatState?.chatId) return;
    if (message.trim() == "") return;
    setIsReceiving(true);
    setReceivingMessage("");
    setMessages((old) => [...old, <SentMessage key={key} text={message} />]);
    // 1. Let's save the send message
    (await saveSendMessage(message, chatState?.chatId))
      ?.data?.message;
    // 2. Let's save the receive message
    const receiveMessage = (
      await createReceiveMessage(chatState?.chatId, message)
    )?.data?.message;
    // 3. Let's stream the message
    const callback = (mes: any) => {
      mes.then(async function (textMessage: string) {
        // 4. Let's update the message content
        const recMessage = await updateReceiveMessageContent(
          receiveMessage?.id,
          textMessage
        );
        setIsReceiving(false);
        setMessages((old) => [
          ...old,
          <RecMessage
            onFeedbackClose={onFeedBackClose}
            onFeedbackOpen={onFeedBackOpen}
            onSourcesOpen={onOpen}
            setSelectedMessageSources={setSelectedMessageSources}
            setSelectedMessage={setSelectedMessage}
            id={receiveMessage?.id}
            key={key + 1}
            text={textMessage}
            withSources
            customSources={recMessage.data?.message?.sources}
            latestQuery={recMessage.data?.message?.query}
          />,
        ]);
        queryClient.invalidateQueries({
          queryKey: ["messages"],
        });
      });
    };
    const source = axios.CancelToken.source();
    setAxoisSource(source);
    chatRequest(
      message,
      chatState?.chatId,
      receiveMessage?.id,
      setReceivingMessage,
      setIsReceiving,
      callback,
      source,
      doRetrieval,
      doMetadata
    );
    setKey((old) => old + 2);
    setMessage("");
  };

  useEffect(() => {
    const page = document.getElementById("main-chat-page");
    page?.scrollTo({
      behavior: "smooth",
      top: page?.scrollHeight + 1000,
    });
  }, [messages]);

  const query = useQuery({
    queryKey: ["messages", page, chatState?.chatId],
    queryFn: async () =>
      await GetMessages({ page, chat_id: chatState?.chatId }),
  });
  const items = query.data?.messages;

  useEffect(() => {
    if (items) {
      const temp = [];
      console.log(items);
      for (const item of items) {
        temp.push(
          item.fromChatbot ? (
            <RecMessage
              onSourcesOpen={onOpen}
              onFeedbackOpen={onFeedBackOpen}
              onFeedbackClose={onFeedBackClose}
              setSelectedMessage={setSelectedMessage}
              setSelectedMessageSources={setSelectedMessageSources}
              withSources
              customSources={item.sources}
              key={item.id}
              text={item.content}
              id={item.id}
              latestQuery={item.query}
            />
          ) : (
            <SentMessage key={item.id} text={item.content} />
          )
        );
      }
      setMessages(temp);
    }
  }, [items, onFeedBackClose, onFeedBackOpen, onOpen]);
  return (
    <>
      <Card isBlurred radius="lg" className="border-none w-full h-[92vh] my-2">
        <div className="chat-header flex items-center py-2">
          <div
            className="chat-options flex justify-start items-center px-5"
            style={{ width: "40%" }}
          >
            {theme == "dark" ? (
              <Button
                onPress={() => setTheme("light")}
                color="primary"
                variant="light"
                size="sm"
              >
                <MdLightMode size={20} />
              </Button>
            ) : (
              <Button
                onPress={() => setTheme("dark")}
                color="primary"
                variant="light"
                size="sm"
              >
                <MdDarkMode size={20} />
              </Button>
            )}
          </div>
          <h1 className="text-center text-xl" style={{ width: "100%" }}>
            چت بات هوشمند واحد لیچینگ مجتمع مس سرچشمه
          </h1>
          <div style={{ width: "40%" }}></div>
        </div>

        <section
          id="main-chat-page"
          className="h-[calc(100%_-_250px)] mx-5 no-scrollbar rounded-lg"
          style={{ overflowY: "scroll", backgroundColor: "transparent" }}
        >
          {chatState?.chatId ? (
            messages.length > 0 ? (
              messages.map((msgComponent) => msgComponent)
            ) : (
              <NoMessage title={"هیج پیامی وجود ندارد"} />
            )
          ) : (
            <NoMessage title="لطفا ابتدا یک گفت و گو را انتخاب کرده یا گفت و گوی جدیدی ایجاد کنید" />
          )}
          {isReceiving && (
            <RecMessage
              latestQuery={""}
              customSources={[]}
              text={receivingMessage}
              withSources={false}
              axiosSource={axiosSource}
              onFeedbackClose={onFeedBackClose}
              onFeedbackOpen={onFeedBackOpen}
              onSourcesOpen={onOpen}
              setSelectedMessage={setSelectedMessage}
              setSelectedMessageSources={setSelectedMessageSources}
            />
          )}
        </section>
        <CardFooter className="absolute bottom-0 z-10 flex flex-col">
          <Card className="w-full">
            <CardBody>
              <div className="flex justify-between overflow-hidden py-2 px-2 w-full">
                <Button
                  isDisabled={!chatState?.chatId}
                  className="text-white"
                  color="primary"
                  radius="lg"
                  size="md"
                  onPress={sendMessage}
                  isLoading={isReceiving}
                >
                  ارسال
                </Button>
                <Input
                  dir="rtl"
                  aria-label="message"
                  classNames={{
                    inputWrapper: "bg-default-100 w-100 mx-2",
                    input: "text-sm",
                  }}
                  labelPlacement="outside"
                  placeholder="سوال خود را بنویسید ..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    return e.key == "Enter" && !isReceiving
                      ? sendMessage()
                      : null;
                  }}
                  type="text"
                />
              </div>
              <div className="w-full flex justify-end py-2 px-2">
                <div className="flex justify-evenly items-center">
                  <p className="text-sm mr-10 text-right" style={{color: "#777"}}>
                    هوش مصنوعی ممکن است اشتباه کند! همیشه محتوای حساس را از
                    منابع بررسی کنید
                    <br/>
                    برای جستجوی اسامی و عناوین در پایان نامه ها، از تنظیمات حالت اسناد را خاموش کنید
                  </p>

                  <Dropdown
                    placement="top"
                    classNames={{
                      base: "before:bg-default-200", // change arrow background
                      content: "p-0 border-small border-divider bg-background",
                    }}
                    radius="sm"
                  >
                    <DropdownTrigger>
                      <Button variant="flat" color="primary" size="sm">
                        <IoSettings size={20} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Custom item styles"
                      className="p-3"
                      disabledKeys={["profile"]}
                      itemClasses={{
                        base: [
                          "rounded-md w-[200px]",
                          "text-default-500",
                          "transition-opacity",
                          "data-[hover=true]:text-foreground",
                          "data-[hover=true]:bg-default-100",
                          "dark:data-[hover=true]:bg-default-50",
                          "data-[selectable=true]:focus:bg-default-50",
                          "data-[pressed=true]:opacity-70",
                          "data-[focus-visible=true]:ring-default-500",
                        ],
                      }}
                    >
                      <DropdownItem
                        key="RAG"
                        isReadOnly
                        classNames={{
                          title: "flex justify-between items-center w-[150px]",
                        }}
                      >
                        <Switch
                          isSelected={doRetrieval}
                          onValueChange={(b) => {
                            // if (!b) {
                            //   setDoMetadata(false);
                            // }
                            setDoRetrieval(b);
                          }}
                        ></Switch>
                        <span className="text-sm h-full">استفاده از اسناد</span>
                      </DropdownItem>
                      <DropdownItem
                        key="MetaData"
                        isReadOnly
                        classNames={{
                          title: "flex justify-between items-center w-[150px]",
                        }}
                      >
                        <Switch
                          // isDisabled={!doRetrieval}
                          isSelected={doMetadata}
                          onValueChange={(b) => setDoMetadata(b)}
                        ></Switch>
                        <span className="text-sm h-full">
                          استفاده از متاداده ها
                        </span>
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </CardBody>
          </Card>
        </CardFooter>
      </Card>
      <SourcesModal
        isOpen={isOpen}
        onClose={onClose}
        sources={selectedMessageSources}
      />
      {selectedMessage && (
        <FeedbackModal
          isFeedbackOpen={isFeedBackOpen}
          message={selectedMessage}
          onFeedbackClose={onFeedBackClose}
          latestQuery={selectedMessage.query ?? ""}
        />
      )}
    </>
  );
}
