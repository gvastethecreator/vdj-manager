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

  test("persists resource edits inside the demo adapter only", async () => {
    const services = createDemoRuntimeServices();
    const files = await services.listVdjConfigFiles("ignored");
    const mapperFile = files.find((file) => file.name.endsWith(".vdjmap"));
    const padFile = files.find((file) => file.name.endsWith(".vdjpad"));
    expect(mapperFile).toBeDefined();
    expect(padFile).toBeDefined();

    await services.updateVdjSettings("ignored", { browserColumns: "title,artist,rating" });
    expect((await services.getVdjSettings("ignored")).find((entry) => entry.key === "browserColumns")?.value)
      .toBe("title,artist,rating");

    const mapper = await services.getVdjMapper("ignored", mapperFile!.path);
    mapper.device = "Demo Controller MK2";
    await services.updateVdjMapper("ignored", mapperFile!.path, mapper);
    expect((await services.getVdjMapper("ignored", mapperFile!.path)).device).toBe("Demo Controller MK2");
    expect(await services.readVdjConfigFile("ignored", mapperFile!.path)).toContain("Demo Controller MK2");

    const pad = await services.getVdjPadDocument("ignored", padFile!.path);
    pad.attributes.name = "Performance 2";
    await services.updateVdjPadDocument("ignored", padFile!.path, pad);
    expect((await services.getVdjPadDocument("ignored", padFile!.path)).attributes.name).toBe("Performance 2");
  });
});
