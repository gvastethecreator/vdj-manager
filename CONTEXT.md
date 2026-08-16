# VirtualDJ library management language

This vocabulary covers the persistent VirtualDJ resources that the application reads, validates, and changes.

## Terms

**VirtualDJ library**: The complete persistent set of VirtualDJ resources that describes and supports a user's collection.

**VirtualDJ resource**: A persistent file managed by the application, such as `database.xml`, settings, playlists, mappers, or pads.

**Critical mutation**: An operation that changes one or more VirtualDJ resources and succeeds only when the library remains consistent.

**Library workspace**: The main product area for browsing, checking, and repairing the music collection and its references.

**Resource studio**: The advanced area for inspecting and editing individual VirtualDJ resources outside the main library workflow.

**VirtualDJ browser**: The navigation model that organizes Folder List, File List, Sideview, and File Info.

**Discovered entry**: A local file visible to the library browser that is not yet catalogued in `database.xml`.

**Explicit cataloguing**: The controlled flow that validates and persists a discovered entry in `database.xml`.

**Integrity check**: Diagnosis that finds broken references, missing files, and other inconsistencies without owning the repair flow.

**Path reconciliation**: The specialized flow that aligns a broken library reference with the file's real location without reinterpreting musical metadata.

**Reference collision**: A selected reconciliation path already belongs to another library entry.

**Rename**: A critical mutation that changes a file name without changing its folder.

**Library removal**: A critical mutation that removes a catalogued entry, either only from the database or together with the physical file according to an explicit mode.

**Mutation recovery**: The flow that resolves an interrupted critical mutation before new mutations are allowed for the same library.

## Relationships

- A VirtualDJ library contains one or more VirtualDJ resources.
- A critical mutation changes resources and fails if the library becomes inconsistent.
- The library workspace works with the collection; the resource studio works with specialized files.
- A discovered entry joins the catalogued library only through explicit cataloguing.
- Integrity checks diagnose problems; path reconciliation owns repair.
- A reference collision blocks reconciliation and requires review.
- Rename preserves the parent folder.
- Mutation recovery completes before new critical mutations run for the same library.

## Example

> **Developer:** “If a critical mutation renames a file and then `database.xml` fails to update, is that success?”
>
> **Domain expert:** “No. The VirtualDJ library must remain consistent or the mutation fails.”
