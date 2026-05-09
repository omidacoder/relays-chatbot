import axios from "axios";
import { USER_URL } from "@/constants";

export const CreateUser = async ({
  phone,
  name,
  password,
}: {
  phone: string;
  name: string;
  password: string;
}) => {
  const response = await axios({
    url: USER_URL,
    data: {
      phone,
      name,
      password,
    },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
    method: "post",
  });
  return response.data;
};
