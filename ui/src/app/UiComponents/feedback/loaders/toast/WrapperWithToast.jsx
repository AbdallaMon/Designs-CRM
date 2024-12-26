import "react-toastify/dist/ReactToastify.css";
import ToastContainerLocal from "@/app/UiComponents/feedback/loaders/toast/ToastContainerLocal";

export function WrapperWithToast({loading}) {
    return (
          <>
              {loading && (
                    <div
                          style={{
                              position: "fixed",
                              top: 0,
                              right: 0,
                              zIndex: 999999,
                              width: "100%",
                              height: "100%",
                              backgroundColor: "rgba(0, 0, 0, 0.5)",
                          }}
                    ></div>
              )}
              <ToastContainerLocal/>
          </>
    );
}
