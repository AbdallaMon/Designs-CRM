import { ClientChatPage } from "@/app/UiComponents/DataViewer/chat/components/client/ClientChatPage.jsx";

export default async function Page({ searchParams }) {
  const awaitSearchParams = await searchParams;
  return <ClientChatPage {...awaitSearchParams} />;
}
