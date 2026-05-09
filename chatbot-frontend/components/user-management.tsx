import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useState } from "react";
import { Button, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import UserTable from "./user-table";
import { CreateUser } from "@/requests/admin/CreateUser";



export default function UserManagement() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [repeatedPhone, setRepeatedPhone] = useState(false);
  const mutation = useMutation({
    mutationFn: CreateUser,
    onSuccess: (response) => {
      setLoading(false);
      toast("با موفقیت ایجاد شد", {
        type: "success",
        position: "bottom-center",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        autoClose: 3000,
      });
      onClose();
      setName("");
      setPhone("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.refetchQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      setLoading(false);
      toast("مشکلی در ثبت درخواست شما پیش آمده است", {
        type: "error",
        position: "bottom-center",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        autoClose: 3000,
      });
    },
  });
  const logout = () => {
    localStorage.removeItem("tk");
    router.replace("/");
  };
  const create = () => {
    setLoading(true);
    mutation.mutate({
      phone,
      name,
      password
    });
  };
  return (
    <Container>
      <Row className="text-center my-3">
        <h1 style={{ fontSize: 22 }} className="primary_color">
          سیستم مدیریت کاربران چت بات هوشمند واحد لیچینگ مجتمع مس سرچشمه
        </h1>
      </Row>
      <Row className="text-center my-3">
        <h6 style={{ fontSize: 15 }} className="primary_color">
          نام و نام خانوادگی مدیر سیستم :{" "}
          {localStorage?.getItem("name")
            ? localStorage.getItem("name")
            : "در حال بارگیری ..."}
        </h6>
      </Row>
      <div className="text-center my-3 gap-3">
        <Button
          className="bg-danger text-white"
          onPress={logout}
          fullWidth={false}
        >
          خروج
        </Button>
      </div>
      <Row className="mt-5">
        <Modal
          hideCloseButton
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          dir="rtl"
          size="5xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  تعریف کاربر
                </ModalHeader>
                <Divider />
                <ModalBody>
                  <Row>
                    <Col md={6} sm={12} className="py-2">
                      <Input
                        type="text"
                        variant="bordered"
                        label="نام"
                        value={name}
                        onValueChange={(value) => setName(value)}
                      />
                    </Col>
                    <Col md={6} sm={12} className="py-2">
                      <Input
                        type="text"
                        variant="bordered"
                        label="شماره موبایل"
                        value={phone}
                        onValueChange={(value) => setPhone(value)}
                      />
                    </Col>
                    <Col md={6} sm={12} className="py-2">
                      <Input
                        type="text"
                        variant="bordered"
                        label="رمز عبور"
                        value={password}
                        onValueChange={(value) => setPassword(value)}
                      />
                    </Col>
                  </Row>
                </ModalBody>
                <ModalFooter>
                  <Button
                    isDisabled={loading}
                    color="danger"
                    variant="light"
                    onPress={onClose}
                  >
                    بستن
                  </Button>
                  <Button
                    isLoading={loading}
                    onPress={create}
                    color="primary"
                  >
                    ثبت کاربر جدید
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </Row>
      <Row className="mt-2">
        <UserTable
          optionsJSX={
            <Button color="primary" onPress={onOpen}>
              تعریف کاربر
            </Button>
          }
        />
        <div></div>
      </Row>
    </Container>
  );
}
