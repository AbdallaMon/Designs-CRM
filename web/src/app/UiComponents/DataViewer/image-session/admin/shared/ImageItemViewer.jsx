import { getData } from "@/app/helpers/functions/getData";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import { Alert, Box, Grid } from "@mui/material";
import { useEffect, useState } from "react";
import PaginationWithLimit from "../../../PaginationWithLimit";

export function ImageItemViewer({
  slug,
  item,
  filterComponent,
  createComponent,
  modelType,
  name,
  gridSize = { xs: 12, sm: 6, md: 4 },
  extra = {},
  withPagination,
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  async function fetchData() {
    const req = await getData({
      url: `admin/image-session/${slug}?${filter}&limit=${limit}&page=${page}&`,
      setLoading,
    });
    if (req.status === 200) {
      setData(req.data);
      if (withPagination) {
        setTotal(req.total);
        setTotalPages(req.totalPages);
      }
    }
  }
  useEffect(() => {
    fetchData();
  }, [filter, item, page, limit]);
  const Item = item;
  const FilterComponent = filterComponent ? filterComponent : null;
  const CreateComponent = createComponent ? createComponent : null;

  return (
    <Box sx={{ py: 3, px: 2, position: "relative" }}>
      {loading && <LoadingOverlay />}
      <Box
        display="flex"
        gap={1}
        alignItems="center"
        justifyContent="space-between"
      >
        {FilterComponent && (
          <FilterComponent filter={filter} setFilter={setFilter} />
        )}
        {CreateComponent && (
          <CreateComponent
            onUpdate={fetchData}
            modelType={modelType}
            slug={slug}
            name={name}
          />
        )}
      </Box>
      {withPagination && (
        <PaginationWithLimit
          limit={limit}
          page={page}
          setLimit={setLimit}
          setPage={setPage}
          total={total}
          totalPages={totalPages}
        />
      )}
      {!data || data?.length === 0 ? (
        <>
          <Alert severity="error" variant="outlined">
            There is no data to show
          </Alert>
        </>
      ) : (
        <Grid spacing={1} container>
          {data.map((item) => (
            <Grid key={item.id} size={gridSize}>
              <Item
                item={item}
                onUpdate={fetchData}
                modelType={modelType}
                slug={slug}
                name={name}
                {...extra}
              />
            </Grid>
          ))}
        </Grid>
      )}
      {withPagination && (
        <PaginationWithLimit
          limit={limit}
          page={page}
          setLimit={setLimit}
          setPage={setPage}
          total={total}
          totalPages={totalPages}
        />
      )}
    </Box>
  );
}
