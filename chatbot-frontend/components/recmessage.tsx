import { Message, Source } from "@/types";
import {
  Button,
  Card,
} from "@heroui/react";
import { CancelTokenSource } from "axios";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction} from "react";
import { FaStop } from "react-icons/fa";

interface RecMessageParams {
  text: string;
  withSources: boolean;
  axiosSource?: CancelTokenSource | null;
  customSources: Source[];
  id?: number;
  latestQuery: string;
  setSelectedMessageSources: Dispatch<SetStateAction<Source[]>>;
  setSelectedMessage: Dispatch<SetStateAction<Message | null>>;
  onSourcesOpen: () => void;
  onFeedbackOpen: () => void;
  onFeedbackClose: () => void;
}
export default function RecMessage({
  text,
  withSources,
  axiosSource,
  customSources,
  id,
  latestQuery,
  setSelectedMessage,
  setSelectedMessageSources,
  onSourcesOpen,
  onFeedbackOpen,
  onFeedbackClose,
}: RecMessageParams) {
  const { theme, setTheme } = useTheme();
  
  // useEffect(() => {
  //   if (withSources) {
  //     // getRetrievalResults('test' , (data : any) => {
  //     //     setSources(data.results)
  //     // })
  //     setSources(customSources);
  //   }
  // }, [customSources, withSources]);

  return text == "<NOT_SET_TOKEN>" ? (
    <></>
  ) : (
    <>
      <div className="w-full flex justify-start mt-2">
        <Card
          dir="rtl"
          className="relative p-4 pb-12"
          style={{
            backgroundColor: theme == "dark" ? "#3B096C" : "#bfffd7",
            borderRadius: 10,
            borderBottomLeftRadius: 0,
            maxWidth: 600,
            minWidth: 200,
            textAlign: "right",
            direction: "rtl",
          }}
        >
          {text == "" ? (
            <p className="w-full fade-anime text-sm">در حال فکر کردن ...</p>
          ) : (
            <p className="w-full text-sm">{text}</p>
          )}
          <br />
          {withSources && (
            <>
              <Button
                variant="light"
                className="absolute right-4 bottom-2"
                onPress={() => {
                  onSourcesOpen()
                  setSelectedMessageSources(customSources)
                }}
                size="sm"
              >
                منابع
              </Button>
              <Button
                variant="light"
                className="absolute left-4 bottom-2"
                onPress={() => {
                  setSelectedMessage({
                    id: id ?? -1,
                    content: text,
                    fromChatbot: true,
                    query: latestQuery
                  });
                  onFeedbackOpen();
                }}
                size="sm"
              >
                ثبت بازخورد
              </Button>
            </>
          )}
          {!withSources && (
            <Button
              onPress={() => {
                if (axiosSource) {
                  console.log("cancelled by user");
                  axiosSource.cancel("cancelled by user");
                }
              }}
              variant="light"
              className="absolute left-4 bottom-2"
              size="sm"
            >
              {" "}
              <span className="flex items-center">
                <FaStop /> <span className="mx-2">متوقف کردن</span>
              </span>
            </Button>
          )}
        </Card>
      </div>
    </>
  );
}
