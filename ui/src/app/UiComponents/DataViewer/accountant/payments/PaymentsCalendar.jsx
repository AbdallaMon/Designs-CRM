"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid2,
  Modal,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  Link,
} from "@mui/material";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import { useSearchParams } from "next/navigation";
import { PaymentLevels, PaymentStatus } from "@/app/helpers/constants";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import ConfirmWithActionModel from "../../../models/ConfirmsWithActionModel";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import SearchComponent from "../../../formComponents/SearchComponent";
import { IncomeOutcomeSummary } from "../IncomeOutComeSummary";
import CreateModal from "../../../models/CreateModal";
import dayjs from "dayjs";
import {
  MdClose,
  MdCalendarToday,
  MdAttachMoney,
  MdReceipt,
} from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
// const inputs = [
//   {
//     data: { id: "amount", label: "Amount to be paid", type: "number" },
//     pattern: { required: { value: true, message: "Amount is required" } },
//   },
//   {
//     data: {
//       id: "issuedDate",
//       label: "Payment date",
//       type: "date",
//     },
//     pattern: { required: { value: true, message: "Date is required" } },
//   },
//   {
//     data: {
//       id: "file",
//       label: "Attatchment",
//       type: "file",
//     },
//     pattern: { required: { value: true, message: "Attatchment is required" } },
//   },
//   {
//     data: { id: "paymentId", key: "id", type: "number" },
//     sx: { display: "none" },
//   },
// ];

const columns = [
  { name: "id", label: "Payment number" },
  { name: "clientLead.client.name", label: "Client name" },
  { name: "clientLead.client.phone", label: "Client phone" },
  { name: "clientLead.description", label: "Description" },
  { name: "clientLead.averagePrice", label: "Price" },
  { name: "paymentReason", label: "Payment reason" },
  { name: "amount", label: "Amount" },
  { name: "amountPaid", label: "Amount paid" },
  {
    name: "paymentLevel",
    label: "Payment level",
    type: "enum",
    enum: PaymentLevels,
  },
  {
    name: "status",
    label: "Payment status",
    type: "enum",
    enum: PaymentStatus,
  },
];

const PaymentCalendar = ({ status = "PENDING" }) => {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const {
    data,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    setFilters,
  } = useDataFetcher(`accountant/payments?paymentId=${paymentId}&`, false, {
    status: status,
  });
  // const [status, setStatus] = useState("PENDING");
  // const [paymentLevel, setPaymentLevel] = useState("ALL");
  const { setLoading } = useToastContext();
  const handleResetFilter = () => {
    window.location.href = window.location.pathname;
  };
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setFilters({ status: event.target.value });
  };
  const handlePaymentLevel = (event) => {
    setPaymentLevel(event.target.value);
    setFilters({ level: event.target.value });
  };

  function handleAfterEdit(newData) {
    const newPayments = data.map((payment) => {
      if (payment.id === newData.id) {
        payment.amountPaid = newData.amountPaid;
        payment.status = newData.status;
        payment.paymentLevel = newData.paymentLevel;
      }
      return payment;
    });
    setData(newPayments);
  }
  async function overDuePayment(id) {
    const request = await handleRequestSubmit(
      {},
      setLoading,
      `accountant/payments/overdue/${id}`,
      false,
      "Marking as over due"
    );
    if (request.status === 200) {
      const newPayments = data.map((payment) => {
        if (payment.id === id) {
          payment.status = "OVERDUE";
        }
        return payment;
      });
      setData(newPayments);
    }
  }
  return (
    <Container maxWidth="xxl" px={{ xs: 2, md: 4 }}>
      <IncomeOutcomeSummary />

      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Button variant="outlined" onClick={handleResetFilter}>
          Reset filter
        </Button>
        <Grid2 spacing={2} container sx={{ flex: 1, maxWidth: "1200px" }}>
          <Grid2 size={4}>
            <SearchComponent
              apiEndpoint="search?model=client"
              setFilters={setFilters}
              inputLabel="Search client by name or phone"
              renderKeys={["name", "phone"]}
              mainKey="name"
              searchKey={"clientId"}
              withParamsChange={true}
            />
          </Grid2>
          {/* <Grid2 size={4}>
            <FormControl fullWidth={true}>
              <InputLabel id="status">Status</InputLabel>
              <Select
                value={status}
                onChange={handleStatusChange}
                labelId="status"
                label="Status"
                displayEmpty
                inputProps={{ "aria-label": "Filter by status" }}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="FULLY_PAID">Paid</MenuItem>
                <MenuItem value="OVERDUE">Over rude</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
          <Grid2 size={4}>
            <FormControl fullWidth={true}>
              <InputLabel id="paymentLevel">Payment level</InputLabel>
              <Select
                value={paymentLevel}
                onChange={handlePaymentLevel}
                labelId="paymentLevel"
                label="Payment level"
                displayEmpty
                inputProps={{ "aria-label": "Filter by status" }}
              >
                <MenuItem value="ALL">All</MenuItem>
                {Object.keys(PaymentLevels).map((key) => (
                  <MenuItem key={key} value={key}>
                    {PaymentLevels[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid2> */}
        </Grid2>
      </Box>
      <AdminTable
        data={data}
        columns={columns}
        loading={loading}
        limit={limit}
        page={page}
        total={total}
        setPage={setPage}
        setLimit={setLimit}
        setTotal={setTotal}
        setData={setData}
        totalPages={totalPages}
        extraComponent={({ item }) => (
          <>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <PaymentHistoryModal payment={item} />

              <Button
                component={Link}
                href={"/dashboard/deals/" + item.clientLead.id}
              >
                View Details
              </Button>
            </Box>
          </>
        )}
      />
    </Container>
  );
};

export const PaymentHistoryModal = ({ payment }) => {
  const [open, setOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  useEffect(() => {
    async function getInvoices() {
      const request = await getData({
        url: `accountant/payments/${payment.id}/invoices`,
        setLoading,
      });
      if (request.status === 200) {
        console.log(request.data, "req.data");
        setInvoices(request.data);
      }
    }
    if (open) {
      getInvoices();
    }
  }, [open]);

  return (
    <>
      <Button
        variant="contained"
        onClick={handleOpen}
        startIcon={<MdReceipt />}
        sx={{
          borderRadius: 1.5,
          textTransform: "none",
          fontWeight: 500,
        }}
      >
        View History
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="payment-history-modal"
      >
        <Paper
          elevation={6}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 450, md: 550 },
            maxHeight: "80vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 3,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 2.5,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              Payment History
            </Typography>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{ color: "white" }}
              aria-label="close"
            >
              <MdClose />
            </IconButton>
          </Box>

          {/* Body */}
          <Box sx={{ p: 0, maxHeight: "60vh", overflow: "auto" }}>
            {loading ? (
              <CircularProgress />
            ) : invoices && invoices.length > 0 ? (
              <List sx={{ pt: 0 }}>
                {invoices.map((invoice, index) => (
                  <React.Fragment key={invoice.id || index}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        py: 2,
                        px: 3,
                        transition: "background-color 0.2s",
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <Box sx={{ width: "100%" }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            Invoice #{invoice.invoiceNumber}
                          </Typography>
                          {invoice.notes?.length > 0 &&
                            invoice.notes[0].attachment && (
                              <Button
                                component={Link}
                                target="_blank"
                                href={invoice.notes[0].attachment}
                              >
                                View attatchment
                              </Button>
                            )}
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 0.5,
                            color: "text.secondary",
                          }}
                        >
                          <MdCalendarToday
                            size={16}
                            style={{ marginRight: 8 }}
                          />
                          <Typography variant="body2">
                            {dayjs(invoice.issuedDate).format("MMMM D, YYYY")}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            color: "text.secondary",
                          }}
                        >
                          <MdAttachMoney size={16} style={{ marginRight: 8 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            ${parseFloat(invoice.amount).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < payment.invoices.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="textSecondary">
                  No payment history available.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Modal>
    </>
  );
};

export default PaymentCalendar;
