export const getEmbedUrlWithParams = (url) => {
  // Only process YouTube embeds
  if (url.includes("youtube.com/embed/")) {
    const hasParams = url.includes("?");
    const extraParams = "rel=0&modestbranding=1";
    return hasParams ? `${url}&${extraParams}` : `${url}?${extraParams}`;
  }

  // If it's not a YouTube embed, return as is
  return url;
};
