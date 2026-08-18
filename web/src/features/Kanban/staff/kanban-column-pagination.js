export const KANBAN_SCROLL_TOLERANCE = 2;

export function hasMoreColumnItems({
  page,
  pageSize,
  totalItems,
  receivedItems,
}) {
  const normalizedTotal = Number(totalItems);

  if (Number.isFinite(normalizedTotal) && normalizedTotal >= 0) {
    return (page + 1) * pageSize < normalizedTotal;
  }

  return receivedItems >= pageSize;
}

export function isNearKanbanColumnBottom(
  { scrollHeight, scrollTop, clientHeight },
  tolerance = KANBAN_SCROLL_TOLERANCE,
) {
  return scrollHeight - scrollTop - clientHeight <= tolerance;
}
