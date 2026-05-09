export default function ChatReducer(state, action) {
  switch (action.type) {
    case "SET":
      return {
        chatId : action.payload.chatId
      };
    default:
      throw new Error();
  }
}
