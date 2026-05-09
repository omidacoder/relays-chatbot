import axios from "axios";
import { SERVER_AUTH_URL } from "@/constants";
const saveSendMessage = async (
  query: string,
  chatId: number,
) => {
  return await axios({
    url: SERVER_AUTH_URL + "/message",
    method: "POST",
    data: {
        fromChatbot: false,
        content: query,
        chatId,
    },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
  })
};

export default saveSendMessage;
