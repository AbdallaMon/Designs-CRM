import {ToastContainer} from "react-toastify";

export default function ToastContainerLocal() {
    return (
          <ToastContainer
                position="top-center"
                style={{width: "80%", maxWidth: "600px", zIndex: 999999}}
                closeOnClick={true}
                pauseOnFocusLoss={false}
                autoClose={3000}
          />
    );
}
