"use client";
import { useEffect, useState } from "react";
import { initialPageLimit } from "@/app/helpers/constants";
import { getData } from "@/app/helpers/functions/getData";

export default function useDataFetcher(url, noArr, initialFilters = {}) {
  const [data, setData] = useState(noArr ? null : []);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialPageLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({});
  const [printMode, setPrintMode] = useState(false);
  const [render, setRender] = useState(false);
  const [others, setOthers] = useState(""); //add this line
  const [error, setError] = useState(null);
  const [extraData, setExtraData] = useState(null); //add this line
  useEffect(() => {
    async function fetchData() {
      if (printMode) return;
      const res = await getData({
        url,
        setLoading,
        page,
        limit,
        filters,
        search,
        sort,
        others,
      });
      if (res) {
        if (res.status !== 200) {
          setError(res.message);
        } else {
          setData(res.data);
          setTotalPages(res.totalPages);
          setTotal(res.total);
          setExtraData(res.extraData);
          setError(null);
        }
      }
    }

    fetchData();
  }, [page, limit, filters, search, sort, render, others]);

  return {
    data,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    filters,
    setFilters,
    setSearch,
    search,
    setSort,
    total,
    setTotal,
    setPrintMode,
    setTotalPages,
    setRender,
    setOthers,
    others,
    error,
    setError,
    extraData,
    setExtraData,
  };
}
