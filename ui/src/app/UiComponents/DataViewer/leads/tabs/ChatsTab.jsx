import ChatContainer from "../../chat/ChatContainer";

export default function ChatsTab({ clientLeadId }) {
  return <ChatContainer type="tab" clientLeadId={clientLeadId} />;
}
