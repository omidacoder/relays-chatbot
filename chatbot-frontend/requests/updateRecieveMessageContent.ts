import axios from "axios";
import { SERVER_AUTH_URL } from "@/constants";
const updateReceiveMessageContent = async (messageId: number, content: string) => {
  return await axios({
    url: SERVER_AUTH_URL + "/message/update",
    method: "POST",
    data: {
      content,
      id: messageId
    },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
  });
};

export default updateReceiveMessageContent;
