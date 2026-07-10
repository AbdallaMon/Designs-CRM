"use client";
import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

const DiscoverySourcesTable = ({ sourcesData }) => {
  return (
    <Table size="small" sx={{ mt: 2 }}>
      <TableHead>
        <TableRow>
          <TableCell>المصدر</TableCell>
          <TableCell align="right">عدد العملاء</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sourcesData.map((r, i) => (
          <TableRow key={i}>
            <TableCell>{r.source}</TableCell>
            <TableCell align="right">{r.count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DiscoverySourcesTable;
