"use client";

// <LessonEditor> — the nested content editor for ONE lesson inside the course editor. Composes
// the CRUD lists for the lesson's videos (each video nesting its own video-PDFs), PDFs and
// links, all on the reusable <CrudListSection> + the courses service. The homework requirement
// toggle (toggleLessonHomework) sits in the header. Every mutation routes through
// runCoursesMutation (CODE → Arabic toast). Gated on COURSE.MANAGE (canManage) at the call site.
// Arabic / RTL.

import { useState } from "react";
import { Box, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { coursesService } from "@/app/v2/features/courses/courses.service.js";
import { runCoursesMutation } from "@/app/v2/features/courses/courses.mutations.js";
import { SectionCard } from "@/app/v2/shared/components";
import { VIDEO_TYPE_OPTIONS } from "@/app/v2/features/courses/config/coursesConstants.js";
import { CrudListSection } from "./CrudListSection.jsx";

export function LessonEditor({ courseId, lesson, canManage }) {
  const lessonId = lesson.id;
  const [homework, setHomework] = useState(Boolean(lesson.mustUploadHomework));
  const [busy, setBusy] = useState(false);

  async function toggleHomework(next) {
    setHomework(next); // optimistic
    const res = await runCoursesMutation(
      () => coursesService.toggleLessonHomework(courseId, lessonId, next),
      { loading: "جاري تحديث إعداد الواجب...", setLoading: setBusy },
    );
    if (!res) setHomework(!next); // revert on failure
  }

  return (
    <Stack spacing={2}>
      {canManage && (
        <SectionCard title="إعدادات الدرس">
          <FormControlLabel
            control={
              <Switch checked={homework} onChange={(e) => toggleHomework(e.target.checked)} disabled={busy} />
            }
            label="يتطلّب رفع واجب لإكمال الدرس"
          />
        </SectionCard>
      )}

      {/* Videos — each row reveals its own nested video-PDF list. */}
      <CrudListSection
        title="الفيديوهات"
        canManage={canManage}
        deps={[courseId, lessonId]}
        fetchFn={() => coursesService.listVideos(courseId, lessonId)}
        addLabel="إضافة فيديو"
        emptyText="لا توجد فيديوهات"
        addFields={[
          { name: "url", label: "رابط الفيديو" },
          { name: "videoType", label: "نوع الفيديو", type: "select", options: VIDEO_TYPE_OPTIONS },
          { name: "order", label: "الترتيب", type: "number" },
        ]}
        onAdd={(form) =>
          runCoursesMutation(
            () =>
              coursesService.createVideo(courseId, lessonId, {
                url: form.url,
                videoType: form.videoType || undefined,
                order: form.order !== undefined && form.order !== "" ? Number(form.order) : undefined,
              }),
            { loading: "جاري إضافة الفيديو..." },
          )
        }
        onDelete={(item) =>
          runCoursesMutation(() => coursesService.deleteVideo(courseId, lessonId, item.id), {
            loading: "جاري حذف الفيديو...",
          })
        }
        renderRow={(video) => (
          <VideoRow courseId={courseId} lessonId={lessonId} video={video} canManage={canManage} />
        )}
      />

      {/* Lesson PDFs */}
      <CrudListSection
        title="الملفات (PDF)"
        canManage={canManage}
        deps={[courseId, lessonId]}
        fetchFn={() => coursesService.listPdfs(courseId, lessonId)}
        addLabel="إضافة ملف"
        emptyText="لا توجد ملفات"
        addFields={[
          { name: "url", label: "رابط الملف" },
          { name: "order", label: "الترتيب", type: "number" },
        ]}
        onAdd={(form) =>
          runCoursesMutation(
            () =>
              coursesService.createPdf(courseId, lessonId, {
                url: form.url,
                order: form.order !== undefined && form.order !== "" ? Number(form.order) : undefined,
              }),
            { loading: "جاري إضافة الملف..." },
          )
        }
        onDelete={(item) =>
          runCoursesMutation(() => coursesService.deletePdf(courseId, lessonId, item.id), {
            loading: "جاري حذف الملف...",
          })
        }
      />

      {/* Lesson links */}
      <CrudListSection
        title="الروابط"
        canManage={canManage}
        deps={[courseId, lessonId]}
        fetchFn={() => coursesService.listLinks(courseId, lessonId)}
        addLabel="إضافة رابط"
        emptyText="لا توجد روابط"
        addFields={[
          { name: "title", label: "عنوان الرابط" },
          { name: "url", label: "الرابط" },
          { name: "order", label: "الترتيب", type: "number" },
        ]}
        onAdd={(form) =>
          runCoursesMutation(
            () =>
              coursesService.createLink(courseId, lessonId, {
                title: form.title,
                url: form.url,
                order: form.order !== undefined && form.order !== "" ? Number(form.order) : undefined,
              }),
            { loading: "جاري إضافة الرابط..." },
          )
        }
        onDelete={(item) =>
          runCoursesMutation(() => coursesService.deleteLink(courseId, lessonId, item.id), {
            loading: "جاري حذف الرابط...",
          })
        }
        renderRow={(link) => (
          <Box>
            <Typography variant="body2">{link.title ?? "رابط"}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
              {link.url}
            </Typography>
          </Box>
        )}
      />
    </Stack>
  );
}

// One video row: the URL + a nested video-PDF CRUD list (title + url; create / delete only).
function VideoRow({ courseId, lessonId, video, canManage }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
        {video.url}
      </Typography>
      <Box sx={{ mt: 1 }}>
        <CrudListSection
          title="ملفات الفيديو"
          canManage={canManage}
          deps={[courseId, lessonId, video.id]}
          fetchFn={() => coursesService.listVideoPdfs(courseId, lessonId, video.id)}
          addLabel="إضافة ملف للفيديو"
          emptyText="لا توجد ملفات لهذا الفيديو"
          addFields={[
            { name: "title", label: "عنوان الملف" },
            { name: "url", label: "رابط الملف" },
          ]}
          onAdd={(form) =>
            runCoursesMutation(
              () =>
                coursesService.createVideoPdf(courseId, lessonId, video.id, {
                  title: form.title,
                  url: form.url,
                }),
              { loading: "جاري إضافة ملف الفيديو..." },
            )
          }
          onDelete={(item) =>
            runCoursesMutation(
              () => coursesService.deleteVideoPdf(courseId, lessonId, video.id, item.id),
              { loading: "جاري حذف ملف الفيديو..." },
            )
          }
        />
      </Box>
    </Box>
  );
}

export default LessonEditor;
