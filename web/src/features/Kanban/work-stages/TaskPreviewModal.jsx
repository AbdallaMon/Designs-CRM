import React from "react";
import { Dialog, DialogContent } from "@mui/material";
import TaskDetails from "@/features/tasks/TaskDetails";

// Task Preview Modal Component
const TaskPreviewModal = ({ open, onClose, task, isModification = false }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        {open && (
          <TaskDetails
            id={task?.id}
            type={isModification ? "MODIFICATION" : "PROJECT"}
            showBackButton={false}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskPreviewModal;
