import { getData } from "@/app/helpers/functions/getData";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import { Alert, Box, Grid2 as Grid } from "@mui/material";
import { useEffect, useState } from "react";

export function ImageItemViewer({
  model,
  slug,
  item,
  filterComponent,
  createComponent,
  gridSize = { xs: 12, sm: 6, md: 4 },
  extra = {},
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState(null);
  async function fetchData() {
    const req = await getData({
      url: `admin/image-session/${slug}?${filter}&`,
      setLoading,
    });
    if (req.status === 200) {
      setData(req.data);
    }
  }
  useEffect(() => {
    fetchData();
  }, [filter, item]);
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
        {CreateComponent && <CreateComponent onUpdate={fetchData} />}
      </Box>
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
              <Item item={item} onUpdate={fetchData} {...extra} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
