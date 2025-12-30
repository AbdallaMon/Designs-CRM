import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

const chipsItems = [
  { label: "All", value: "ALL" },
  { label: "Unread", value: "UNREAD" },
  { label: "Archived", value: "ARCHIVED" },
  { label: "Direct", value: "DIRECT" },
  { label: "Group", value: "GROUP" },
  { label: "Project", value: "PROJECT" },
  { label: "Client leads", value: "CLIENT_LEADS" },
];
const tabChipsItems = [
  { label: "All", value: "ALL" },
  { label: "Unread", value: "UNREAD" },
  { label: "Project", value: "PROJECT" },
  { label: "Client leads", value: "CLIENT_LEADS" },
  { label: "Archived", value: "ARCHIVED" },
];
export default function ChatChips({ onSelect, isTab }) {
  const [selectedChip, setSelectedChip] = useState("ALL");
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
