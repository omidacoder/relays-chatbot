import type { AppProps } from "next/app";
import 'bootstrap/dist/css/bootstrap.min.css';
import "tailwindcss/tailwind.css";
import "react-toastify/dist/ReactToastify.css";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// import { fontSans, fontMono } from "@/config/fonts";
import {useRouter} from 'next/router';
import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatContext}  from "@/helpers/contexts/chatContext";
import ChatReducer  from "@/helpers/reducers/chatReducer";
import { useReducer } from "react";
export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const queryClient = new QueryClient();
	const initialChat: {chatId: number | null} = {
		chatId: null
	}
	const [chatState, chatDispatch] = useReducer(ChatReducer, initialChat);
	return (
		<QueryClientProvider client={queryClient}>
		<HeroUIProvider  navigate={router.push}>
			 <ChatContext.Provider value={[chatState,chatDispatch]}
                      >
			<NextThemesProvider attribute="class" defaultTheme="dark">
				<Component {...pageProps} />
			</NextThemesProvider>
			</ChatContext.Provider>
		</HeroUIProvider>
		<ToastContainer />
		</QueryClientProvider>
	);
}

// export const fonts = {
// 	sans: fontSans.style.fontFamily,
// 	mono: fontMono.style.fontFamily,
// };
