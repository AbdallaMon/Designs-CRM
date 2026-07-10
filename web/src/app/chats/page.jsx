import { ClientChatPage } from "@/features/chat/components/client/ClientChatPage.jsx";

export default async function Page({ searchParams }) {
  const awaitSearchParams = await searchParams;
  return <ClientChatPage {...awaitSearchParams} />;
}
