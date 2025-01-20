import KanbanBoard from "@/app/UiComponents/DataViewer/leads/ClientLeadKanban.jsx";

export default function page({searchParams}) {
    return <KanbanBoard admin={true} staffId={searchParams.staffId}/>
}