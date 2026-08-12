"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";

type FoundationFormValues = {
  label: string;
};

export function FoundationForm() {
  const [submittedLabel, setSubmittedLabel] = useState<string>();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<FoundationFormValues>({ defaultValues: { label: "" } });

  const onSubmit = ({ label }: FoundationFormValues) => {
    setSubmittedLabel(label);
  };

  return (
    <form className="form-stack" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="field">
        <label htmlFor="foundation-label">確認用ラベル</label>
        <input
          id="foundation-label"
          aria-describedby={errors.label ? "foundation-label-error" : undefined}
          aria-invalid={errors.label ? "true" : "false"}
          {...register("label", {
            required: "確認用ラベルを入力してください。",
            maxLength: { value: 40, message: "40文字以内で入力してください。" },
          })}
        />
        {errors.label ? (
          <p className="field-error" id="foundation-label-error" role="alert">
            {errors.label.message}
          </p>
        ) : null}
      </div>
      <Button loading={isSubmitting} type="submit">
        入力を確認
      </Button>
      {submittedLabel ? (
        <p className="form-success" role="status">
          「{submittedLabel}」を確認しました。
        </p>
      ) : null}
    </form>
  );
}
