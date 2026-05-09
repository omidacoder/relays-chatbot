import { Card, CardBody } from "@heroui/react";
import { Alert } from "react-bootstrap";

export default function NoMessage({title} : {title : string}){
    return (
        <div className="w-full h-full flex justify-content-center align-items-center" >
            <Card className="h-max-content bg-warning">
                <CardBody>
                    <p className="text-black">{title}</p>
                </CardBody>
            </Card>
        </div>
    )
}

