import UserManagement from "@/components/user-management";
import { useTheme } from "next-themes";
import Head from "next/head";

import { useEffect, useState } from "react";

export default function AdminPage() {
    const [authorized, setAuthorized] = useState(false);
    const {theme, setTheme} = useTheme();
    useEffect(() => {
      if (localStorage.getItem("tk")) {
        setAuthorized(true);
        setTheme('light');
      }
    }, [authorized,setTheme]);
    return (
        
        <>
            <Head>
                <title>مدیریت کاربران چت بات هوشمند واحد لیچینگ مجتمع مس سرچشمه</title>
            </Head>
            {authorized ? <UserManagement /> : "unauthorized"}
        </>
    );
}
