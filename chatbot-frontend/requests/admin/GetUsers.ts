import axios from "axios";
import { USER_URL } from "@/constants";

export const GetUsers = async () => {
  const response = await axios({
    url: USER_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
    method: "get",
  });
  return response.data;
};
