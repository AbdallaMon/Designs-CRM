const { setProgress, setOverlay } = useUploadContext();

const fileUpload = await uploadInChunks(
priceOffer.file,
setProgress,
setOverlay
);
if (fileUpload.status === 200) {
priceOffer.url = fileUpload.url;
}
