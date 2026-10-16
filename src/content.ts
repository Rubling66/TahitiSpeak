/**
 * Content contract.
 * A lesson is the record this app stores. The fields live on Lesson.
 */

export type { Lesson, LessonLevel, LessonSection } from "./types";

export const CONTENT = ["Lesson"] as const;
