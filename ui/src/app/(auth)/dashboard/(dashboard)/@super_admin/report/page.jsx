"use client"
import React, { useState } from 'react';
import {
    Card,
    Grid,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Box,
    Typography,
    Chip,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { MdDownload, MdSearch, MdRefresh } from 'react-icons/md';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from "@mui/x-date-pickers";
import {STATUS_COLORS} from "@/app/helpers/colors.js";
import {statusColors} from "@/app/helpers/constants.js";

const LeadReportFilters = () => {
    const [filters, setFilters] = useState({
        emirates: [],
        statuses: [],
        userIds: [],
        clientIds: [],
        startDate: null,
        endDate: null,
        reportType: 'all'
    });

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleChange = (field) => (event) => {
        setFilters(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleDateChange = (field) => (date) => {
        setFilters(prev => ({
            ...prev,
            [field]: date
        }));
    };

    const resetFilters = () => {
        setFilters({
            emirates: [],
            statuses: [],
            userIds: [],
            clientIds: [],
            startDate: null,
            endDate: null,
            reportType: 'all'
        });
        setReportData(null);
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_URL+'/admin/reports/lead-report', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filters),
            });
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async () => {
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_URL+'/admin/reports/lead-report/excel', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...filters, data: reportData }),
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lead-report.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Excel:', error);
        }
    };

    const downloadPDF = async () => {
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_URL+'/admin/reports/lead-report/pdf', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...filters, data: reportData }),
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lead-report.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
                  <Card sx={{ mb: 3, p: 3, boxShadow: 3 }}>
                      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'secondary.main' }}>
                          Lead Report Generator
                      </Typography>

                      <Grid container spacing={3}>

                          <Grid item xs={12} >
                              <Box sx={{ display: 'flex', gap: 2,flexDirection:{xs:"column",md:"row"} }}>
                                  <DatePicker
                                        label="Start Date"
                                        value={filters.startDate}
                                        onChange={handleDateChange('startDate')}
                                        slotProps={{ textField: { fullWidth: true } }}
                                  />
                                  <DatePicker
                                        label="End Date"
                                        value={filters.endDate}
                                        onChange={handleDateChange('endDate')}
                                        slotProps={{ textField: { fullWidth: true } }}
                                  />
                              </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                              <FormControl fullWidth>
                                  <InputLabel>Emirates</InputLabel>
                                  <Select
                                        multiple
                                        value={filters.emirates}
                                        onChange={handleChange('emirates')}
                                        label="Emirates"
                                        renderValue={(selected) => (
                                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                  {selected.map((value) => (
                                                        <Chip key={value} label={value} size="small" />
                                                  ))}
                                              </Box>
                                        )}
                                  >
                                      {['DUBAI', 'ABU_DHABI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH'].map((emirate) => (
                                            <MenuItem key={emirate} value={emirate}>
                                                {emirate}
                                            </MenuItem>
                                      ))}
                                  </Select>
                              </FormControl>
                          </Grid>

                          <Grid item xs={12} md={6}>
                              <FormControl fullWidth>
                                  <InputLabel>Status</InputLabel>
                                  <Select
                                        multiple
                                        value={filters.statuses}
                                        onChange={handleChange('statuses')}
                                        label="Status"
                                        renderValue={(selected) => (
                                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                  {selected.map((value) => (
                                                        <Chip key={value} label={value} size="small" />
                                                  ))}
                                              </Box>
                                        )}
                                  >
                                      {['NEW', 'IN_PROGRESS', 'INTERESTED', 'NEEDS_IDENTIFIED', 'NEGOTIATING', 'REJECTED', 'FINALIZED', 'CONVERTED', 'ON_HOLD'].map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                      ))}
                                  </Select>
                              </FormControl>
                          </Grid>

                          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                              <Button
                                    variant="outlined"
                                    startIcon={<MdRefresh />}
                                    onClick={resetFilters}
                              >
                                  Reset Filters
                              </Button>
                              <Button
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MdSearch />}
                                    onClick={fetchReportData}
                                    disabled={loading}
                              >
                                  Generate Report
                              </Button>
                          </Grid>
                      </Grid>
                  </Card>

                  {reportData && (
                        <>
                            <Card sx={{ mb: 3, p: 3, boxShadow: 3 }}>
                                <Typography variant="h6" sx={{ mb: 3, color: 'secondary.main' }}>Report Summary</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' ,bgcolor:"background.default"}}>
                                            <Typography variant="subtitle2" color="textSecondary">Total Leads</Typography>
                                            <Typography variant="h4" sx={{ mt: 1 }}>{reportData.summary.totalLeads}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center', height: '100%',bgcolor:"background.default"}}>
                                            <Typography variant="subtitle2" color="textSecondary">Total Value</Typography>
                                            <Typography variant="h4" sx={{ mt: 1 }}>${reportData.summary.totalValue.toLocaleString()}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' ,bgcolor:"background.default"}}>
                                            <Typography variant="subtitle2" color="textSecondary">Average Value</Typography>
                                            <Typography variant="h4" sx={{ mt: 1 }}>${reportData.summary.averageValue.toLocaleString()}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' ,bgcolor:"background.default"}}>
                                            <Typography variant="subtitle2" color="textSecondary">Total Discount</Typography>
                                            <Typography variant="h4" sx={{ mt: 1 }}>%{reportData.summary.totalDiscount}</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Card>

                            <Card sx={{ p: 3, boxShadow: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: 'secondary.main' }}>Detailed Report</Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                              variant="outlined"
                                              startIcon={<MdDownload />}
                                              onClick={downloadExcel}
                                        >
                                            Export as Excel
                                        </Button>
                                        {/*<Button*/}
                                        {/*      variant="outlined"*/}
                                        {/*      startIcon={<MdDownload />}*/}
                                        {/*      onClick={downloadPDF}*/}
                                        {/*>*/}
                                        {/*    Export as PDF*/}
                                        {/*</Button>*/}
                                    </Box>
                                </Box>

                                <TableContainer component={Paper} sx={{ maxHeight: 1200 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Client Name</TableCell>
                                                <TableCell>Phone</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Emirate</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell align="right">Price</TableCell>
                                                <TableCell align="right">Discount</TableCell>
                                                <TableCell align="right">Price without discount</TableCell>
                                                <TableCell>Created Date</TableCell>
                                                <TableCell>Assigned To</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reportData.leads
                                                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                  .map((lead, index) => (
                                                        <TableRow key={index} hover>
                                                            <TableCell>{lead.clientName}</TableCell>
                                                            <TableCell>{lead.clientPhone}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                      label={lead.status}
                                                                      size="small"
                                                                      sx={{
                                                                          bgcolor:lead.status === 'FINALIZED' ? statusColors.FINALIZED : STATUS_COLORS[lead.status]
                                                                      }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{lead.emirate}</TableCell>
                                                            <TableCell>{lead.type}</TableCell>
                                                            <TableCell align="right">${lead.averagePrice.toLocaleString()}</TableCell>
                                                            <TableCell align="right">%{lead.discount}</TableCell>
                                                            <TableCell align="right">${lead.priceWithOutDiscount.toLocaleString()}</TableCell>
                                                            <TableCell>{lead.createdAt}</TableCell>
                                                            <TableCell>{lead.assignedTo}</TableCell>
                                                        </TableRow>
                                                  ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                      component="div"
                                      count={reportData.leads.length}
                                      page={page}
                                      onPageChange={handleChangePage}
                                      rowsPerPage={rowsPerPage}
                                      onRowsPerPageChange={handleChangeRowsPerPage}
                                      rowsPerPageOptions={[ 25, 50,100,250]}
                                />
                            </Card>
                        </>
                  )}
              </Box>
          </LocalizationProvider>
    );
};

export default LeadReportFilters;