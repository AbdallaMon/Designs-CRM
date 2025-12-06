import NotificationPage from "@/app/UiComponents/DataViewer/Logs.jsx";

export default async function Notification(props) {
    const searchParams = await props.searchParams;
    return <NotificationPage searchParams={searchParams}/>
}
