import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  SelectItem,
  Select,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateChat} from "@/requests/mutations/createChat"
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTheme } from "next-themes";

export default function CreateChatModal({isOpen, onOpen, onOpenChange} : {isOpen: boolean, onOpen: () => void, onOpenChange: () => void}) {
  const bots = [
    {key: "main", label: "ربات اصلی"}
  ]
  const [loading , setLoading] = useState<boolean>(false)
  const {theme , setTheme} = useTheme();
  const title = useRef<HTMLInputElement>(null);
  const botName = bots[0].key
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: CreateChat,
    onSuccess: (response) => {
      setLoading(false);
      onOpenChange();
      toast("با موفقیت ایجاد شد", {
        type: "success",
        position: "bottom-center",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        autoClose: 3000,
      });
      queryClient.invalidateQueries({
        queryKey: ["chat"],
      });
    },
    onError: (error) => {
      console.log(error);
      setLoading(false);
    },
  });
  const create = () => {
    setLoading(true);
    mutation.mutate({
        botName,
        title: title.current?.value ?? ""
    });
  };
  return (
    <>
      <Modal closeButton={<></>} dir="rtl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1" style={{color: theme == 'dark' ? 'white' : 'black'}}>ایجاد گفت و گوی جدید</ModalHeader>
              <ModalBody>
                <Input ref={title} label="عنوان" placeholder="عنوان گفت و گوی جدید را وارد نمایید" />
                <Select
                    className="max-w-xs"
                    items={bots}
                    label="هوش مصنوعی"
                    placeholder="لطفا هوش مصنوعی مورد نظر را انتخاب نمایید"
                    >
                    {(bot) => <SelectItem key={bot.key}>{bot.label}</SelectItem>}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" isLoading={loading} onPress={onClose}>
                  بستن
                </Button>
                <Button color="primary" onPress={create} isLoading={loading}>
                  ایجاد
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}


