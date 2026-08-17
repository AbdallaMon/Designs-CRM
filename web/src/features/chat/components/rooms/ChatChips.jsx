import { CHAT_ROOM_FILTERS } from "@dms/shared";
import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

const chipsItems = [
  { label: "All", value: CHAT_ROOM_FILTERS.ALL },
  { label: "Unread", value: CHAT_ROOM_FILTERS.UNREAD },
  { label: "Archived", value: CHAT_ROOM_FILTERS.ARCHIVED },
  { label: "Direct", value: CHAT_ROOM_FILTERS.DIRECT },
  { label: "Group", value: CHAT_ROOM_FILTERS.GROUP },
  { label: "Project", value: CHAT_ROOM_FILTERS.PROJECT },
  { label: "Client leads", value: CHAT_ROOM_FILTERS.CLIENT_LEADS },
];
const tabChipsItems = [
  { label: "All", value: CHAT_ROOM_FILTERS.ALL },
  { label: "Unread", value: CHAT_ROOM_FILTERS.UNREAD },
  { label: "Project", value: CHAT_ROOM_FILTERS.PROJECT },
  { label: "Client leads", value: CHAT_ROOM_FILTERS.CLIENT_LEADS },
  { label: "Archived", value: CHAT_ROOM_FILTERS.ARCHIVED },
];
export default function ChatChips({ onSelect, isTab }) {
  const [selectedChip, setSelectedChip] = useState(CHAT_ROOM_FILTERS.ALL);
  const tabsChips = isTab ? tabChipsItems : chipsItems;

  const handleChipClick = (event, value) => {
    setSelectedChip(value);

    if (onSelect) {
      onSelect(value);
    }
  };

  return (
    <Box>
      <Tabs
        value={selectedChip}
        variant="scrollable"
        scrollButtons="auto"
        onChange={handleChipClick}
      >
        {tabsChips.map((chip) => (
          <Tab key={chip.value} label={chip.label} value={chip.value} />
        ))}
      </Tabs>
    </Box>
  );
}
