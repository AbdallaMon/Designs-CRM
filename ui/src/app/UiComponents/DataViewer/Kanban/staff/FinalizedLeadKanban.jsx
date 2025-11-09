"use client";
import React, { useState } from "react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CONTRACT_LEVELS } from "@/app/helpers/constants";

import KanbanBoard from "../shared/KanbanBoard";

dayjs.extend(relativeTime);

const FinalizedLeadKanban = ({ staffId }) => {
  const [filters, setFilters] = useState();
  const statusArray = Object.keys(CONTRACT_LEVELS);

  const [reRenderColumns, setReRenderColumns] = useState(
    Object.fromEntries(statusArray.map((key) => [key, false]))
  );

  return (
    <>
      <KanbanBoard
        statusArray={statusArray}
        type="CONTRACTLEVELS"
        reRenderColumns={reRenderColumns}
        setReRenderColumns={setReRenderColumns}
        staffId={staffId}
        setFilters={setFilters}
        filters={filters}
      />
    </>
  );
};
export default FinalizedLeadKanban;
