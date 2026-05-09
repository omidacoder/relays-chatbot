import { Navbar } from "@/components/navbar";
import { Head } from "./head";
import { Col, Row } from "react-bootstrap";
import ChatList from '@/components/chatlist';

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex flex-col h-screen">
			<Head />
			<main className="container mx-auto max-w-7xl px-6 flex-grow">
				{children}
			</main>
			
		</div>
	);
}
