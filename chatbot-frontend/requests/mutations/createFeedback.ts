import axios from "axios";
import { FEEDBACK_URL } from "@/constants";

export const createFeedback = async (data: {
  isGood: boolean;
  correctResponse: string | null;
  messageId: number;
  query: string;
  response: string;
}) => {
  const response = await axios({
    url: FEEDBACK_URL,
    data,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
    method: "post",
  });
  return response.data;
};
