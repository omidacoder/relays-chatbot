import { useEffect, useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";
import { useTheme } from "next-themes";

export default function GuideModal() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const {theme, setTheme} = useTheme();
    useEffect(() => {
        onOpen()
    },[onOpen])
  return (
    <Modal
      backdrop={"blur"}
      dir="rtl"
      draggable
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className={"flex flex-col gap-1 " + (theme == 'dark' ? "text-white" : "text-black")}>
              راهنما
            </ModalHeader>
            <ModalBody>
              <p className={theme == 'dark' ? "text-white" : "text-black"}>
                نسخه اولیه چت بات هوشمند سرچشمه بر روی سخت افزار محدود اجرا شده
                است و در آینده پیشرفته تر خواهد شد. لطفا در نظر داشته باشید که
                هوش مصنوعی ممکن است اشتباه کند! همیشه منابع را بررسی کنید و پاسخ
                ها را چک کنید.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                بستن
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
