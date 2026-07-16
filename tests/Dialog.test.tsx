import { expect, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { ConfirmDialog } from "../src/components/Dialog";

function DialogHarness({ onConfirm = () => undefined }: { onConfirm?: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="background">
      <button type="button" onClick={() => setOpen(true)}>Abrir</button>
      <ConfirmDialog
        open={open}
        title="Confirmar remoción"
        description="Esta acción cambia la Biblioteca VirtualDJ."
        confirmLabel="Remover"
        destructive
        onCancel={() => setOpen(false)}
        onConfirm={onConfirm}
      >
        <p>2 pistas seleccionadas</p>
      </ConfirmDialog>
    </div>
  );
}

test("focuses Cancel, traps Tab, marks background inert and restores focus on Escape", () => {
  const view = render(<DialogHarness />);
  const opener = screen.getByRole("button", { name: "Abrir" });
  opener.focus();
  fireEvent.click(opener);

  const cancel = screen.getByRole("button", { name: "Cancelar" });
  const close = screen.getByRole("button", { name: "Cerrar diálogo" });
  const confirm = screen.getByRole("button", { name: "Remover" });
  expect(cancel).toHaveFocus();
  expect((view.container as HTMLElement & { inert?: boolean }).inert).toBe(true);

  close.focus();
  fireEvent.keyDown(document, { key: "Tab", code: "Tab", shiftKey: true });
  expect(confirm).toHaveFocus();
  fireEvent.keyDown(document, { key: "Tab", code: "Tab" });
  expect(close).toHaveFocus();

  fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  expect((view.container as HTMLElement & { inert?: boolean }).inert).toBe(false);
});

test("confirms once and blocks dismissal while the async action is busy", async () => {
  let calls = 0;
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  render(<DialogHarness onConfirm={() => { calls += 1; return pending; }} />);
  fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
  const confirm = screen.getByRole("button", { name: "Remover" });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  expect(calls).toBe(1);
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await act(async () => {
    release?.();
    await pending;
  });
  expect(screen.getByRole("button", { name: "Remover" })).not.toBeDisabled();
});
