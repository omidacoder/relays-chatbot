import { RiDeleteBin6Fill } from "react-icons/ri";
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { DeleteUser } from "@/requests/admin/DeleteUser";

export default function UserDeleteButton({ id }: {id: number}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: DeleteUser,
    onSuccess: (response) => {
      setLoading(false);
      toast("با موفقیت حذف شد", {
        type: "success",
        position: "bottom-center",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        autoClose: 3000,
      });
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.refetchQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      setLoading(false);
      toast("مشکلی در ثبت درخواست شما پیش آمده است", {
        type: "error",
        position: "bottom-center",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        autoClose: 3000,
      });
    },
  });
  const deleteUser = () => {
    setLoading(true);
    mutation.mutate({ id });
  };
  return (
    <Popover
      placement="bottom"
      showArrow={true}
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <PopoverTrigger>
        <span className="text-lg text-danger cursor-pointer active:opacity-50">
          <RiDeleteBin6Fill size={20} className="mr-2" />
        </span>
      </PopoverTrigger>
      <PopoverContent>
        <div className="px-1 py-3">
          <div className="text-small font-bold primary_color">
            آیا از حذف مطمئن هستید ؟
          </div>
          <div className="mt-2">
            <Button
              isLoading={loading}
              onPress={deleteUser}
              color="primary"
            >
              بله
            </Button>
            <Button
              isDisabled={loading}
              color="danger"
              variant="light"
              onPress={() => setIsOpen(false)}
            >
              خیر
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
