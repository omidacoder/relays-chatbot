import { SERVER_URL } from "@/constants";
import axios from "axios";
const getRetrievalResults = async (
  id: string,
  callback: any
) => {
  return axios({
    url: SERVER_URL + `/retrievals?id=${id}`,
    method: "GET",
  }).then(({data}) => {
    callback(data)
  });
};

export default getRetrievalResults;
