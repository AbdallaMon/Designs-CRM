"use client";
import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaBusinessTime } from "react-icons/fa";
import {
  KanbanBeginerLeadsStatus,
  KanbanLeadsStatus,
} from "@/app/helpers/constants";
import { useAuth } from "@/app/providers/AuthProvider";

import OptimizedKanbanLead from "./OptimizedKanbanLead";

dayjs.extend(relativeTime);

const OptimizedClientKanbanLead = ({ staffId }) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState();
  const statusArray = Object.keys(
    user.role === "STAFF" && !user.isPrimary
      ? KanbanBeginerLeadsStatus
      : KanbanLeadsStatus
  );
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
      <OptimizedKanbanLead
        links={links}
        statusArray={statusArray}
        type="STAFF"
        reRenderColumns={reRenderColumns}
        setReRenderColumns={setReRenderColumns}
        staffId={staffId}
        setFilters={setFilters}
        filters={filters}
      />
    </>
  );
};
export default OptimizedClientKanbanLead;
