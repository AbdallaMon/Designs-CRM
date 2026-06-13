import { useState, useEffect } from "react";
import { getDataAndSet } from "../functions/getDataAndSet";

export function useLanguage() {
  const [languages, setLanguages] = useState([]);
  const [loadingLngs, setLoadingLngs] = useState(false);

  async function getLangs() {
    await getDataAndSet({
      url: `client/languages`,
      setLoading: setLoadingLngs,
      setData: setLanguages,
    });
  }
  useEffect(() => {
    getLangs();
  }, []);
  return { languages, loadingLngs, setLanguages, setLoadingLngs };
}
