"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Stack,
  Paper,
  Typography,
  LinearProgress,
  ClickAwayListener,
  Divider,
  Collapse,
} from "@mui/material";
import {
  FaPaperPlane,
  FaPaperclip,
  FaSmile,
  FaTimes,
  FaMicrophone,
  FaStop,
  FaTrash,
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { FILE_UPLOAD_LIMITS } from "../../config/chatConstants.js";
import { useUpload } from "@/app/v2/hooks/useUpload";

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function WaveBars({ active }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        gap: 0.5,
        height: 18,
        px: 0.5,
        "@keyframes wave": {
          "0%": { transform: "scaleY(0.35)", opacity: 0.5 },
          "50%": { transform: "scaleY(1)", opacity: 1 },
          "100%": { transform: "scaleY(0.35)", opacity: 0.5 },
        },
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            width: 3,
            borderRadius: 2,
            bgcolor: "error.main",
            height: 18,
            transformOrigin: "bottom",
            animation: active ? "wave 0.9s ease-in-out infinite" : "none",
            animationDelay: `${i * 0.12}s`,
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </Box>
  );
}

function RecordingBar({ status, seconds, audioUrl, onStop, onCancel, onSend, sending, uploadProgress, error }) {
  const isRecording = status === "recording";
  const isRecorded = status === "recorded";
  return (
    <Paper sx={{ p: 1.25, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "error.main",
              boxShadow: isRecording ? "0 0 0 6px rgba(211,47,47,0.18)" : "none",
            }}
          />
          <WaveBars active={isRecording} />
          <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 60 }}>
            {formatTime(seconds)}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Tooltip title="إلغاء" arrow>
            <span>
              <IconButton size="small" onClick={onCancel} disabled={sending}>
                <FaTrash size={16} />
              </IconButton>
            </span>
          </Tooltip>
          {isRecording ? (
            <Tooltip title="إيقاف" arrow>
              <span>
                <IconButton size="small" onClick={onStop} disabled={sending} color="error">
                  <FaStop size={16} />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="إرسال الصوت" arrow>
              <span>
                <IconButton size="small" onClick={onSend} disabled={sending} color="primary">
                  {sending ? <CircularProgress size={18} /> : <FaPaperPlane size={16} />}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      {isRecorded && audioUrl && (
        <Box sx={{ mt: 1 }}>
          <audio controls src={audioUrl} style={{ width: "100%" }} />
        </Box>
      )}
      {typeof uploadProgress === "number" && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 4, borderRadius: 2 }} />
          <Typography variant="caption" color="textSecondary">{uploadProgress}%</Typography>
        </Box>
      )}
      {error && (
        <Paper sx={{ mt: 1, p: 1, bgcolor: "error.lighter", color: "error.main" }}>
          <Typography variant="caption">{error}</Typography>
        </Paper>
      )}
    </Paper>
  );
}

export function ChatInput({
  onSendMessage,
  onReplyingTo = null,
  onCancelReply = () => {},
  loading = false,
  disabled = false,
  onTyping = () => {},
  room,
  inputRef,
}) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [isSending, setIsSending] = useState(false);

  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceUploadProgress, setVoiceUploadProgress] = useState(null);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // v2 chunked upload — replaces legacy uploadInChunks.
  const voiceUploader = useUpload({});
  const fileUploader = useUpload({});

  const hasText = useMemo(() => Boolean(message.trim()), [message]);
  const hasFiles = useMemo(() => selectedFiles.length > 0, [selectedFiles]);
  const canUseVoice = useMemo(() => !hasText && !hasFiles, [hasText, hasFiles]);
  const isInputDisabled = !room?.isChatEnabled || disabled || loading || isSending;
  const isVoiceMode = voiceStatus === "recording" || voiceStatus === "recorded";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (voiceUrl) URL.revokeObjectURL(voiceUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!emojiOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && setEmojiOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [emojiOpen]);

  const toggleEmojiPicker = () => {
    setEmojiOpen((prev) => !prev);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const closeEmojiPicker = () => setEmojiOpen(false);
  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + (emojiData?.emoji || ""));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cleanupVoice = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
    setVoiceSeconds(0);
    setVoiceBlob(null);
    setVoiceError("");
    setVoiceUploadProgress(null);
    if (voiceUrl) {
      URL.revokeObjectURL(voiceUrl);
      setVoiceUrl("");
    }
  };

  const startRecording = async () => {
    if (!canUseVoice || isInputDisabled) return;
    setVoiceError("");
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setVoiceError("تسجيل الصوت غير مدعوم في هذا المتصفح.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"];
      const mimeType = preferred.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data?.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
        setVoiceStatus("recorded");
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      setVoiceStatus("recording");
      setVoiceSeconds(0);
      timerRef.current = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
      recorder.start();
    } catch {
      setVoiceError("تم رفض إذن الميكروفون أو غير متاح.");
      cleanupVoice();
      setVoiceStatus("idle");
    }
  };

  const stopRecording = () => {
    if (voiceStatus !== "recording") return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try { recorder.stop(); } catch {
        setVoiceError("فشل إيقاف التسجيل.");
        cleanupVoice();
        setVoiceStatus("idle");
      }
    }
  };

  const cancelRecording = () => {
    cleanupVoice();
    setVoiceStatus("idle");
  };

  const sendVoice = async () => {
    if (voiceStatus !== "recorded" || !voiceBlob) return;
    setIsSending(true);
    setVoiceError("");
    setVoiceUploadProgress(0);
    try {
      const ext = voiceBlob.type.includes("ogg") ? "ogg" : "webm";
      const file = new File([voiceBlob], `voice-${Date.now()}.${ext}`, {
        type: voiceBlob.type || "audio/webm",
      });
      const uploadRes = await voiceUploader.uploadAsChunk({ file, withThumbnail: false });
      if (uploadRes?.status === 200) {
        await onSendMessage(null, {
          attachments: [
            { fileName: file.name, fileMimeType: file.type, fileUrl: uploadRes.url, fileSize: file.size },
          ],
        });
        cancelRecording();
      } else {
        setVoiceError("فشل رفع الرسالة الصوتية.");
      }
    } catch {
      setVoiceError("فشل إرسال الرسالة الصوتية.");
    } finally {
      setIsSending(false);
      setVoiceUploadProgress(null);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    setIsSending(true);
    const attachments = [];
    try {
      if (selectedFiles.length > 0) {
        for (const fileObj of selectedFiles) {
          const { file, id, text } = fileObj;
          setUploadingFiles((prev) => ({ ...prev, [id]: 0 }));
          const up = await fileUploader.uploadAsChunk({ file, withThumbnail: true });
          if (up?.status === 200) {
            attachments.push({
              fileName: file.name,
              fileMimeType: file.type,
              fileUrl: up.url,
              thumbnailUrl: up.thumbnailUrl,
              content: text,
              fileSize: file.size,
            });
          } else {
            setFileError(`فشل رفع ${file.name}`);
          }
          setUploadingFiles((prev) => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
        }
        setSelectedFiles([]);
        setFileError("");
        await onSendMessage(message?.length ? message : null, { attachments });
      } else {
        await onSendMessage(message);
      }
    } catch {
      setFileError("فشل إرسال الرسالة");
    } finally {
      setIsSending(false);
      setMessage("");
      setEmojiOpen(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (!files) return;
    setFileError("");
    const newFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > FILE_UPLOAD_LIMITS.MAX_SIZE) {
        setFileError(`الملف "${file.name}" يتجاوز الحد المسموح`);
        continue;
      }
      if (!FILE_UPLOAD_LIMITS.ALLOWED_TYPES.includes(file.type)) {
        setFileError(`نوع الملف "${file.type}" غير مسموح`);
        continue;
      }
      newFiles.push({ id: `${Date.now()}-${i}`, file, text: "" });
    }
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (fileId) => setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  const updateFileText = (fileId, text) =>
    setSelectedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, text } : f)));

  const handleMessageChange = (e) => {
    const v = e.target.value;
    setMessage(v);
    if (onTyping && v.length > 0) onTyping();
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {onReplyingTo && (
        <Paper sx={{ p: 1.5, bgcolor: "info.lighter", border: "1px solid", borderColor: "info.light", borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                رد على {onReplyingTo.sender?.name}
              </Typography>
              <Typography variant="body2">
                {onReplyingTo.content?.substring(0, 50)}
                {onReplyingTo.content?.length > 50 ? "..." : ""}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onCancelReply}>
              <FaTimes size={14} />
            </IconButton>
          </Stack>
        </Paper>
      )}

      {!isVoiceMode && selectedFiles.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxHeight: 240, overflowY: "auto" }}>
          {selectedFiles.map((fileObj) => (
            <Paper key={fileObj.id} sx={{ p: 1.5, bgcolor: "info.lighter", border: "1px solid", borderColor: "info.light", borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" gap={1.5}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>📎 {fileObj.file.name}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1 }}>
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} ميجابايت
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={2}
                    size="small"
                    placeholder="نص اختياري لهذا الملف..."
                    value={fileObj.text}
                    onChange={(e) => updateFileText(fileObj.id, e.target.value)}
                    disabled={isSending}
                    variant="standard"
                    sx={{ mb: uploadingFiles[fileObj.id] ? 1 : 0 }}
                  />
                  {uploadingFiles[fileObj.id] !== undefined && (
                    <Stack gap={0.5}>
                      <LinearProgress variant="determinate" value={uploadingFiles[fileObj.id]} sx={{ height: 4, borderRadius: 2 }} />
                      <Typography variant="caption" color="textSecondary">{uploadingFiles[fileObj.id]}%</Typography>
                    </Stack>
                  )}
                </Box>
                <IconButton
                  size="small"
                  onClick={() => removeFile(fileObj.id)}
                  disabled={isSending || uploadingFiles[fileObj.id] !== undefined}
                >
                  <FaTimes size={14} />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Box>
      )}

      {fileError && !isVoiceMode && (
        <Paper sx={{ p: 1, bgcolor: "error.lighter", color: "error.main" }}>
          <Typography variant="caption">{fileError}</Typography>
        </Paper>
      )}

      {isVoiceMode ? (
        <RecordingBar
          status={voiceStatus}
          seconds={voiceSeconds}
          audioUrl={voiceUrl}
          onStop={stopRecording}
          onCancel={cancelRecording}
          onSend={sendVoice}
          sending={isSending || loading}
          uploadProgress={voiceUploadProgress}
          error={voiceError}
        />
      ) : (
        <ClickAwayListener onClickAway={closeEmojiPicker}>
          <Box>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="اكتب رسالة... (Shift+Enter لسطر جديد)"
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              disabled={isInputDisabled}
              variant="outlined"
              size="small"
              inputRef={inputRef}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: emojiOpen ? "12px 12px 0 0" : 3 } }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {room?.allowFiles && (
                          <Tooltip title="إرفاق ملفات" arrow>
                            <span>
                              <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={isInputDisabled}>
                                <FaPaperclip size={18} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="رمز تعبيري" arrow>
                          <span>
                            <IconButton size="small" onClick={toggleEmojiPicker} disabled={isInputDisabled}>
                              <FaSmile size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {canUseVoice ? (
                          <Tooltip title="تسجيل صوتي" arrow>
                            <span>
                              <IconButton size="small" onClick={startRecording} disabled={isInputDisabled} color="primary">
                                <FaMicrophone size={18} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title="إرسال" arrow>
                            <span>
                              <IconButton
                                size="small"
                                onClick={handleSendMessage}
                                disabled={isInputDisabled || (!message.trim() && selectedFiles.length === 0)}
                                color="primary"
                              >
                                {loading || isSending ? <CircularProgress size={20} /> : <FaPaperPlane size={18} />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Collapse in={emojiOpen} unmountOnExit>
              <Paper elevation={0} sx={{ border: "1px solid", borderTop: "none", borderColor: "divider", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 0.75, bgcolor: "background.paper" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>الرموز التعبيرية</Typography>
                  <IconButton size="small" onClick={closeEmojiPicker}>
                    <FaTimes size={14} />
                  </IconButton>
                </Stack>
                <Divider />
                <Box sx={{ height: { xs: 400, sm: 420, md: 500 }, maxHeight: "60vh", minHeight: 240, p: 0.5, overflow: "hidden" }}>
                  <EmojiPicker onEmojiClick={handleEmojiClick} height="100%" width="100%" />
                </Box>
              </Paper>
            </Collapse>
          </Box>
        </ClickAwayListener>
      )}

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={handleFileSelect}
        accept={FILE_UPLOAD_LIMITS.ALLOWED_TYPES.join(",")}
      />
    </Box>
  );
}
