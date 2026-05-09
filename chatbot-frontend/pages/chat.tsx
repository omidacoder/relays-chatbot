
import DefaultLayout from "@/layouts/default";
import ChatPage from "@/components/chatpage";
import Head from "next/head";
import ChatList from "@/components/chatlist";
import { Col, Row } from "react-bootstrap";
import GuideModal from "@/components/guide-modal";
import { useState } from "react";

export default function ChatMainPage() {
	const [isReceiving, setIsReceiving] = useState(false);
	return (
		
		<DefaultLayout>
			<Head>
				<title>چت بات هوشمند واحد لیچینگ مجتمع مس سرچشمه</title>
			</Head>
			<section className="py-4 md:py-5">
				<Row>
					<Col lg={4}>
					<ChatList isReceiving={isReceiving} setIsReceiving={setIsReceiving}  />
					</Col>
					<Col lg={8}>
					<ChatPage isReceiving={isReceiving} setIsReceiving={setIsReceiving} />
					</Col>
				</Row>
			</section>
			<GuideModal />
		</DefaultLayout>
	);
}
