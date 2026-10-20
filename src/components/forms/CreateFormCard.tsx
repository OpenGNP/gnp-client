import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Circle, Type } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";

import type { FormEditorModel } from "../../hooks/useFormEditorModel";
import { AddQuestionButton } from "./AddQuestionButton";
import { CoverImageField } from "./CoverImageField";
import {
  FORM_DESCRIPTION_CLASS,
  FORM_DIVIDER_CLASS,
  FORM_TITLE_CLASS,
  FormPaper,
  FormSectionTitle,
} from "./FormPaper";
import { showAlert } from "../../lib/alertDialog";
import { cn } from "../../lib/utils";
import { createQuestion } from "./question-types";
import type {
  Question,
  QuestionTypeOption,
  QuestionTypeValue,
} from "./question-types";
import { SortableQuestionCard } from "./SortableQuestionCard";

type FormSectionProps = {
  title: string;
  /** Why the section exists, under its title. */
  description: string;
  questionTypes: QuestionTypeOption[];
  showAiAnalyze?: boolean;
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  /** The question open for editing, across both sections; the rest show as previews. */
  activeQuestionId: string | null;
  onActivateQuestion: (id: string) => void;
};


/** A textarea as tall as its text: one line empty, more as the author writes or pastes. */
function AutoGrowTextarea(props: ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const fit = () => {
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    };
    fit();
    // Narrower card, more wrapped lines. (No ResizeObserver in old browsers / tests.)
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [props.value]);
  return <textarea ref={ref} {...props} />;
}

const demographicQuestionTypes: QuestionTypeOption[] = [
  {
    value: "choice",
    label: "Choice",
    icon: (
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[#1e55c5] bg-transparent text-[#1e55c5]">
        <Circle className="fill-current" size={10} strokeWidth={0} />
      </span>
    ),
  },
  {
    value: "text",
    label: "Text",
    icon: (
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-xs border border-[#1e55c5] bg-transparent text-[#1e55c5]">
        <Type size={14} strokeWidth={3} />
      </span>
    ),
  },
];

const feedbackQuestionTypes: QuestionTypeOption[] = [
  {
    value: "text",
    label: "Text",
    icon: (
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-xs border border-[#1e55c5] bg-white text-[#1e55c5]">
        <Type size={14} strokeWidth={3} />
      </span>
    ),
  },
];

function FormSection({
  title,
  description,
  questionTypes,
  showAiAnalyze = false,
  questions,
  onQuestionsChange,
  activeQuestionId,
  onActivateQuestion,
}: FormSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // A new question opens straight away, ready to type into.
  const addQuestion = (type: QuestionTypeValue) => {
    const question = createQuestion(type, crypto.randomUUID());
    onQuestionsChange([...questions, question]);
    onActivateQuestion(question.id);
  };

  const updateQuestion = (updated: Question) => {
    onQuestionsChange(
      questions.map((question) =>
        question.id === updated.id ? updated : question,
      ),
    );
  };

  const removeQuestion = (id: string) => {
    onQuestionsChange(questions.filter((question) => question.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = questions.findIndex(
      (question) => question.id === active.id,
    );
    const newIndex = questions.findIndex((question) => question.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    onQuestionsChange(arrayMove(questions, oldIndex, newIndex));
  };

  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${title}-title`}>
      <FormSectionTitle id={`${title}-title`}>{title}</FormSectionTitle>
      <p className="m-0 -mt-1 text-[13px] text-[#726f6f]">{description}</p>

      {questions.length > 0 ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={questions.map((question) => question.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex w-full flex-col gap-7.5">
              {questions.map((question) => (
                <SortableQuestionCard
                  isActive={question.id === activeQuestionId}
                  key={question.id}
                  onActivate={() => onActivateQuestion(question.id)}
                  onChange={updateQuestion}
                  onDelete={() => removeQuestion(question.id)}
                  question={question}
                  showAiAnalyze={showAiAnalyze}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}

      <AddQuestionButton
        onAddQuestion={addQuestion}
        questionTypes={questionTypes}
      />
    </section>
  );
}

export type CreateFormCardProps = {
  value: FormEditorModel;
  onChange: (partial: Partial<FormEditorModel>) => void;
};

const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_COVER_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

function revokeIfBlobUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function CreateFormCard({ value, onChange }: CreateFormCardProps) {
  const { coverImageUrl } = value;
  // One question open at a time (like Google Forms); none when the form first loads.
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // A press outside the open card closes it. Not inside dialogs or menus, which render
  // elsewhere in the page (portals) but belong to what's being edited.
  useEffect(() => {
    if (activeQuestionId === null) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('[data-active-question], [role="dialog"], [role="alertdialog"], [role="menu"]')) return;
      setActiveQuestionId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeQuestionId]);

  // The actual upload happens on save (see App.tsx / EditFormPage.tsx) — a
  // brand-new form has no id yet to upload against, so selecting a file here just
  // stages it and previews it locally.
  const handleSelectImage = (file: File) => {
    if (!ALLOWED_COVER_IMAGE_TYPES.includes(file.type)) {
      void showAlert("Please choose a PNG, JPEG, WEBP, or GIF image.", {
        title: "Can't use this image",
      });
      return;
    }
    if (file.size > MAX_COVER_IMAGE_BYTES) {
      void showAlert("Please choose an image under 5MB.", {
        title: "Image too large",
      });
      return;
    }
    revokeIfBlobUrl(coverImageUrl);
    onChange({
      coverImageUrl: URL.createObjectURL(file),
      coverImageFile: file,
    });
  };

  const handleRemoveImage = () => {
    revokeIfBlobUrl(coverImageUrl);
    onChange({ coverImageUrl: null, coverImageFile: null });
  };

  return (
    <FormPaper
      className="min-h-[657px] max-[760px]:min-h-[560px]"
      aria-labelledby="create-form-title"
    >
      <div className="flex w-full flex-col gap-5">
        <CoverImageField
          imageUrl={coverImageUrl}
          onRemoveImage={handleRemoveImage}
          onSelectImage={handleSelectImage}
        />

        <div className="flex flex-col gap-3">
          <input
            className={cn(FORM_TITLE_CLASS, "w-full border-0 bg-transparent p-0 leading-[25.376px] outline-none placeholder:text-[#616161]")}
            aria-label="Form title"
            id="create-form-title"
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Untitled form"
            value={value.title}
          />
          <AutoGrowTextarea
            className={cn(FORM_DESCRIPTION_CLASS, "w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-[#616161]")}
            aria-label="Form description"
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Form description"
            rows={1}
            value={value.description}
          />
        </div>

        <div className={FORM_DIVIDER_CLASS} />

        <FormSection
          activeQuestionId={activeQuestionId}
          onActivateQuestion={setActiveQuestionId}
          onQuestionsChange={(questions) =>
            onChange({ demographic: questions })
          }
          questions={value.demographic}
          description="Who's answering, e.g. year or program. Used to filter and compare results."
          questionTypes={demographicQuestionTypes}
          title="Demographic"
        />

        <div className={FORM_DIVIDER_CLASS} />

        <FormSection
          activeQuestionId={activeQuestionId}
          onActivateQuestion={setActiveQuestionId}
          onQuestionsChange={(questions) => onChange({ feedback: questions })}
          questions={value.feedback}
          questionTypes={feedbackQuestionTypes}
          description="What you want to learn. Written answers here are grouped into topics by AI."
          showAiAnalyze
          title="Feedback"
        />
      </div>
    </FormPaper>
  );
}
