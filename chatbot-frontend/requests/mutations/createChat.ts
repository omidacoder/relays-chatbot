import axios from "axios";
import { CHAT_URL } from "@/constants";

export const CreateChat = async ({ title, botName }: {title: string, botName: string}) => {
  const response = await axios({
    url: CHAT_URL,
    data: {
      title,
      botName,
    },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
    method: "post",
  });
  return response.data
};
