import { describe, expect, test } from "bun:test";
import { createDemoRuntimeServices } from "../src/lib/runtimeServices";

describe("demo runtime services", () => {
  test("returns deterministic library and resource fixtures without filesystem input", async () => {
    const services = createDemoRuntimeServices();
    expect(services.mode).toBe("demo");
    expect((await services.loadDatabase("ignored"))[0].title).toBe("You & Me");
    expect((await services.getVdjSettings("ignored")).length).toBeGreaterThan(0);
    expect((await services.listPlaylists("ignored"))[0].name).toBe("Warm up");
    expect(await services.selectDirectory({ title: "VDJ", purpose: "virtualdj" })).toContain("VirtualDJ");
  });

  test("keeps demo writes in memory and reports typed outcomes", async () => {
    const services = createDemoRuntimeServices();
    const original = "D:\\Music\\Club\\Track.mp3";
    const update = await services.updateSongTags("ignored", original, { title: "Edited" });
    const move = await services.moveFilesOp("ignored", [original], "D:\\Music\\Archive");
    expect(update.status).toBe("completed");
    expect(move.summary.completed).toBe(1);
    expect(move.items[0].originalFilePath).toBe(original);
  });
});

