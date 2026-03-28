// ايه هو؟ كلاس Error مخصص يحمل statusCode و details إضافية.
// ليه؟ عشان نفرّق بين أخطاء متوقعة (مستخدم بعت بيانات غلط) وأخطاء غير متوقعة (الداتابيز وقعت).
// لو مافيش AppError: هتضطر تعمل res.status(400) في كل مكان بدل throw.
export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
