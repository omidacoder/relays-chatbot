import React, { useEffect, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Button,
  Link,
} from "@heroui/react";
import { IoEye } from "react-icons/io5";
import { IoEyeOff } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { Login } from "@/requests/mutations/login";
import Image from "next/image";
import { useTheme } from "next-themes";
import { MdDarkMode, MdLightMode } from "react-icons/md";
export default function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const toastId = useRef(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { theme, setTheme } = useTheme();
  const mutation = useMutation({
    mutationFn: Login,
    onSuccess: (response) => {
      setLoading(false);
      //saving the token in local storage
      localStorage.setItem("tk", response.data.access_token);
      localStorage.setItem("name", response.data.name);
      localStorage.setItem("phone", response.data.phone);
      toast.update(toastId.current, {
        render: "با موفقیت وارد شدید",
        type: "success",
        position: "bottom-center",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        autoClose: 3000,
        isLoading: false,
      });
      if(response.data.id == -1) // means admin
      {
        setTimeout(() => {
          router.push("admin");
        }, 1000);
      }
      else{
        setTimeout(() => {
          router.push("/chat");
        }, 1000);
      }
      
    },
    onError: (error) => {
      console.log(error);
      setLoading(false);
      toast.update(toastId.current, {
        render: "نام کاربری یا رمز عبور اشتباه است",
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
  const doLogin = () => {
    setLoading(true);
    toastId.current = toast.loading("در حال ورود", {
      position: "bottom-center",
    });
    mutation.mutate({ phone, password });
  };
  return (
    <>
      <Container className="mt-5 h-[60vh] flex items-center">
        <Row className="justify-content-center align-items-center w-full mt-20">
          <Col md={8}>
            <div className="w-full flex justify-center items-center mb-10">
              {!mounted ? null : theme == "light" ? (
                <Image
                  src={"/images/logo-black.png"}
                  height={200}
                  width={200}
                  alt="logo"
                />
              ) : (
                <Image
                  src={"/images/logo-white.png"}
                  height={200}
                  width={200}
                  alt="logo"
                />
              )}
            </div>
            <Card isBlurred className="min-h-5-[500px]">
              <CardHeader className="justify-content-center primary_color">
                <h3 className="text-xl">
                  چت بات هوشمند واحد لیچینگ مجتمع مس سرچشمه
                </h3>
              </CardHeader>
              <Divider />
              <CardBody className="relative">
                <div className="absolute flex justify-start items-center px-5 top-2 left-[-5px]">
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
                <div className="flex justify-content-end w-full mb-2 mt-4">
                  <h5 className="text-right">ورود به حساب کاربری</h5>
                </div>
                <div>
                  <Input
                    dir="rtl"
                    type="username"
                    color="primary"
                    size="lg"
                    placeholder="نام کاربری را وارد نمایید"
                    value={phone}
                    onValueChange={(value) => setPhone(value)}
                  />
                  <Input
                    dir="rtl"
                    className="py-3"
                    color="primary"
                    size="lg"
                    value={password}
                    placeholder="رمز عبور را وارد نمایید"
                    onValueChange={(value) => setPassword(value)}
                    endContent={
                      <button
                        className="focus:outline-none"
                        type="button"
                        onClick={toggleVisibility}
                      >
                        {isVisible ? (
                          <IoEye className="text-2xl text-default-400 pointer-events-none text-primary" />
                        ) : (
                          <IoEyeOff className="text-2xl text-default-400 pointer-events-none text-primary" />
                        )}
                      </button>
                    }
                    type={isVisible ? "text" : "password"}
                  />
                </div>
                <Col
                  className="forget-pass
              "
                ></Col>
                <Col>
                  <div className=" py-1 w-full flex justify-center items-center ">
                    <Button
                      isLoading={loading}
                      color="primary"
                      size="lg"
                      className="text-white"
                      onClick={doLogin}
                    >
                      ورود
                    </Button>
                  </div>
                </Col>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
