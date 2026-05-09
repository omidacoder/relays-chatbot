import { createFeedback } from "@/requests/mutations/createFeedback";
import { Message, Source } from "@/types";
import { Button, Checkbox, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

interface FeedbackModalParams {
    onFeedbackClose: () => void;
    isFeedbackOpen: boolean;
    message: Message,
    latestQuery: string
}
export default function FeedbackModal({onFeedbackClose, isFeedbackOpen, message, latestQuery}:FeedbackModalParams) {
    const { theme, setTheme } = useTheme();
    const [isGood, setIsGood] = useState(true);
    const [correctResponse, setCorrectResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const toastId = useRef<string | number>("");
    const mutation = useMutation({
      mutationFn: createFeedback,
      onSuccess: () => {
        setLoading(false);

        //saving the token in local storage
        toast.update(toastId.current, {
          render: "بازخورد شما با موفقیت ثبت شد",
          type: "success",
          position: "bottom-center",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          autoClose: 3000,
          isLoading: false,
        });
        onFeedbackClose();
      },
      onError: (error: AxiosError<any, any>) => {
        setLoading(false);
        toast.update(toastId.current, {
          render: error.response?.data.message
            ? error.response?.data.message
            : "مشکلی در ثبت درخواست شما پیش آمده است",
          type: "error",
          position: "bottom-center",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          autoClose: 3000,
          isLoading: false,
        });
      },
    });
    const saveFeedback = () => {
      toastId.current = toast.loading("Please Wait ...", {
        position: "bottom-center",
      });
      setLoading(true);
      if (message?.id) {
        mutation.mutate({
          response: message?.content,
          query: latestQuery,
          isGood,
          correctResponse: isGood ? null : correctResponse,
          messageId: message.id,
        });
      } else {
        toast.update(toastId.current, {
          render: "مشکلی در ثبت درخواست شما پیش آمده است",
          type: "error",
          position: "bottom-center",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          autoClose: 3000,
          isLoading: false,
        });
      }
    };
    return (
      <Modal
        size={"lg"}
        isOpen={isFeedbackOpen}
        onClose={onFeedbackClose}
        closeButton={<></>}
      >
        <ModalContent dir="rtl">
          {(onFeedBackClose) => (
            <>
              <ModalHeader
                className="flex flex-col gap-1"
                style={{ color: theme == "dark" ? "white" : "black" }}
              >
                ثبت بازخورد
              </ModalHeader>
              <ModalBody>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex flex-col"
                >
                  <div className="grid grid-cols-1 gap-x-3 gap-y-3 lg:grid-cols-2">
                    <div className="col-span-2 lg:col-span-2 flex justify-start items-center gap-2">
                      <Checkbox
                        isSelected={isGood}
                        onValueChange={(b) => setIsGood(b)}
                      >
                        {" "}
                        <span className="text-sm h-full">بازخورد مثبت است</span>
                      </Checkbox>
                    </div>
                    <div className="col-span-2 lg:col-span-2">
                      <Textarea
                        isDisabled={isGood}
                        variant="bordered"
                        label="پاسخ صحیح (به صورت کامل و تشریحی بیان شود)"
                        type="text"
                        classNames={{
                          input: theme == "dark" ? "text-white" : "text-black",
                        }}
                        onChange={(e) =>
                          setCorrectResponse(e.currentTarget.value)
                        }
                      />
                    </div>
                  </div>
                </form>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onFeedBackClose}
                >
                  بستن
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  isLoading={loading}
                  onPress={saveFeedback}
                >
                  ثبت بازخورد
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
}