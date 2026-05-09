import axios from "axios"
import { LOGIN_URL } from "@/constants";

export const Login = ({phone , password}: {phone: string, password: string}) => {
    return axios({
        url : LOGIN_URL,
        data : {
            phone,
            password
        },
        method : 'post'
    }).then((response) => response);
} 