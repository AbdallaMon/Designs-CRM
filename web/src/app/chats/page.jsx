import { ClientChatPage } from "../UiComponents/DataViewer/chat/components/client/ClientChatPage";

export default async function Page({ searchParams }) {
  const awaitSearchParams = await searchParams;
  return <ClientChatPage {...awaitSearchParams} />;
}
