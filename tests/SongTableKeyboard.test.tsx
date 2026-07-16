import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { demoSongs } from "../src/lib/demoData";
import { EditableCell, SongTableRow, type RenderHelpers } from "../src/components/SongTable";

const song = demoSongs[0];

test("selects a focused song row with Enter and Space", () => {
  const selected: number[] = [];
  render(
    <table>
      <tbody>
        <SongTableRow
          song={song}
          rowColor={null}
          active={false}
          selected={false}
          onSelect={(next) => selected.push(next.index)}
        >
          <td>{song.file_name}</td>
        </SongTableRow>
      </tbody>
    </table>,
  );

  const row = screen.getByRole("row", { name: `Seleccionar ${song.file_name}` });
  fireEvent.keyDown(row, { key: "Enter" });
  fireEvent.keyDown(row, { key: " " });
  expect(selected).toEqual([song.index, song.index]);
});

test("opens inline editing by keyboard and commits or cancels from the input", () => {
  const starts: string[] = [];
  let commits = 0;
  let cancels = 0;
  const baseHelpers: RenderHelpers = {
    rowColor: null,
    onStartEdit: (_songIndex, columnKey) => starts.push(columnKey),
  };
  const view = render(
    <EditableCell song={song} columnKey="title" value={song.title} helpers={baseHelpers} />,
  );

  const trigger = screen.getByRole("button", { name: `Editar title de ${song.file_name}` });
  fireEvent.keyDown(trigger, { key: "Enter" });
  fireEvent.keyDown(trigger, { key: " " });
  fireEvent.keyDown(trigger, { key: "F2" });
  expect(starts).toEqual(["title", "title", "title"]);

  view.rerender(
    <EditableCell
      song={song}
      columnKey="title"
      value={song.title}
      helpers={{
        ...baseHelpers,
        editState: { songIndex: song.index, columnKey: "title", value: song.title ?? "" },
        onEditCommit: () => { commits += 1; },
        onEditCancel: () => { cancels += 1; },
      }}
    />,
  );
  const input = screen.getByRole("textbox", { name: `Editar title de ${song.file_name}` });
  fireEvent.keyDown(input, { key: "Enter" });
  fireEvent.keyDown(input, { key: "Escape" });
  expect(commits).toBe(1);
  expect(cancels).toBe(1);
});
