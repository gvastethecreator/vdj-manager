import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { PaneSeparator } from "../src/components/PaneSeparator";

test("moves by keyboard, reaches both limits and resets with Enter", () => {
  const moves: number[] = [];
  const values: number[] = [];
  let resets = 0;
  render(<PaneSeparator label="Ajustar árbol" value={248} min={208} max={360} onMove={(delta) => moves.push(delta)} onSet={(value) => values.push(value)} onReset={() => { resets += 1; }} />);
  const separator = screen.getByRole("separator", { name: "Ajustar árbol" });
  expect(separator).toHaveAttribute("aria-valuenow", "248");
  fireEvent.keyDown(separator, { key: "ArrowRight" });
  fireEvent.keyDown(separator, { key: "ArrowLeft" });
  fireEvent.keyDown(separator, { key: "Home" });
  fireEvent.keyDown(separator, { key: "End" });
  fireEvent.keyDown(separator, { key: "Enter" });
  expect(moves).toEqual([16, -16]);
  expect(values).toEqual([208, 360]);
  expect(resets).toBe(1);
});
