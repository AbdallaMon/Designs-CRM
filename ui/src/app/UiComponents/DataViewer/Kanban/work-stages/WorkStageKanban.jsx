"use client";
import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaBusinessTime } from "react-icons/fa";
import { PROJECT_STATUSES } from "@/app/helpers/constants";
import KanbanBoard from "../shared/KanbanBoard";

dayjs.extend(relativeTime);

const WorkStageKanban = ({ staffId, type }) => {
  const [filters, setFilters] = useState();
  const statusArray = PROJECT_STATUSES[type];
  const [reRenderColumns, setReRenderColumns] = useState(
    Object.fromEntries(statusArray.map((key) => [key, false]))
  );

  const links = [
    {
      href: "/dashboard/all-deals",
      title: "See all deals",
      icon: <FaBusinessTime />,
    },
  ];
  return (
    <>
      <KanbanBoard
        links={links}
        statusArray={statusArray}
        type={type}
        reRenderColumns={reRenderColumns}
        setReRenderColumns={setReRenderColumns}
        staffId={staffId}
        setFilters={setFilters}
        filters={filters}
        isNotStaff={true}
      />
    </>
  );
};
export default WorkStageKanban;
