"use client";
import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

// Renders the "Created" leads breakdown (Inside UAE by Emirate / Outside UAE by
// Country). `firstColLabel` is the header for the region column and `firstColKey`
// selects the region field on each row ("emirate" or "country").
const LeadsCreatedByRegionTable = ({ firstColLabel, firstColKey, rows }) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{firstColLabel}</TableCell>
          <TableCell align="right">Leads</TableCell>
          <TableCell align="right">Finalized</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows?.map((r, i) => (
          <TableRow key={i}>
            <TableCell>{r[firstColKey]}</TableCell>
            <TableCell align="right">{r.leads}</TableCell>
            <TableCell align="right">{r.finalized}</TableCell>
          </TableRow>
        ))}
        {(!rows || rows.length === 0) && (
          <TableRow>
            <TableCell colSpan={4}>No data</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default LeadsCreatedByRegionTable;
