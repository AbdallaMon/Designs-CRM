"use client"
import React, { useState } from 'react';
import {
    Card,
    Grid,
    Button,
    Box,
    Typography,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination, FormControl, InputLabel, Select, Chip, MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { MdDownload, MdSearch, MdRefresh } from 'react-icons/md';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const StaffReportFilters = () => {
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
    });

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDateChange = (field) => (date) => {
        setFilters(prev => ({
            ...prev,
            [field]: date
        }));
    };


    const resetFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
        });
        setReportData(null);
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_URL+'/admin/reports/staff-report', {
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
            const response = await fetch(process.env.NEXT_PUBLIC_URL+'/admin/reports/staff-report/excel', {
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
            a.download = 'staff-report.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Excel:', error);
        }
    };

    const downloadPDF = async () => {
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_URL+'/admin/reports/staff-report/pdf', {
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
            a.download = 'staff-report.pdf';
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
                          Staff Performance Report
                      </Typography>

                      <Grid container spacing={3}>
                          <Grid item xs={12}>
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
                                <Typography variant="h6" sx={{ mb: 3, color: 'secondary.main' }}>Overall Summary</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center', height: '100%', bgcolor: "background.default" }}>
                                            <Typography variant="subtitle2" color="textSecondary">Total Staff</Typography>
                                            <Typography variant="h4" sx={{ mt: 1 }}>{reportData.summary.totalStaff}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center', height: '100%', bgcolor: "background.default" }}>
                                            <Typography variant="subtitle2" color="textSecondary">Total Revenue</Typography>
                                            <Typography variant="h4" sx={{ mt: 1 }}>{reportData.summary.totalRevenue.toLocaleString()} AED</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center', height: '100%', bgcolor: "background.default" }}>
                                            <Typography variant="subtitle2" color="textSecondary">Avg Success Rate</Typography>
                                            <Typography variant="h4" sx={{ mt: 1 }}>{reportData.summary.averageSuccessRate.toFixed(2)}%</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Paper sx={{ p: 2, textAlign: 'center', height: '100%', bgcolor: "background.default" }}>
                                            <Typography variant="subtitle2" color="textSecondary">Conversion Rate</Typography>
                                            <Typography variant="h4" sx={{ mt: 1 }}>
                                                {reportData.summary.conversionRate}%
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Card>

                            <Card sx={{ p: 3, boxShadow: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: 'secondary.main' }}>Staff Performance Details</Typography>
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

                                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Staff Name</TableCell>
                                                <TableCell align="right">Total Leads</TableCell>
                                                <TableCell align="right">Active Leads</TableCell>
                                                <TableCell align="right">Success Rate</TableCell>
                                                <TableCell align="right">Revenue</TableCell>
                                                <TableCell align="right">Total commission</TableCell>
                                                <TableCell align="right">Conversion Rate</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reportData.staffStats
                                                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                  .map((staff, index) => (
                                                        <TableRow key={index} hover>
                                                            <TableCell>{staff.staffName}</TableCell>
                                                            <TableCell align="right">{staff.totalLeads}</TableCell>
                                                            <TableCell align="right">{staff.activeLeads}</TableCell>
                                                            <TableCell align="right">{staff.successRate.toFixed(2)}%</TableCell>
                                                            <TableCell align="right">{staff.totalRevenue.toLocaleString()} AED</TableCell>
                                                            <TableCell align="right">{staff.totalCommission.toLocaleString()} AED</TableCell>
                                                            <TableCell align="right">
                                                                {staff.conversionRate}%
                                                            </TableCell>
                                                        </TableRow>
                                                  ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                      component="div"
                                      count={reportData.staffStats.length}
                                      page={page}
                                      onPageChange={handleChangePage}
                                      rowsPerPage={rowsPerPage}
                                      onRowsPerPageChange={handleChangeRowsPerPage}
                                      rowsPerPageOptions={[5, 10, 25, 50]}
                                />
                            </Card>
                        </>
                  )}
              </Box>
          </LocalizationProvider>
    );
};

export default StaffReportFilters;