import React, { useEffect, useState } from "react";


import { useQuery } from "@tanstack/react-query";
import { Container } from "react-bootstrap";
import { Card, CardBody,  Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import UserDeleteButton from "./user-delete-button";
import { GetUsers } from "@/requests/admin/GetUsers";
export default function UserTable({
  optionsJSX,
}: {optionsJSX: any}) {
  const columns = [
    { name: "شناسه", uid: "id" },
    { name: "نام", uid: "name" },
    { name: "شماره موبایل", uid: "phone"},
    { name: "رمز عبور", uid: "password" },
    {name: "عملیات", uid: "actions"}
  ];
  const [sort, setSort] = useState({ currentKey: "newest" });
  const query = useQuery({
    queryKey: [
      "users",
      sort,
    ],
    queryFn: async () => {
      return await GetUsers();
    },
  });
  const items = query.data?.users;
  const renderCell = React.useCallback((item: { [x: string]: any; phone: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.PromiseLikeOfReactNode | null | undefined; id: any; }, columnKey: string | number) => {
    const cellValue = item[columnKey];

    switch (columnKey) {
      case "phone":
        return (
          <a
            className="text-bold text-sm capitalize"
            style={{ color: "blue", textDecoration: "underline" }}
            href={"tel:" + item.phone}
          >
            {item.phone}
          </a>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <UserDeleteButton id={item.id} />
          </div>
        );
      default:
        return (
          <p
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "120px",
            }}
            className="text-bold text-sm"
          >
            {cellValue}
          </p>
        );
    }
  }, []);

  return (
    <Container>
      <Card className="mb-2">
        <CardBody style={{ display: "flex", justifyContent: "start" }}>
          <div className="flex gap-3 align-items-center">
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "end",
                alignItems: "center",
              }}
            >
              {optionsJSX}
            </div>
          </div>
        </CardBody>
      </Card>
      <Card className="mb-2">
        <CardBody style={{ maxHeight: "100vh", overflowY: "scroll" }}>
          <Table
            isStriped
            dir="rtl"
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  style={{
                    backgroundColor: "white",
                    color: "#002E62",
                    textAlign: "right",
                  }}
                  align="end"
                  className="text-bold h6"
                  key={column.uid}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={items ?? []}
              loadingContent={<Spinner />}
              loadingState={query.isPending? "loading" : "idle"}
            >
              {(item : any) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell
                      style={{ border: "0.5px #EEE solid" }}
                      align="right"
                    >
                      {renderCell(item, columnKey)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </Container>
  );
}
