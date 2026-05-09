import { SERVER_URL } from "@/constants";
import { Source } from "@/types";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useTheme } from "next-themes";
import Link from "next/link";

interface SourcesModalParams {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
}
export default function SourcesModal({
  isOpen,
  onClose,
  sources,
}: SourcesModalParams) {
  const { theme, setTheme } = useTheme();
  return (
    <Modal
      scrollBehavior="inside"
      size={"5xl"}
      isOpen={isOpen}
      onClose={onClose}
      closeButton={<></>}
    >
      <ModalContent dir="rtl">
        {(onClose) => (
          <>
            <ModalHeader
              className="flex flex-col gap-1"
              style={{ color: theme == "dark" ? "white" : "black" }}
            >
              منابع
            </ModalHeader>
            <ModalBody>
              {sources &&
                sources.map((item: Source, i: number) => (
                  <div className="my-4" key={i}>
                    <p style={{ color: theme == "dark" ? "white" : "black" }}>
                      {item.content}
                    </p>
                    <p style={{ color: theme == "dark" ? "white" : "black" }}>
                      دانلود فایل وورد تحقیق:{" "}
                      <Link
                        style={{ color: theme == "dark" ? "white" : "black" }}
                        href={SERVER_URL + item.refference}
                      >
                        لینک دانلود
                      </Link>
                    </p>
                  </div>
                ))}
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
