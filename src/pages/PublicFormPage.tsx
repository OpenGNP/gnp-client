import { Check, Send, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { submitFeedback, type FeedbackAnswerPayload } from "../api/feedback";
import type { ApiFormField } from "../api/forms";
import formArchitecture from "../assets/form-architecture.png";
import logoGnp from "../assets/logo.png";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { publicFormByTokenQuery, sessionQuery } from "../api/queries";
import { useNow } from "../hooks/useNow";
import { ApiError } from "../lib/api";
import { logout } from "../lib/auth";
import { deriveResponseState, formatDateTime } from "../lib/responseWindow";
import { PublicFormSkeleton } from "../components/skeletons/PublicFormSkeleton";
import { cn } from "../lib/utils";

const OTHER_VALUE = "__other__";
const TEXTAREA_MAX_LENGTH = 2000;

type TextAnswer = { kind: "text"; value: string };
type ChoiceAnswer = {
  kind: "choice";
  optionIds: number[];
  other: string | null;
};
type Answer = TextAnswer | ChoiceAnswer;

function isChoice(field: ApiFormField) {
  return field.fieldType === "radio" || field.fieldType === "checkbox";
}

function initialAnswers(fields: ApiFormField[]): Record<number, Answer> {
  const answers: Record<number, Answer> = {};
  for (const field of fields) {
    answers[field.id] = isChoice(field)
      ? { kind: "choice", optionIds: [], other: null }
      : { kind: "text", value: "" };
  }
  return answers;
}

function isAnswered(answer: Answer | undefined): boolean {
  if (!answer) return false;
  if (answer.kind === "text") return answer.value.trim() !== "";
  return (
    answer.optionIds.length > 0 ||
    (answer.other !== null && answer.other.trim() !== "")
  );
}

function buildAnswerPayload(
  fields: ApiFormField[],
  answers: Record<number, Answer>,
): FeedbackAnswerPayload[] {
  const payload: FeedbackAnswerPayload[] = [];
  for (const field of fields) {
    const answer = answers[field.id];
    if (!answer) continue;

    if (answer.kind === "text") {
      const text = answer.value.trim();
      if (text)
        payload.push({
          fieldId: field.id,
          answerText: text.slice(0, TEXTAREA_MAX_LENGTH),
        });
      continue;
    }

    for (const optionId of answer.optionIds) {
      payload.push({ fieldId: field.id, answerOptionId: optionId });
    }
    if (answer.other !== null) {
      const text = answer.other.trim();
      if (text)
        payload.push({
          fieldId: field.id,
          answerText: text.slice(0, TEXTAREA_MAX_LENGTH),
        });
    }
  }
  return payload;
}

function describeLoadError(error: unknown): {
  title: string;
  body: string;
  canSignIn?: boolean;
  canSwitchAccount?: boolean;
} {
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 404) {
    return {
      title: "This form isn't available",
      body: "It may have been unpublished or removed.",
    };
  }
  if (status === 401) {
    return {
      title: "Sign-in required",
      body: "This form is limited. Sign in to respond.",
      canSignIn: true,
    };
  }
  if (status === 403) {
    return {
      title: "No access",
      body: "You don't have permission to respond to this form. Sign in with an account that has access.",
      canSwitchAccount: true,
    };
  }
  return {
    title: "Something went wrong",
    body:
      error instanceof ApiError
        ? error.message
        : "The form could not be loaded. Please try again.",
  };
}

const inputClass =
  "w-full rounded-lg border border-input bg-white px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary";

function Shell({
  children,
  recordsName = false,
}: {
  children: React.ReactNode;
  /** True when the form's `recordName` setting attributes responses to the respondent. */
  recordsName?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#f5f9ff]">
      <div className="sticky top-0 z-10 flex justify-center bg-[#f5f9ff] px-3 pt-6 pb-3 sm:px-4 sm:pt-10">
        <div className="w-full max-w-105">
          <Link aria-label="gnp home" className="inline-block" to="/">
            <img alt="gnp" className="h-9" src={logoGnp} />
          </Link>
        </div>
      </div>
      <div className="flex justify-center px-3 pb-6 sm:px-4 sm:pb-10">
        <div className="w-full max-w-105">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {children}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            {recordsName
              ? "Your name has been collected but won't be shared publicly."
              : "Your feedback is anonymous and confidential."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Notice({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-10 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function AccountBar({
  email,
  onSwitch,
  className,
}: {
  email: string;
  onSwitch: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground", className)}>
      <span>
        Signed in as <span className="font-semibold text-foreground">{email}</span>
      </span>
      <button
        className="cursor-pointer font-semibold text-primary hover:underline"
        onClick={onSwitch}
        type="button"
      >
        Switch account
      </button>
    </div>
  );
}

function ChoiceField({
  field,
  answer,
  onChange,
}: {
  field: ApiFormField;
  answer: ChoiceAnswer;
  onChange: (next: ChoiceAnswer) => void;
}) {
  const options = field.fieldOptions
    .slice()
    .sort((a, b) => (a.optionOrder ?? 0) - (b.optionOrder ?? 0));

  if (field.fieldType === "checkbox") {
    const toggle = (optionId: number, checked: boolean) => {
      const optionIds = checked
        ? [...answer.optionIds, optionId]
        : answer.optionIds.filter((id) => id !== optionId);
      onChange({ ...answer, optionIds });
    };

    return (
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <label
            className="flex cursor-pointer items-center gap-3"
            key={option.id}
          >
            <Checkbox
              checked={answer.optionIds.includes(option.id)}
              onCheckedChange={(value) => toggle(option.id, value === true)}
            />
            <span className="text-sm text-foreground">
              {option.optionLabel}
            </span>
          </label>
        ))}
        {field.allowOther ? (
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox
                checked={answer.other !== null}
                onCheckedChange={(value) =>
                  onChange({
                    ...answer,
                    other: value === true ? (answer.other ?? "") : null,
                  })
                }
              />
              <span className="text-sm text-foreground">Other</span>
            </label>
            {answer.other !== null ? (
              <input
                aria-label={`${field.fieldLabel ?? "Question"} Other`}
                className={cn(inputClass, "ml-8 max-w-[calc(100%-2rem)]")}
                onChange={(event) =>
                  onChange({ ...answer, other: event.target.value })
                }
                placeholder="Your answer"
                value={answer.other}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  const value =
    answer.other !== null
      ? OTHER_VALUE
      : answer.optionIds[0] !== undefined
        ? String(answer.optionIds[0])
        : "";

  return (
    <RadioGroup
      onValueChange={(next) =>
        onChange(
          next === OTHER_VALUE
            ? { ...answer, optionIds: [], other: answer.other ?? "" }
            : { ...answer, optionIds: [Number(next)], other: null },
        )
      }
      value={value}
    >
      {options.map((option) => (
        <label
          className="flex cursor-pointer items-center gap-3"
          key={option.id}
        >
          <RadioGroupItem value={String(option.id)} />
          <span className="text-sm text-foreground">{option.optionLabel}</span>
        </label>
      ))}
      {field.allowOther ? (
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-3">
            <RadioGroupItem value={OTHER_VALUE} />
            <span className="text-sm text-foreground">Other</span>
          </label>
          {answer.other !== null ? (
            <input
              aria-label={`${field.fieldLabel ?? "Question"} Other`}
              className={cn(inputClass, "ml-8 max-w-[calc(100%-2rem)]")}
              onChange={(event) =>
                onChange({ ...answer, other: event.target.value })
              }
              placeholder="Your answer"
              value={answer.other}
            />
          ) : null}
        </div>
      ) : null}
    </RadioGroup>
  );
}

export function PublicFormPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const hasToken = typeof token === "string" && token.length > 0;

  const now = useNow(15_000);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  // Once someone starts answering, a window boundary passing keeps the form on screen
  // (with a banner) rather than yanking their work — see the gate below.
  const [hasInteracted, setHasInteracted] = useState(false);

  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [submitError, setSubmitError] = useState("");

  const handleSubmitAnother = () => {
    if (form) setAnswers(initialAnswers(form.fields));
    setHasInteracted(false);
    setSubmitError("");
    setSubmitted(false);
  };

  // Fetched through React Query (one request even under StrictMode), never served
  // from cache — see publicFormByTokenQuery. The answers are seeded from it once, during
  // render, so nothing a respondent has typed is replaced by a later refetch.
  const formResult = useQuery({ ...publicFormByTokenQuery(token ?? ""), enabled: hasToken });
  const [seeded, setSeeded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const form = formResult.data ?? null;
  if (form && !seeded) {
    setSeeded(true);
    setAnswers(initialAnswers(form.fields));
    // Already responded (one-response-per-person, and we know who they are) —
    // skip straight to the thank-you screen instead of a form that would just
    // 409 on submit. `canSubmitAnother` there already hides "Submit another".
    setSubmitted(form.alreadyResponded);
  }

  // Read here, not through AuthProvider — this page sits outside it (see main.tsx).
  const viewer = useQuery(sessionQuery()).data ?? null;
  // Sign out, then sign back in and land on this same form with the other account.
  async function switchAccount() {
    await logout();
    navigate("/login", { state: { from: `/f/${token}`, forUserId: null } });
  }
  // Only forms that require sign-in show who's answering.
  const showAccount = viewer !== null && form !== null && form.accessType !== null && form.accessType !== "public";

  const status: "loading" | "error" | "ready" | "submitted" = !hasToken || formResult.isError
    ? "error"
    : !seeded
      ? "loading"
      : submitted
        ? "submitted"
        : "ready";
  const loadError: ReturnType<typeof describeLoadError> = !hasToken
    ? { title: "This form isn't available", body: "The link looks incomplete." }
    : formResult.isError
      ? describeLoadError(formResult.error)
      : { title: "", body: "" };

  if (status === "loading") {
    return (
      <Shell>
        <PublicFormSkeleton />
      </Shell>
    );
  }

  if (status === "error") {
    return (
      <Shell>
        <Notice
          action={
            loadError.canSignIn ? (
              <Button
                onClick={() =>
                  navigate("/login", { state: { from: `/f/${token}` } })
                }
              >
                Sign in
              </Button>
            ) : loadError.canSwitchAccount ? (
              <div className="flex flex-col items-center gap-3">
                {viewer ? (
                  <p className="text-xs text-muted-foreground">
                    You're signed in as{" "}
                    <span className="font-semibold text-foreground">{viewer.email}</span>
                  </p>
                ) : null}
                <Button onClick={() => void switchAccount()}>Switch account</Button>
              </div>
            ) : undefined
          }
          body={loadError.body}
          title={loadError.title}
        />
      </Shell>
    );
  }

  if (status === "submitted") {
    const canSubmitAnother = !form?.oneResponsePerPerson;

    return (
      <Shell recordsName={form?.recordName ?? false}>
        <div className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex size-24 items-center justify-center rounded-full bg-primary">
            <Check className="size-11 text-white" strokeWidth={3} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-bold text-primary">
              Your feedback has been sent
            </p>
            <p className="text-sm text-foreground">
              Thank you for sharing your thoughts
            </p>
          </div>
          <div className="mt-8 flex w-full flex-col gap-3">
            {canSubmitAnother ? (
              <Button
                className="w-full rounded-full"
                onClick={handleSubmitAnother}
                size="lg"
              >
                Submit another response
              </Button>
            ) : null}
            <Button asChild className="w-full rounded-full" size="lg" variant="outline">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  if (!form) {
    return (
      <Shell>
        <Notice body="Please try again." title="Something went wrong" />
      </Shell>
    );
  }

  // Recomputed on every `useNow` tick, so the form opens/closes on its own as the
  // start/end time passes — no reload needed.
  const responseState = deriveResponseState(
    {
      isPublished: true,
      acceptingResponses: form.acceptingResponses,
      startDate: form.startDate,
      endDate: form.endDate,
    },
    now,
  );
  const isOpen = responseState === "open";

  if (!isOpen && !hasInteracted) {
    if (responseState === "scheduled") {
      return (
        <Shell recordsName={form.recordName ?? false}>
          <Notice
            body={
              form.startDate
                ? `This form opens on ${formatDateTime(form.startDate)}.`
                : "This form opens later."
            }
            title="Not open yet"
          />
        </Shell>
      );
    }
    // Two different causes land here: the schedule's end date passing, or the
    // "accepting responses" toggle being off (endDate, if any, may not be reached
    // yet) — only claim a specific close date when the window actually ended.
    return (
      <Shell recordsName={form.recordName ?? false}>
        <Notice
          body={
            form.endDate && now > Date.parse(form.endDate)
              ? `This form closed on ${formatDateTime(form.endDate)}.`
              : "This form is closed."
          }
          title="This form is closed"
        />
      </Shell>
    );
  }

  const demographicFields = form.fields
    .filter((field) => field.section === "demographic")
    .sort((a, b) => (a.fieldOrder ?? 0) - (b.fieldOrder ?? 0));
  const feedbackFields = form.fields
    .filter((field) => field.section === "feedback")
    .sort((a, b) => (a.fieldOrder ?? 0) - (b.fieldOrder ?? 0));

  const setAnswer = (fieldId: number, next: Answer) => {
    setHasInteracted(true);
    setAnswers((current) => ({ ...current, [fieldId]: next }));
  };

  const closedNotice =
    responseState === "scheduled"
      ? "This form isn't open for responses yet."
      : "This form just closed — you can no longer submit a response.";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitState === "submitting") return;

    if (!isOpen) {
      setSubmitError(
        closedNotice || "This form isn't accepting responses right now.",
      );
      return;
    }

    const allFields = [...demographicFields, ...feedbackFields];
    const missing = allFields.filter(
      (field) => field.isRequired && !isAnswered(answers[field.id]),
    );
    if (missing.length > 0) {
      setSubmitError(
        `Please answer: ${missing.map((field) => field.fieldLabel ?? "Untitled question").join(", ")}`,
      );
      return;
    }

    const payload = buildAnswerPayload(allFields, answers);
    if (payload.length === 0) {
      setSubmitError("Answer at least one question before submitting.");
      return;
    }

    setSubmitError("");
    setSubmitState("submitting");
    try {
      await submitFeedback({ formId: form.id, answers: payload });
      setSubmitState("idle");
      setSubmitted(true);
    } catch (error) {
      setSubmitState("idle");
      // status 0 = no reply (offline, timed out): axios's own message isn't for respondents.
      setSubmitError(
        error instanceof ApiError && error.status > 0
          ? error.message
          : "Could not submit your response. Check your connection and try again.",
      );
    }
  };

  return (
    <Shell recordsName={form.recordName ?? false}>
      <img
        alt=""
        className="h-44 w-full object-cover"
        src={form.coverImageUrl ?? formArchitecture}
      />
      <div className="px-6 pt-6 pb-8">
        <h1 className="text-xl font-bold text-foreground">
          {form.formTitle ?? "Untitled form"}
        </h1>
        {showAccount ? (
          <AccountBar className="mt-1" email={viewer.email} onSwitch={() => void switchAccount()} />
        ) : null}
        {form.formDescription ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {form.formDescription}
          </p>
        ) : null}

        {!isOpen ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
            {closedNotice}
          </div>
        ) : null}

        <form className="mt-6 flex flex-col gap-6" onSubmit={handleSubmit}>
          {demographicFields.length > 0 ? (
            <div className="flex flex-col gap-5">
              <h2 className="text-sm font-bold text-primary">Demographic</h2>
              {demographicFields.map((field, index) => {
                const answer = answers[field.id];
                return (
                  <div className="flex flex-col gap-3" key={field.id}>
                    <p className="text-sm font-semibold text-foreground">
                      {index + 1}. {field.fieldLabel ?? "Untitled question"}
                      {field.isRequired ? (
                        <span className="ml-1 text-destructive">*</span>
                      ) : null}
                    </p>
                    {answer?.kind === "choice" ? (
                      <ChoiceField
                        answer={answer}
                        field={field}
                        onChange={(next) => setAnswer(field.id, next)}
                      />
                    ) : field.fieldType === "textarea" ? (
                      <textarea
                        className={cn(inputClass, "min-h-24 resize-y")}
                        onChange={(event) =>
                          setAnswer(field.id, {
                            kind: "text",
                            value: event.target.value,
                          })
                        }
                        placeholder="Your answer"
                        value={answer?.kind === "text" ? answer.value : ""}
                      />
                    ) : (
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setAnswer(field.id, {
                            kind: "text",
                            value: event.target.value,
                          })
                        }
                        placeholder="Your answer"
                        value={answer?.kind === "text" ? answer.value : ""}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {feedbackFields.length > 0 ? (
            <div className="flex flex-col gap-5">
              <h2 className="text-sm font-bold text-primary">Feedback</h2>
              {feedbackFields.map((field) => {
                const answer = answers[field.id];
                const text = answer?.kind === "text" ? answer.value : "";
                return (
                  <div className="flex flex-col gap-2" key={field.id}>
                    <p className="text-sm font-semibold text-foreground">
                      {field.fieldLabel ?? "Untitled question"}
                      {field.isRequired ? (
                        <span className="ml-1 text-destructive">*</span>
                      ) : null}
                    </p>
                    {answer?.kind === "choice" ? (
                      <ChoiceField
                        answer={answer}
                        field={field}
                        onChange={(next) => setAnswer(field.id, next)}
                      />
                    ) : field.fieldType === "textarea" ? (
                      <div className="relative">
                        <textarea
                          className={cn(inputClass, "min-h-32 resize-y pb-6")}
                          maxLength={TEXTAREA_MAX_LENGTH}
                          onChange={(event) =>
                            setAnswer(field.id, {
                              kind: "text",
                              value: event.target.value,
                            })
                          }
                          placeholder="Long answer text"
                          value={text}
                        />
                        <span className="pointer-events-none absolute right-3 bottom-2.5 text-xs text-muted-foreground">
                          {text.length}/{TEXTAREA_MAX_LENGTH}
                        </span>
                      </div>
                    ) : (
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setAnswer(field.id, {
                            kind: "text",
                            value: event.target.value,
                          })
                        }
                        placeholder="Your answer"
                        value={text}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}

          <Button
            className="w-full"
            disabled={submitState === "submitting" || !isOpen}
            size="lg"
            type="submit"
          >
            <Send className="size-4" />
            {submitState === "submitting" ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </div>
    </Shell>
  );
}
