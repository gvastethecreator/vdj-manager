import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { PaneSeparator } from "../src/components/PaneSeparator";

test("moves by keyboard and resets with Home", () => {
  const moves: number[] = [];
  let resets = 0;
  render(<PaneSeparator label="Ajustar árbol" value={248} min={208} max={360} onMove={(delta) => moves.push(delta)} onReset={() => { resets += 1; }} />);
  const separator = screen.getByRole("separator", { name: "Ajustar árbol" });
  expect(separator).toHaveAttribute("aria-valuenow", "248");
  fireEvent.keyDown(separator, { key: "ArrowRight" });
  fireEvent.keyDown(separator, { key: "ArrowLeft" });
  fireEvent.keyDown(separator, { key: "Home" });
  expect(moves).toEqual([16, -16]);
  expect(resets).toBe(1);
});
