import axios from "axios";
import { MESSAGES_URL } from "@/constants";

export const GetMessages = async ({page, chat_id}: {page: number, chat_id:number}) => {
  const response = await axios({
    url: MESSAGES_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
    params: {
        chat_id,
        page
    },
    method: "get",
  });
  return response.data;
};
