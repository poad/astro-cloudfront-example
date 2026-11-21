import { Errored, Show } from '@solidjs/web';

export function TextForm(props: {
  label?: string;
  id: string;
  type: string;
  required?: boolean;
  value?: string | number | string[];
  onChange?: (value: string) => void;
}) {
  const safeProps = props ?? {};
  const {
    id = '',
    label = '',
    type = 'text',
    required = false,
    value,
    onChange,
  } = safeProps;
  return (
    <Errored fallback={err => <p>{(err() as { message: string }).message}</p>}>
      <div class='bg-white rounded mx-auto p-1 h-fit w-1/5 pt-6'>
        <form class="flex flex-col gap-1 w-full pb-2">
          <Show when={label}>
            <label for={id} class="text-sm">
              {label}
              <Show when={required}>
                <span class='text-sm text-red-400'>
                  {' '}
                  (required)
                </span>
              </Show>
            </label>
          </Show>
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.currentTarget.value)}
            required={required}
            class="rounded-md border border-solid border-slate-400 hover:border-slate-400"
          />
        </form>
        <button class="w-full rounded-md bg-blue-700 text-white">Submit</button>
      </div>
    </Errored>
  );
}
