"use client";
import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
} from "@mui/material";

const FinalizedHotspotsTable = ({ activeData, firstColLabel }) => {
  return (
    <Table size="small" sx={{ mt: 2 }}>
      <TableHead>
        <TableRow>
          <TableCell>#</TableCell>
          <TableCell>{firstColLabel}</TableCell>
          <TableCell align="right">Finalized</TableCell>
          <TableCell align="right" sx={{ width: 200 }}>
            %
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {activeData.length === 0 && (
          <TableRow>
            <TableCell colSpan={4}>No data</TableCell>
          </TableRow>
        )}
        {activeData.map((r, i) => (
          <TableRow key={i}>
            <TableCell>{i + 1}</TableCell>
            <TableCell>{r.name}</TableCell>
            <TableCell align="right">{r.finalized}</TableCell>
            <TableCell align="right">
              {r.percent}%
              <LinearProgress
                variant="determinate"
                value={r.percent}
                sx={{ height: 6, borderRadius: 6, ml: 1 }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default FinalizedHotspotsTable;
