import axios from "axios";
import { USER_DELETE_URL } from "@/constants";

export const DeleteUser = async ({
  id
}: {
  id: number;
}) => {
  const response = await axios({
    url: USER_DELETE_URL,
    data: {
      id
    },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
    method: "post",
  });
  return response.data;
};
