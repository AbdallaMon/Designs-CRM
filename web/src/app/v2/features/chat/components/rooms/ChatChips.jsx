"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { CHAT_FILTER_CHIPS, CHAT_FILTER_CHIPS_TAB } from "../../config/chatConstants.js";
import { useT } from "@/app/v2/lib/i18n";

export function ChatChips({ onSelect, isTab }) {
  const { t } = useT();
  const [selectedChip, setSelectedChip] = useState("ALL");
  const chips = isTab ? CHAT_FILTER_CHIPS_TAB : CHAT_FILTER_CHIPS;

  const handleChipClick = (_e, value) => {
    setSelectedChip(value);
    onSelect?.(value);
  };

  return (
    <Box>
      <Tabs value={selectedChip} variant="scrollable" scrollButtons="auto" onChange={handleChipClick}>
        {chips.map((chip) => (
          <Tab key={chip.value} label={t(chip.labelKey, chip.label)} value={chip.value} />
        ))}
      </Tabs>
    </Box>
  );
}

export default ChatChips;
