import React from "react";
import {
  alpha,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Backdrop,
  Paper,
  Button,
  Link,
  Typography,
  useTheme,
} from "@mui/material";
import EditModal from "@/app/UiComponents/models/EditModal";
import DeleteModal from "@/app/UiComponents/models/DeleteModal";
import PaginationWithLimit from "@/app/UiComponents/DataViewer/PaginationWithLimit";
import { getPropertyValue } from "@/app/helpers/functions/utility";

const DocumentRenderer = ({ value }) => {
  if (!value) return null;
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(value);
  const isPDF = /\.pdf$/i.test(value);
  if (isImage) {
    return (
      <img
        src={value}
        alt="Document"
        style={{ maxWidth: "100px", maxHeight: "80px", borderRadius: 8 }}
      />
    );
  }
  if (isPDF) {
    return (
      <Button
        size="small"
        variant="outlined"
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ textTransform: "none", borderRadius: 2 }}
      >
        View file
      </Button>
    );
  }

  return null;
};

export default function AdminTable({
  data,
  columns,
  page,
  setPage,
  limit,
  setLimit,
  total,
  setData,
  inputs,
  loading,
  withEdit,
  editHref,
  withDelete,
  deleteHref,
  withArchive,
  archiveHref,
  extraComponent,
  extraEditParams,
  extraComponentProps,
  setTotal,
  noPagination = false,
  checkChanges,
  editButtonText = "Edit", // Default value is "Edit"
  handleAfterEdit,
  totalPages,
  handleBeforeSubmit,
  renderFormTitle,
  editFormButton,
  children,
  rowSx,
}) {
  const ExtraComponent = extraComponent;
  const theme = useTheme();

  // Header-cell styling shared by every column / action header.
  const headSx = {
    fontWeight: 700,
    fontSize: "0.72rem",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "text.secondary",
    whiteSpace: "nowrap",
    borderBottom: `1px solid ${theme.palette.divider}`,
    bgcolor: alpha(theme.palette.primary.main, 0.06),
    py: 1.5,
    px: 2.25,
  };
  const cellSx = { px: 2.25, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` };

  const actionColumns =
    (withEdit ? 1 : 0) +
    (withDelete ? 1 : 0) +
    (withArchive ? 1 : 0) +
    (ExtraComponent ? 1 : 0);
  const colSpan = (columns?.length || 0) + actionColumns;
  const isEmpty = !loading && (!data || data.length === 0);

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflowX: "auto",
        }}
      >
        {children && (
          <Box
            sx={{
              display: "flex",
              width: "100%",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
              p: { xs: 1.5, md: 2 },
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.default, 0.5),
            }}
          >
            {children}
          </Box>
        )}

        <Table sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.name} sx={headSx}>
                  {column.label}
                </TableCell>
              ))}
              {withEdit && <TableCell sx={headSx}>{editButtonText}</TableCell>}
              {withDelete && <TableCell sx={headSx}>Delete</TableCell>}
              {withArchive && <TableCell sx={headSx}>Archive</TableCell>}
              {ExtraComponent && <TableCell sx={headSx}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isEmpty && (
              <TableRow>
                <TableCell colSpan={colSpan || 1} sx={{ borderBottom: "none" }}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      No records to display
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {data?.map((item, index) => (
              <TableRow
                key={item.id}
                sx={{
                  backgroundColor:
                    index % 2 === 0
                      ? "background.paper"
                      : alpha(theme.palette.background.default, 0.5),
                  transition: "background-color .15s ease",
                  "&:hover": { backgroundColor: theme.palette.action.hover },
                  "&:last-of-type td": { borderBottom: "none" },
                  ...(rowSx && typeof rowSx === "function" ? rowSx(item) : {}),
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.name} sx={cellSx}>
                    {column.type === "document" ? (
                      <DocumentRenderer
                        value={getPropertyValue(
                          item,
                          column.name,
                          column.enum,
                          column.type
                        )}
                      />
                    ) : column.type === "href" && column.linkCondition ? (
                      <Link href={column.linkCondition(item)}>
                        {getPropertyValue(
                          item,
                          column.name,
                          column.enum,
                          column.type,
                          null
                        )}
                      </Link>
                    ) : column.type === "function" ? (
                      <>{column.render(item)}</>
                    ) : (
                      getPropertyValue(
                        item,
                        column.name,
                        column.enum,
                        column.type,
                        null
                      )
                    )}
                  </TableCell>
                ))}
                {withEdit && (
                  <TableCell sx={cellSx}>
                    <EditModal
                      editButtonText={editButtonText}
                      item={item}
                      inputs={inputs}
                      setData={setData}
                      href={editHref}
                      handleBeforeSubmit={handleBeforeSubmit}
                      checkChanges={checkChanges}
                      extraEditParams={extraEditParams}
                      renderFormTitle={renderFormTitle}
                      editFormButton={editFormButton}
                      handleAfterEdit={handleAfterEdit}
                    />
                  </TableCell>
                )}
                {withDelete && (
                  <TableCell sx={cellSx}>
                    <DeleteModal
                      item={item}
                      setData={setData}
                      href={deleteHref}
                      setTotal={setTotal}
                    />
                  </TableCell>
                )}
                {withArchive && (
                  <TableCell sx={cellSx}>
                    <DeleteModal
                      item={item}
                      setData={setData}
                      href={archiveHref}
                      setTotal={setTotal}
                      archive={true}
                    />
                  </TableCell>
                )}
                {ExtraComponent && (
                  <TableCell sx={cellSx}>
                    <ExtraComponent
                      item={item}
                      setData={setData}
                      {...extraComponentProps}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!noPagination && (
          <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
            <PaginationWithLimit
              total={total}
              limit={limit}
              page={page}
              setLimit={setLimit}
              setPage={setPage}
              totalPages={totalPages}
            />
          </Box>
        )}
      </TableContainer>

      <Backdrop sx={{ color: "#fff", zIndex: 6000000 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
