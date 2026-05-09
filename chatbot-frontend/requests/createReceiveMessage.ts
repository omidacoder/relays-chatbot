import axios from "axios";
import { SERVER_AUTH_URL } from "@/constants";
const createReceiveMessage = async (chatId: number, query: string) => {
  return await axios({
    url: SERVER_AUTH_URL + "/message",
    method: "POST",
    data: {
      fromChatbot: true,
      content: '<NOT_SET_TOKEN>',
      chatId,
      query
    },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
  });
};

export default createReceiveMessage;
