import axios from "axios";
import { CHAT_URL } from "@/constants";

export const GetChats = async () => {
  const response = await axios({
    url: CHAT_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('tk')}`
    },
    method: "get",
  });
  return response.data;
};
