import React from "react";
import {
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
        style={{ maxWidth: "100px", maxHeight: "80px" }}
      />
    );
  }
  if (isPDF) {
    return (
      <Button href={value} target="_blank" rel="noopener noreferrer">
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
  return (
    <Box sx={{ padding: "16px" }}>
      <>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: "16px", boxShadow: theme.shadows[3] }}
        >
          <Box
            sx={{
              background: theme.palette.background.default,
            }}
          >
            <Box
              display="flex"
              width="100%"
              gap={2}
              flexWrap="wrap"
              alignItems="center"
              sx={{
                p: { xs: 1.5, md: 2 },
              }}
            >
              {children}
            </Box>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.name}
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {withEdit && (
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    {editButtonText}
                  </TableCell>
                )}
                {withDelete && (
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    Delete
                  </TableCell>
                )}
                {withArchive && (
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    Archive
                  </TableCell>
                )}
                {ExtraComponent && (
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((item, index) => (
                <TableRow
                  key={item.id}
                  sx={{
                    backgroundColor:
                      index % 2 === 0
                        ? theme.palette.background.paper
                        : theme.palette.background.default,
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                    ...(rowSx && typeof rowSx === "function"
                      ? rowSx(item)
                      : {}),
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.name}
                      sx={{
                        px: 2.5,
                        py: 3,
                      }}
                    >
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
                        <>
                          <Link href={column.linkCondition(item)}>
                            {getPropertyValue(
                              item,
                              column.name,
                              column.enum,
                              column.type,
                              null
                            )}
                          </Link>
                        </>
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
                    <TableCell
                      sx={{
                        px: 2.5,
                        py: 3,
                      }}
                    >
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
                      />{" "}
                    </TableCell>
                  )}
                  {withDelete && (
                    <>
                      <TableCell
                        sx={{
                          px: 2.5,
                          py: 3,
                        }}
                      >
                        <DeleteModal
                          item={item}
                          setData={setData}
                          href={deleteHref}
                          setTotal={setTotal}
                        />
                      </TableCell>
                    </>
                  )}
                  {withArchive && (
                    <TableCell
                      sx={{
                        px: 2.5,
                        py: 3,
                      }}
                    >
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
                    <TableCell
                      sx={{
                        px: 2.5,
                        py: 3,
                      }}
                    >
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
            <PaginationWithLimit
              total={total}
              limit={limit}
              page={page}
              setLimit={setLimit}
              setPage={setPage}
              totalPages={totalPages}
            />
          )}
        </TableContainer>
      </>

      <Backdrop sx={{ color: "#fff", zIndex: 6000000 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
