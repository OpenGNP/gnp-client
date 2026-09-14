import type {
  ApiFormDetail,
  ApiFormField,
  CreateFormPayload,
  FieldOptionPayload,
  FormAccessType,
  FormFieldPayload,
  FormSection,
  FormStatus,
  UpdateFormPayload,
} from "../api/forms";
import type { Question } from "../components/forms/question-types";
import {
  defaultFormAccessSettings,
  type FormAccessSettings,
} from "../hooks/useFormAccessSettings";
import type { FormEditorModel } from "../hooks/useFormEditorModel";

// --- Question <-> API field -------------------------------------------------

/** A question the author never actually filled in — dropped rather than saved. */
function isQuestionEmpty(question: Question): boolean {
  if (question.question.trim() !== "") return false;
  if (question.type === "choice")
    return question.options.every((option) => option.trim() === "");
  return true;
}

function questionToField(
  question: Question,
  section: FormSection,
  order: number,
): FormFieldPayload {
  const base = {
    fieldLabel: question.question.trim() || "Untitled question",
    section,
    isRequired: question.required,
    fieldOrder: order,
  };

  if (question.type === "text") {
    return {
      ...base,
      fieldType: question.answerLength === "long" ? "textarea" : "text",
      // The Feedback section is what the AI pipeline analyses; Demographic is not.
      analyzeWithAi: section === "feedback",
      allowOther: false,
    };
  }

  const options: FieldOptionPayload[] = question.options
    .map((label) => label.trim())
    .filter((label) => label.length > 0)
    .map((label, index) => ({
      optionLabel: label,
      optionValue: label,
      optionOrder: index + 1,
    }));

  return {
    ...base,
    fieldType: question.allowMultiple ? "checkbox" : "radio",
    analyzeWithAi: false,
    allowOther: question.hasOther,
    options,
  };
}

function fieldToQuestion(field: ApiFormField): Question {
  const id = String(field.id);
  const label = field.fieldLabel ?? "";
  const required = field.isRequired ?? false;

  if (field.fieldType === "radio" || field.fieldType === "checkbox") {
    const options = field.fieldOptions
      .slice()
      .sort((a, b) => (a.optionOrder ?? 0) - (b.optionOrder ?? 0))
      .map((option) => option.optionLabel ?? "");

    return {
      id,
      type: "choice",
      question: label,
      options: options.length > 0 ? options : [""],
      allowMultiple: field.fieldType === "checkbox",
      hasOther: field.allowOther,
      required,
    };
  }

  return {
    id,
    type: "text",
    question: label,
    answerLength: field.fieldType === "textarea" ? "long" : "short",
    required,
  };
}

/** Ordered field payloads for the whole form: demographic section first, then feedback. */
export function buildFieldPayloads(model: FormEditorModel): FormFieldPayload[] {
  const fields: FormFieldPayload[] = [];
  let order = 1;

  for (const question of model.demographic) {
    if (isQuestionEmpty(question)) continue;
    fields.push(questionToField(question, "demographic", order));
    order += 1;
  }
  for (const question of model.feedback) {
    if (isQuestionEmpty(question)) continue;
    fields.push(questionToField(question, "feedback", order));
    order += 1;
  }

  return fields;
}

// --- Access settings <-> API ----------------------------------------------

type AccessPayload = {
  accessType: FormAccessType;
  acceptingResponses: boolean;
  recordName: boolean;
  oneResponsePerPerson: boolean;
  allowedEmails: string[];
};

export function accessSettingsToPayload(
  settings: FormAccessSettings,
): AccessPayload {
  const byWhoCanFill = ((): Omit<AccessPayload, "acceptingResponses"> => {
    switch (settings.whoCanFill) {
      case "anyone":
        return {
          accessType: "public",
          recordName: false,
          oneResponsePerPerson: settings.anyoneOneResponsePerPerson,
          allowedEmails: [],
        };
      case "specific":
        return {
          accessType: "specific",
          recordName: settings.specificRecordName,
          oneResponsePerPerson: settings.specificOneResponsePerPerson,
          allowedEmails: settings.specificEmails,
        };
      case "organization":
      default:
        return {
          accessType: "organization",
          recordName: settings.organizationRecordName,
          oneResponsePerPerson: settings.organizationOneResponsePerPerson,
          allowedEmails: [],
        };
    }
  })();

  return { ...byWhoCanFill, acceptingResponses: settings.acceptingResponses };
}

export function accessSettingsFromForm(
  form: ApiFormDetail,
): FormAccessSettings {
  const emails = form.formAllowedUsers.map((entry) => entry.user.email);
  const recordName = form.recordName ?? false;
  const oneResponse = form.oneResponsePerPerson ?? false;
  const base: FormAccessSettings = {
    ...defaultFormAccessSettings,
    acceptingResponses: form.acceptingResponses,
    startDate: form.startDate,
    endDate: form.endDate,
    specificEmails: emails,
  };

  if (form.accessType === "public") {
    return {
      ...base,
      whoCanFill: "anyone",
      anyoneOneResponsePerPerson: oneResponse,
    };
  }
  if (form.accessType === "specific") {
    return {
      ...base,
      whoCanFill: "specific",
      specificRecordName: recordName,
      specificOneResponsePerPerson: oneResponse,
    };
  }
  return {
    ...base,
    whoCanFill: "organization",
    organizationRecordName: recordName,
    organizationOneResponsePerPerson: oneResponse,
  };
}

// --- Model <-> request payloads ------------------------------------------

export function buildCreateFormPayload(
  model: FormEditorModel,
  settings: FormAccessSettings,
  options: { status: FormStatus; folderId?: number },
): CreateFormPayload {
  const description = model.description.trim();
  return {
    formTitle: model.title.trim() || "Untitled form",
    formDescription: description || undefined,
    status: options.status,
    folderId: options.folderId,
    // Create has nothing to clear, so a null (unchecked) date is just omitted.
    startDate: settings.startDate ?? undefined,
    endDate: settings.endDate ?? undefined,
    ...accessSettingsToPayload(settings),
    fields: buildFieldPayloads(model),
  };
}

export function buildUpdateFormPayload(
  model: FormEditorModel,
  settings: FormAccessSettings,
  options: { status?: FormStatus; includeFields?: boolean } = {},
): UpdateFormPayload {
  const { status, includeFields = true } = options;
  return {
    formTitle: model.title.trim() || "Untitled form",
    formDescription: model.description.trim(),
    // Sent as-is (string | null) so unchecking a date actually clears it server-side.
    startDate: settings.startDate,
    endDate: settings.endDate,
    ...(status ? { status } : {}),
    ...accessSettingsToPayload(settings),
    ...(includeFields ? { fields: buildFieldPayloads(model) } : {}),
  };
}

export function formDetailToModel(detail: ApiFormDetail): FormEditorModel {
  const sorted = detail.formFields
    .slice()
    .sort((a, b) => (a.fieldOrder ?? 0) - (b.fieldOrder ?? 0));

  return {
    title: detail.formTitle ?? "Untitled form",
    description: detail.formDescription ?? "",
    coverImageUrl: detail.coverImageUrl ?? null,
    coverImageFile: null,
    demographic: sorted
      .filter((field) => field.section === "demographic")
      .map(fieldToQuestion),
    feedback: sorted
      .filter((field) => field.section !== "demographic")
      .map(fieldToQuestion),
  };
}
