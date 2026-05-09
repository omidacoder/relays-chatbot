import axios, { CancelTokenSource } from "axios";
import { Dispatch, ReactElement, SetStateAction } from "react";
import { SERVER_URL } from "@/constants";
import { toast } from "react-toastify";
const chatRequest = (
  query: string,
  chatId: number,
  messageId: number,
  setMessage: Dispatch<SetStateAction<string>>,
  setIsReceiving: Dispatch<SetStateAction<boolean>>,
  callback: any,
  source: CancelTokenSource,
  doRetrieval: boolean,
  doMetadata: boolean
) => {
  setIsReceiving(true);
  return axios({
    url: SERVER_URL + "/query-stream",
    method: "GET",
    params: {
      chatId,
      query,
      recieve_message_id: messageId,
      do_retrieval: doRetrieval,
      do_metadata: doMetadata
    },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("tk")}`,
    },
    cancelToken: source.token,
    onDownloadProgress: (progressEvent) => {
      setIsReceiving(true);
      const dataChunk = progressEvent.event.currentTarget.response;
      setMessage(dataChunk);
    },
  })
    .then(({ data }) => {
      const resolved = Promise.resolve(data);
      callback(resolved);
    })
    .catch((error) => {
      setIsReceiving(false);
      if (axios.isCancel(error)) {
        console.log("Request canceled:", error.message);
      } else {
        toast("مشکل برقراری ارتباط با سرور", {
          type: "error",
          position: "bottom-center",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          autoClose: 3000,
        });
      }
    });
};

export default chatRequest;
