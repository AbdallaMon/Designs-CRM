import GenericErrorPage from "@/features/error/pages/GenericErrorPage";

export const metadata = {
  title: "Something went wrong | Dream Studio",
};

export default async function ErrorPage({ searchParams }) {
  const query = await searchParams;

  return <GenericErrorPage code={query?.code} status={query?.status} />;
}
