import { Button } from "@kobalte/core/button";
import { TextField } from "@kobalte/core/text-field";
import { Show } from "solid-js";

export function TextForm(props: {
  label?: string;
  id: string;
  type: string;
  required?: boolean;
  value?: string | number | string[];
  onChange?: (value: string) => void;
}) {
  const {
    id,
    label,
    type,
    required,
    value,
    onChange,
  } = props;
  return (
    <div class='bg-white rounded mx-auto p-1 h-fit w-1/5 pt-6'>
      <TextField class="flex flex-col gap-1 w-full pb-2">
        <Show when={label}>
          <TextField.Label for={id} class="text-sm">
            {label}
            <Show when={required}>
              <span class='text-sm text-red-400'>
                {' '}
                (required)
              </span>
            </Show>
          </TextField.Label>
        </Show>
        <TextField.Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.currentTarget.value)}
          required={required}
          class="rounded-md border border-solid border-slate-400 hover:border-slate-400"
        />
      </TextField>
      <Button class="w-full rounded-md bg-blue-700 text-white">Submit</Button>
    </div>
  );
}
