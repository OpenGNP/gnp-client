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
import { Bold, Circle, Info, Italic, Link, List, Type } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import type { FormEditorModel } from "../../hooks/useFormEditorModel";
import { ActiveFilterBar } from "../dashboard/ActiveFilterBar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
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
import { insertLink, renderMarkdown, toggleBullets, toggleMarker } from "../../lib/inlineMarkdown";
import { cn } from "../../lib/utils";
import { createQuestion } from "./question-types";
import type {
  Question,
  QuestionTypeOption,
  QuestionTypeValue,
} from "./question-types";
import { SortableQuestionCard } from "./SortableQuestionCard";
import { randomId } from "../../lib/randomId";

type FormSectionProps = {
  id: string;
  title: string;
  /** Why the section exists, under its title. */
  description: string;
  questionTypes: QuestionTypeOption[];
  showAiAnalyze?: boolean;
  optional?: boolean;
  /** Shown behind an ⓘ next to the title. */
  info?: ReactNode;
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
      // scrollHeight leaves out the border (the underline); add it back so nothing clips.
      element.style.height = `${element.scrollHeight + element.offsetHeight - element.clientHeight}px`;
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

type Edit = { text: string; start: number; end: number };

const FORMAT_BUTTONS: {
  key?: string;
  label: string;
  icon: typeof Bold;
  apply: (text: string, start: number, end: number) => Edit;
}[] = [
  { key: "b", label: "Bold", icon: Bold, apply: (t, s, e) => toggleMarker(t, s, e, "**") },
  { key: "i", label: "Italic", icon: Italic, apply: (t, s, e) => toggleMarker(t, s, e, "_") },
  { key: "k", label: "Link", icon: Link, apply: insertLink },
  { label: "Bulleted list", icon: List, apply: toggleBullets },
];

const DESCRIPTION_FIELD_CLASS = cn(FORM_DESCRIPTION_CLASS, "w-full bg-transparent p-0 border-0 border-b-2 border-transparent pb-1 transition-colors duration-150 outline-none hover:border-[#d2d8e5] focus:border-[#1e55c5]");

/** Description stored as markdown: shown rendered (as respondents see it) until clicked, then a textarea + format bar. */
function DescriptionField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  if (!editing && value.trim()) {
    return (
      <div
        aria-label="Form description, click to edit"
        // Links are for respondents; here a click means "edit".
        className={cn(DESCRIPTION_FIELD_CLASS, "cursor-text whitespace-pre-line [&_a]:pointer-events-none")}
        onClick={() => setEditing(true)}
        onFocus={() => setEditing(true)}
        role="button"
        tabIndex={0}
      >
        {renderMarkdown(value)}
      </div>
    );
  }

  const applyFormat = (apply: (typeof FORMAT_BUTTONS)[number]["apply"]) => {
    const textarea = wrapperRef.current?.querySelector("textarea");
    if (!textarea) return;
    const next = apply(value, textarea.selectionStart, textarea.selectionEnd);
    onChange(next.text);
    requestAnimationFrame(() => textarea.setSelectionRange(next.start, next.end));
  };

  return (
    <div
      className="group flex flex-col gap-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setEditing(false);
      }}
      ref={wrapperRef}
    >
      <AutoGrowTextarea
        className={cn(DESCRIPTION_FIELD_CLASS, "resize-none overflow-hidden placeholder:text-[#616161]")}
        aria-label="Form description"
        autoFocus={editing}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (!(event.metaKey || event.ctrlKey)) return;
          const button = FORMAT_BUTTONS.find((b) => b.key === event.key.toLowerCase());
          if (!button) return;
          event.preventDefault();
          applyFormat(button.apply);
        }}
        placeholder="Form description"
        rows={1}
        value={value}
      />
      <div className="hidden gap-1 group-focus-within:flex">
        {FORMAT_BUTTONS.map(({ label, icon: Icon, apply }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button
                aria-label={label}
                className="inline-flex size-8 items-center justify-center rounded text-[#616161] hover:bg-[#f1f3f4]"
                // Keep focus (and the selection) in the textarea.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyFormat(apply)}
                type="button"
              >
                <Icon size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

const questionTypes: QuestionTypeOption[] = [
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

function FormSection({
  id,
  title,
  description,
  questionTypes,
  showAiAnalyze = false,
  optional = false,
  info,
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
    const question = createQuestion(type, randomId());
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
    <section className="flex flex-col gap-4" aria-labelledby={`${id}-title`}>
      <div className="flex items-baseline gap-2.5">
        <FormSectionTitle id={`${id}-title`}>{title}</FormSectionTitle>
        {optional ? <span className="text-[14px] text-[#726f6f]">Optional</span> : null}
        {info ? (
          <Tooltip>
            <TooltipTrigger
              aria-label={`About ${title}`}
              className="inline-flex size-6 cursor-pointer items-center justify-center self-center rounded-full border-0 bg-transparent text-[#726f6f] hover:text-[#1e55c5] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
            >
              <Info size={16} />
            </TooltipTrigger>
            <TooltipContent
              align="start"
              className="flex w-80 flex-col gap-3 rounded-[10px] p-4 text-[13px] leading-5 whitespace-normal text-[#3f4045]"
              side="bottom"
              sideOffset={8}
            >
              {info}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <p className="m-0 -mt-1 text-[14px] leading-5 text-[#726f6f]">{description}</p>

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
              {questions.map((question, index) => (
                <SortableQuestionCard
                  isActive={question.id === activeQuestionId}
                  key={question.id}
                  number={index + 1}
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
        analysed={showAiAnalyze}
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
            // Google Forms-style: an underline on hover (editable), blue while editing.
            className={cn(FORM_TITLE_CLASS, "w-full bg-transparent p-0 leading-tight placeholder:text-[#616161] border-0 border-b-2 border-transparent pb-1 transition-colors duration-150 outline-none hover:border-[#d2d8e5] focus:border-[#1e55c5]")}
            aria-label="Form title"
            id="create-form-title"
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Untitled form"
            value={value.title}
          />
          <DescriptionField onChange={(description) => onChange({ description })} value={value.description} />
        </div>

        <div className={FORM_DIVIDER_CLASS} />

        <FormSection
          activeQuestionId={activeQuestionId}
          onActivateQuestion={setActiveQuestionId}
          onQuestionsChange={(questions) =>
            onChange({ demographic: questions })
          }
          questions={value.demographic}
          description="Questions about the people answering, like their year, name or food allergies."
          optional
          info={
            <>
              <p className="m-0">
                Choice questions here become filters on your dashboard, so you can see results for one group
                at a time.
              </p>
              {/* The dashboard's own chips, look-only. */}
              <div className="rounded-[8px] bg-[#f5f9ff] p-3" inert>
                <ActiveFilterBar
                  chips={[{ id: "year", group: "Year", value: "Year 1", onRemove: () => {} }]}
                  onClearAll={() => {}}
                />
              </div>
              <p className="m-0 text-[#726f6f]">Text answers are kept with each response. AI doesn't read them.</p>
            </>
          }
          id="demographic"
          questionTypes={questionTypes}
          title="About your respondents"
        />

        <div className={FORM_DIVIDER_CLASS} />

        <FormSection
          activeQuestionId={activeQuestionId}
          onActivateQuestion={setActiveQuestionId}
          onQuestionsChange={(questions) => onChange({ feedback: questions })}
          questions={value.feedback}
          questionTypes={questionTypes}
          description="Your main questions, like what people liked or what should improve."
          id="feedback"
          showAiAnalyze
          title="Your questions"
        />
      </div>
    </FormPaper>
  );
}
