import NewLeadsPage from "@/app/UiComponents/DataViewer/leads/new-leads/NewLeadsPage.jsx";

export default async function Page(props) {
  const searchParams = await props.searchParams;
  return <NewLeadsPage searchParams={searchParams} withSearch={true} />;
}
