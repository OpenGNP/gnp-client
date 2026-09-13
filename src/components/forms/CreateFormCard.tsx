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

import type { FormEditorModel } from "../../hooks/useFormEditorModel";
import { AddQuestionButton } from "./AddQuestionButton";
import { CoverImageField } from "./CoverImageField";
import { createQuestion } from "./question-types";
import type {
  Question,
  QuestionTypeOption,
  QuestionTypeValue,
} from "./question-types";
import { SortableQuestionCard } from "./SortableQuestionCard";

type FormSectionProps = {
  title: string;
  questionTypes: QuestionTypeOption[];
  showAiAnalyze?: boolean;
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
};

const dividerClass = "h-px w-full bg-[#e8eaf1]";

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
  questionTypes,
  showAiAnalyze = false,
  questions,
  onQuestionsChange,
}: FormSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addQuestion = (type: QuestionTypeValue) => {
    onQuestionsChange([
      ...questions,
      createQuestion(type, crypto.randomUUID()),
    ]);
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
      <h2
        className="m-0 text-[32px] leading-[25.376px] font-semibold tracking-[0.32px] text-[#616161] max-[560px]:text-[28px]"
        id={`${title}-title`}
      >
        {title}
      </h2>

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
                  key={question.id}
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

const MAX_COVER_IMAGE_BYTES = 3 * 1024 * 1024;

/** No file-hosting backend exists, so the cover is stored inline as a data URL. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function CreateFormCard({ value, onChange }: CreateFormCardProps) {
  const { coverImageUrl } = value;

  const handleSelectImage = async (file: File) => {
    if (file.size > MAX_COVER_IMAGE_BYTES) {
      window.alert("Please choose an image under 3MB.");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    onChange({ coverImageUrl: dataUrl });
  };

  return (
    <section
      className="min-h-[657px] w-full max-w-[978px] overflow-hidden rounded-[10px] bg-white pt-15.25 pr-17.5 pb-28.75 pl-20 shadow-[0_1px_0_rgba(22,29,57,0.02)] max-[760px]:min-h-[560px] max-[760px]:px-6 max-[760px]:pt-9 max-[760px]:pb-12"
      aria-labelledby="create-form-title"
    >
      <div className="flex w-full flex-col gap-5">
        <CoverImageField
          imageUrl={coverImageUrl}
          onRemoveImage={() => onChange({ coverImageUrl: null })}
          onSelectImage={handleSelectImage}
        />

        <div className="flex flex-col gap-3">
          <input
            className="w-full border-0 bg-transparent p-0 text-[32px] leading-[25.376px] font-semibold tracking-[0.32px] text-[#616161] outline-none placeholder:text-[#616161] max-[560px]:text-[28px]"
            aria-label="Form title"
            id="create-form-title"
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Untitled form"
            value={value.title}
          />
          <textarea
            className="h-6 w-full resize-none border-0 bg-transparent p-0 text-[16px] leading-6 font-normal tracking-[0.16px] text-[#616161] outline-none placeholder:text-[#616161]"
            aria-label="Form description"
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Form description"
            value={value.description}
          />
        </div>

        <div className={dividerClass} />

        <FormSection
          onQuestionsChange={(questions) =>
            onChange({ demographic: questions })
          }
          questions={value.demographic}
          questionTypes={demographicQuestionTypes}
          title="Demographic"
        />

        <div className={dividerClass} />

        <FormSection
          onQuestionsChange={(questions) => onChange({ feedback: questions })}
          questions={value.feedback}
          questionTypes={feedbackQuestionTypes}
          showAiAnalyze
          title="Feedback"
        />
      </div>
    </section>
  );
}
