export function getVisibleKanbanStatuses({ statusArray, selectedStatus }) {
  if (!selectedStatus || selectedStatus === "all") return statusArray;
  return statusArray.filter((status) => status === selectedStatus);
}
