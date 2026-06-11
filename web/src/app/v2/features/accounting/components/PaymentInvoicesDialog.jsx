"use client";

// Payment invoices history dialog — v2 port of the legacy PaymentHistoryModal
// (inside accountant/payments/PaymentsCalendar.jsx). Fetches
// GET /v2/accounting/payments/:paymentId/invoices → { items } (§5c: nested under data.items).
// Gated on PAYMENT_LIST (× capabilities.canViewInvoices). Read-only.

import { Fragment, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import { MdReceipt, MdCalendarToday, MdAttachMoney } from "react-icons/md";
import dayjs from "dayjs";
import { accountingService } from "../accounting.service.js";
import { formatCurrency } from "../config/accountingConstants.js";

export function PaymentInvoicesDialog({ paymentId }) {
  const [open, setOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    accountingService
      .listInvoices(paymentId)
      .then((res) => {
        if (active) setInvoices(Array.isArray(res?.data?.items) ? res.data.items : []);
      })
      .catch(() => {
        if (active) setInvoices([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, paymentId]);

  return (
    <>
      <Button variant="contained" size="small" startIcon={<MdReceipt />} onClick={() => setOpen(true)}>
        سجل الفواتير
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>سجل الفواتير</DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : invoices.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              لا يوجد سجل فواتير
            </Typography>
          ) : (
            <List>
              {invoices.map((invoice, index) => (
                <Fragment key={invoice.invoiceNumber ?? index}>
                  <ListItem alignItems="flex-start" sx={{ flexDirection: "column", gap: 0.5 }}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        فاتورة #{invoice.invoiceNumber}
                      </Typography>
                      {invoice.notes?.[0]?.attachment && (
                        <MuiLink href={invoice.notes[0].attachment} target="_blank" rel="noreferrer">
                          عرض المرفق
                        </MuiLink>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
                      <MdCalendarToday size={16} style={{ marginInlineEnd: 8 }} />
                      <Typography variant="body2">
                        {dayjs(invoice.issuedDate).format("YYYY/MM/DD")}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
                      <MdAttachMoney size={16} style={{ marginInlineEnd: 8 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(invoice.amount)}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < invoices.length - 1 && <Divider />}
                </Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PaymentInvoicesDialog;
